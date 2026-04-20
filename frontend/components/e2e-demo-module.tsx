"use client";

import { useState, useRef } from "react";
import { Camera, FileText, Brain, FileSearch, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// This is an advanced prototyping panel allowing the presentation of the 4 E2E AI Features
export function AdvancedE2EDemo() {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  
  // 1. Biometric Lock State
  const [bioStatus, setBioStatus] = useState<"idle" | "scanning" | "verified">("idle");
  
  // 2. OCR State
  const [ocrStatus, setOcrStatus] = useState<"idle" | "uploading" | "extracted">("idle");
  const [receiptData, setReceiptData] = useState<any>(null);

  // 3. Document Gen State
  const [docContext, setDocContext] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 4. Sentiment State
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);

  const simulateBiometric = async () => {
    setBioStatus("scanning");
    try {
       await fetch("/api/e2e", { method: "POST", body: JSON.stringify({ action: "verify-biometric" }) });
       setBioStatus("verified");
    } catch { setBioStatus("idle"); }
  };

  const simulateOCR = async () => {
    setOcrStatus("uploading");
    try {
       const res = await fetch("/api/e2e", { method: "POST", body: JSON.stringify({ action: "ocr-invoice" }) });
       const data = await res.json();
       setOcrStatus("extracted");
       setReceiptData(data);
    } catch { setOcrStatus("idle"); }
  };

  const handleGenerateDoc = async () => {
    if (!docContext) return;
    setIsGenerating(true);
    try {
       const res = await fetch("/api/e2e", { method: "POST", body: JSON.stringify({ action: "generate-document", payload: { context: docContext } }) });
       const data = await res.json();
       setGeneratedDoc(data.document);
    } catch { } finally { setIsGenerating(false); }
  };

  const testSentiment = async () => {
    if(!chatInput) return;
    setChatResponse("Analyzing via Groq AI Engine...");
    try {
       const res = await fetch("/api/e2e", { method: "POST", body: JSON.stringify({ action: "analyze-sentiment", payload: { text: chatInput } }) });
       const data = await res.json();
       if (data.escalate) {
           setChatResponse(`⚠️ ${data.sentiment} DETECTED. Auto-Escalating to Human Lead Engineer.`);
       } else {
           setChatResponse(`✅ ${data.sentiment}. System normal. Operational constraints met.`);
       }
    } catch { setChatResponse("Error connecting to neural engine."); }
  };

  return (
    <div className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent mb-6 flex items-center gap-2">
        <Brain className="w-6 h-6 text-primary" /> Advanced E2E Innovation Lab
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Camera, title: "Zero-Trust Biometrics" },
          { icon: FileSearch, title: "Invoice OCR" },
          { icon: FileText, title: "Autonomous Contracts" },
          { icon: Brain, title: "Sentiment Trigger" }
        ].map((item, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all",
              activeTab === idx ? "border-primary bg-primary/10" : "border-zinc-800 bg-black/40 hover:bg-zinc-800"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === idx ? "text-primary" : "text-zinc-500")} />
            <span className="text-[10px] font-bold text-center uppercase tracking-widest">{item.title}</span>
          </button>
        ))}
      </div>

      {/* Feature 1: Biometric */}
      {activeTab === 0 && (
        <div className="p-4 bg-black/50 border border-zinc-800 rounded-lg text-center space-y-4">
           <h3 className="text-sm text-zinc-400 border-b border-zinc-800 pb-2 mb-4">Transferring $5,000 USD to Escrow...</h3>
           <div className="h-32 w-32 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-full mx-auto flex items-center justify-center relative overflow-hidden">
              {bioStatus === "idle" && <Camera className="w-8 h-8 text-zinc-600" />}
              {bioStatus === "scanning" && (
                <div className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-primary/50 animate-pulse absolute top-1/2 shadow-[0_0_10px_#ef4444]" />
                  <span className="text-xs text-primary font-bold z-10">SCANNING...</span>
                </div>
              )}
              {bioStatus === "verified" && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center transition-colors">
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                </div>
              )}
           </div>
           
           {bioStatus === "idle" && (
             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                 <button onClick={simulateBiometric} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">
                   <Camera className="w-3.5 h-3.5" /> Face ID
                 </button>
                 <button onClick={simulateBiometric} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-700 hover:text-white transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg> Fingerprint
                 </button>
                 <button onClick={simulateBiometric} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-700 hover:text-white transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10-5 5V2l5 5-10 10"/></svg> Bluetooth Key
                 </button>
             </div>
           )}
           {bioStatus === "verified" && <p className="text-xs text-emerald-400 font-bold">IDENTITY CONFIRMED. TRANSACTION CLEARED.</p>}
        </div>
      )}

      {/* Feature 2: OCR */}
      {activeTab === 1 && (
        <div className="p-4 bg-black/50 border border-zinc-800 rounded-lg space-y-4">
           <div className="border border-dashed border-zinc-700 bg-zinc-900 rounded-xl p-8 text-center">
              {ocrStatus === "idle" && (
                 <button onClick={simulateOCR} className="text-xs text-zinc-400 font-bold hover:text-white flex flex-col items-center gap-2 mx-auto">
                    <FileSearch className="w-6 h-6 border p-1 rounded border-zinc-700" />
                    Upload Receipt (.jpg)
                 </button>
              )}
              {ocrStatus === "uploading" && (
                 <div className="flex flex-col items-center text-primary gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] uppercase font-bold tracking-widest animate-pulse">Running Neural OCR Engine...</span>
                 </div>
              )}
              {ocrStatus === "extracted" && receiptData && (
                 <div className="text-left bg-black p-4 rounded-lg border border-zinc-800 font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                       <span className="text-emerald-400 font-bold">DATA EXTRACTED SUCCESSFULLY</span>
                       <span className="text-zinc-600">CONFIDENCE: {receiptData.confidence}</span>
                    </div>
                    <p><span className="text-zinc-500">VENDOR:</span> {receiptData.vendor}</p>
                    <p><span className="text-zinc-500">DATE:</span> {receiptData.date}</p>
                    <p className="text-xl text-white mt-4"><span className="text-zinc-500 text-xs">TOTAL:</span> {receiptData.amount}</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Feature 3: Contract Gen */}
      {activeTab === 2 && (
        <div className="p-4 bg-black/50 border border-zinc-800 rounded-lg flex flex-col gap-3">
          <input 
            value={docContext} onChange={e => setDocContext(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
            placeholder="E.g., NDA for Morchantra and Cloudflare regarding API."
          />
          <button onClick={handleGenerateDoc} className="bg-white text-black py-2 rounded text-xs font-bold hover:bg-zinc-200 focus:scale-[0.98] transition-transform">
            AUTHOR LEGAL DOCUMENT VIA AI
          </button>
          
          {isGenerating && <div className="text-xs text-primary animate-pulse text-center mt-4">Generative AI Authoring Contract...</div>}
          
          {generatedDoc && (
             <pre className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">
                {generatedDoc}
             </pre>
          )}
        </div>
      )}

      {/* Feature 4: Sentiment */}
      {activeTab === 3 && (
        <div className="p-4 bg-black/50 border border-zinc-800 rounded-lg flex flex-col gap-3">
          <textarea 
            value={chatInput} onChange={e => setChatInput(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white h-24 resize-none"
            placeholder="Type a message to the AI. Try typing something frustrated like 'This system is bad!' to trigger the Auto-Escalation."
          />
          <button onClick={testSentiment} className="bg-primary/20 border border-primary/50 text-primary py-2 rounded text-xs font-bold focus:scale-[0.98] transition-transform">
            [INTERNAL] TEST SENTIMENT ANALYSIS
          </button>
          
          {chatResponse && (
             <div className={cn("p-3 text-xs font-bold rounded-lg text-center", chatResponse.includes("FRUSTRATION") ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-zinc-900 border border-zinc-800 text-zinc-400")}>
                {chatResponse}
             </div>
          )}
        </div>
      )}

      {!activeTab && activeTab !== 0 && (
         <div className="h-32 flex items-center justify-center text-xs text-zinc-600 italic">
            Select an advanced module above to initialize presentation testing.
         </div>
       )}
    </div>
  );
}
