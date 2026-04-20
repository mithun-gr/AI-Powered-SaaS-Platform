import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    // 1. BIOMETRIC (Mocked visual delay for secure payload generation)
    if (action === "verify-biometric") {
      await new Promise(r => setTimeout(r, 1500)); // Simulate deep learning processing
      return NextResponse.json({ verified: true, confidence: 99.2, role: "AUTHORIZED_CEO" });
    }

    // 2. OCR INVOICE EXTRACTION (LLM acting as Vision Parser)
    if (action === "ocr-invoice") {
      await new Promise(r => setTimeout(r, 1200)); 
      // For presentation: simulating OCR buffer extraction
      return NextResponse.json({
        vendor: "Vercel / AWS",
        date: new Date().toISOString().split("T")[0],
        amount: "$3,450.00",
        confidence: "98.7%"
      });
    }

    // 3. SENTIMENT ANALYSIS (True ML Execution via Groq)
    if (action === "analyze-sentiment") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are an emotion detector. Return ONLY ONE WORD: 'FRUSTRATED', 'HAPPY', or 'NEUTRAL'. Based on the user's text." },
            { role: "user", content: payload.text }
          ],
          temperature: 0.1,
          max_tokens: 10
        }),
      });
      const data = await response.json();
      const rawText = data.choices[0].message.content.toUpperCase();
      const isFrustrated = rawText.includes("FRUSTRATED");
      return NextResponse.json({ sentiment: rawText, escalate: isFrustrated });
    }

    // 4. AUTONOMOUS DOCUMENT GEN (True Generative AI)
    if (action === "generate-document") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a top-tier B2B Corporate Lawyer. The user provides context. You write a strictly formatted, multi-paragraph, highly aggressive binding legal document or contract based solely on that context. Include signature lines. Do NOT use markdown. Write in plain formatted text only." },
            { role: "user", content: payload.context }
          ],
          temperature: 0.3,
          max_tokens: 600
        }),
      });
      const data = await response.json();
      return NextResponse.json({ document: data.choices[0].message.content });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
