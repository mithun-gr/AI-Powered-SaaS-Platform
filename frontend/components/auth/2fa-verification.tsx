"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeIn } from "@/lib/animations";

interface TwoFactorVerificationProps {
    onVerify: (code: string) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error?: string;
}

export function TwoFactorVerification({ onVerify, onBack, isLoading, error }: TwoFactorVerificationProps) {
    const [code, setCode] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length === 6) {
            onVerify(code);
        }
    };

    return (
        <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="w-full max-w-md"
        >
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="text-white">Mor</span>
                    <span className="text-primary">chantra</span>
                </h1>
                <p className="text-muted-foreground">Premium Business Services Portal</p>
            </div>

            <Card className="red-glow">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Authenticator Verification</CardTitle>
                    <CardDescription className="text-center">
                        Enter the 6-digit code from your Microsoft Authenticator or Google Authenticator app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="000 000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="text-center text-2xl tracking-[0.3em] font-bold h-14"
                                required
                                autoFocus
                            />
                            <p className="text-xs text-center text-muted-foreground">
                                Enter the dynamic code shown in your app
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button type="submit" className="w-full h-12 gap-2" disabled={isLoading || code.length !== 6}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify Code"
                                )}
                            </Button>
                            
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={onBack} 
                                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                                disabled={isLoading}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Button>
                        </div>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                className="text-sm text-primary hover:underline font-medium"
                                onClick={() => alert("Verification code resent! (Simulated)")}
                            >
                                Didn't receive a code? Resend
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}
