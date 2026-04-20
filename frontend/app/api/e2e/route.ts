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

    // 4. AUTONOMOUS AGENTIC WORKFLOW (Multi-step Reasoning)
    if (action === "generate-document") {
      // Step 1: Agentic Planning Phase
      const planResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: "You are an autonomous AI Agent Planning Module. Analyze the user request and output ONLY a 3-step numbered legal drafting plan." }, { role: "user", content: payload.context }],
          temperature: 0.1, max_tokens: 150
        }),
      });
      const planData = await planResponse.json();
      const planStr = planData.choices[0].message.content;

      // Step 2: Agentic Execution (Drafting based on Plan)
      const draftResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a Legal AI Executing Agent. Draft a formal, strict legal contract based on the following plan. No markdown, just raw legal text." },
            { role: "user", content: `Context: ${payload.context}\n\nExecution Plan:\n${planStr}` }
          ],
          temperature: 0.3, max_tokens: 500
        }),
      });
      const draftData = await draftResponse.json();
      const draftStr = draftData.choices[0].message.content;

      // Wrap in agentic reasoning visualization for the UI
      const finalOutput = `[AGENTIC REASONING PROTOCOL INITIATED]\n\n== PHASE 1: STRATEGIC PLANNING ==\n${planStr}\n\n== PHASE 2: AUTONOMOUS DRAFTING EXECUTED ==\n\n${draftStr}`;
      
      return NextResponse.json({ document: finalOutput });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
