"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);

        // Simulate network request to send reset link
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // For now, default to success since it's a dummy/demo
        setIsSuccess(true);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements (matching login page) */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute top-1/4 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-6"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-extrabold tracking-tight">
                            Mor<span className="text-primary">chantra</span>
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-primary/20 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                            <CardDescription className="text-center text-muted-foreground">
                                {isSuccess 
                                    ? "Check your email for the reset link" 
                                    : "Enter your email and we'll send you a link to reset your password."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div 
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-4 space-y-4"
                                    >
                                        <div className="h-16 w-16 bg-primary/10 rounded-full flex flex-col items-center justify-center">
                                            <CheckCircle2 className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="text-center text-sm text-muted-foreground">
                                            We have sent a secure password reset link to <strong>{email}</strong>. It will expire in 1 hour.
                                        </p>
                                        <div className="pt-4 w-full">
                                            <Link href="/login" className="w-full">
                                                <Button className="w-full" variant="outline">
                                                    Return to Login
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {error && (
                                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                                                    {error}
                                                </div>
                                            )}

                                            <div className="space-y-1 w-full">
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        className="pl-10 bg-secondary/50 border-border"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Sending...
                                                    </span>
                                                ) : (
                                                    "Send Reset Link"
                                                )}
                                            </Button>

                                            <div className="flex justify-center mt-6">
                                                <Link 
                                                    href="/login" 
                                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                    Back to login
                                                </Link>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
