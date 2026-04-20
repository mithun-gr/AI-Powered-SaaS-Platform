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
      if (!payload?.image) {
          return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      const visionResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            { 
               role: "user", 
               content: [
                 { type: "text", text: "You are an advanced OCR engine. Analyze this receipt or invoice and extract the following details precisely as strict JSON and nothing else: { \"vendor\": \"string\", \"date\": \"string\", \"amount\": \"string\", \"confidence\": \"string\" }. If missing, guess or write N/A." },
                 { type: "image_url", image_url: { url: payload.image } }
               ] 
            }
          ],
          temperature: 0.1, max_tokens: 150
        }),
      });

      const visionData = await visionResponse.json();
      const rawText = visionData.choices?.[0]?.message?.content || "";
      
      let extractedJSON = { vendor: "N/A", date: "N/A", amount: "N/A", confidence: "Low" };
      
      try {
          // Robust JSON extraction using regex to grab text between the first and last curly braces
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0].trim());
              // Standardize keys (force lowercase comparison to handle LLM variations)
              const standardized: any = {};
              Object.keys(parsed).forEach(k => standardized[k.toLowerCase()] = parsed[k]);
              
              extractedJSON = {
                  vendor: standardized.vendor || standardized.merchant || "Unknown",
                  date: standardized.date || standardized.time || "N/A",
                  amount: standardized.amount || standardized.total || "N/A",
                  confidence: standardized.confidence || "High"
              };
          }
      } catch (e) {
          console.error("OCR Parse Error:", e);
      }

      return NextResponse.json(extractedJSON);
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
