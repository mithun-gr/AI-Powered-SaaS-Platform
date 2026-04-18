import { NextRequest } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are "Morchy", the AI Business Concierge for Morchantra — a premium B2B enterprise services platform.

You help clients with these 8 core services:
1. Legal Advisory (contracts, compliance, dispute resolution, NDA, IP)
2. Insurance Services (policy applications, renewals, claims, coverage analysis)
3. AWS Cloud Setup (architecture, deployment, migration, DevOps)
4. Azure Cloud Setup (Microsoft Azure infrastructure, AD, hybrid cloud)
5. MERN Fullstack Development (React, Node.js, MongoDB, Express, APIs)
6. AI Chatbot Building (automation, NLP, LLM integration, workflow AI)
7. Data Analytics (dashboards, BI tools, visualization, data pipelines)
8. Civil & Property Support (property management, civil engineering, real estate)

Behavior Rules:
- Be concise, warm, and highly professional. Keep responses under 150 words.
- Use clear formatting with bullet points or numbered lists when listing items.
- Never fabricate pricing or specific deadlines — say "contact our team for a custom quote."
- For account-specific data (invoices, request status), say "please check your dashboard."
- If asked about request tracking, documents, or payments, redirect to the dashboard.
- If you detect frustration or distress, offer to escalate to a human expert immediately.
- Always end with a follow-up question or a helpful next step.
- Do not use markdown headers (##, ###). Use plain text with line breaks.
- If you cannot help with something, say: "Please email support@morchantra.com"

Tone: Professional, encouraging, solution-focused.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Fallback plain response for error states
function errorStream(text: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(text));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return errorStream("AI service is not configured. Please contact support@morchantra.com");
  }

  let message: string;
  let history: ChatMessage[] = [];
  let expertContext: string | undefined;

  try {
    const body = await req.json();
    message = body.message?.trim() ?? "";
    history = body.history ?? [];
    expertContext = body.expertContext;
  } catch {
    return errorStream("Invalid request. Please try again.");
  }

  if (!message) return errorStream("Please send a message.");

  const finalSystemPrompt = expertContext ? 
    `You are a Morchantra professional expert handling a client request. ${expertContext} Keep responses concise, professional, and directly address the user's issue.` : 
    SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: "system", content: finalSystemPrompt },
    ...history.slice(-10),           // last 10 turns for context
    { role: "user", content: message },
  ];

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.5,
        max_tokens: 350,
        stream: true,          // ← REAL streaming enabled
      }),
    });
  } catch {
    return errorStream("I'm having trouble connecting right now. Please try again in a moment.");
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text().catch(() => "unknown");
    console.error("Groq error:", groqRes.status, errText);
    return errorStream("I'm having trouble connecting right now. Please try again in a moment.");
  }

  // ── Pipe Groq SSE → plain token stream to client ─────────────────────────
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep any incomplete line at the tail
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token: string = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // Malformed chunk — skip
            }
          }
        }
      } catch {
        // Stream interrupted (e.g. client disconnected)
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",       // disable nginx buffering
    },
  });
}
