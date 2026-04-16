"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeIn } from "@/lib/animations";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === "admin") {
                    router.push("/admin");
                } else {
                    router.push("/dashboard");
                }
            } catch (e) {
                localStorage.removeItem("user");
            }
        }
    }, [router]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        // Email Domain Validation
        const allowedDomains = ["@gmail.com", "@icloud.com"];
        const emailDomain = formData.email.toLowerCase().split("@")[1];
        const isAllowed = allowedDomains.some(domain => formData.email.toLowerCase().endsWith(domain));

        if (!isAllowed) {
            setError("Only Gmail and iCloud email addresses are allowed.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Sign up the user in Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        role: "client"
                    }
                }
            });

            if (signUpError) throw signUpError;

            // 2. Since this is the frontend, and to avoid RLS insert issues at signup,
            // later we can add an auth trigger in Postgres. But for now, we'll try to insert 
            // the user row manually as well. (If it fails due to RLS, the auth user is still created)
            if (data.user) {
                await supabase.from("users").insert([
                    {
                        id: data.user.id,
                        name: formData.name,
                        email: formData.email,
                        role: "client"
                    }
                ]).select();
            }

            // 3. Fallback: also save to local storage so the current UI continues working immediately
            const newUser = {
                id: data.user?.id || Date.now().toString(),
                name: formData.name,
                email: formData.email,
                role: "client",
            };
            localStorage.setItem("user", JSON.stringify(newUser));

            // 4. Log registration event for admin to see
            if (data.user) {
                await supabase.from("activity_logs").insert([{
                    user_id: data.user.id,
                    event_type: "registration",
                    description: `New user registered: ${formData.name} (${formData.email})`
                }]);
            }

            // Redirect to dashboard
            router.push("/dashboard");

        } catch (err: any) {
            console.error("Signup error:", err);
            setError(err.message || "An error occurred during signup");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-black to-primary/10">
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
                        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
                        <p className="text-center text-muted-foreground text-sm">
                            Join us and access premium services
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}

                            <div className="flex items-start gap-2 text-sm">
                                <input type="checkbox" className="mt-0.5 rounded" required />
                                <span className="text-muted-foreground">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </span>
                            </div>

                            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        Create Account
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link href="/login" className="text-primary hover:underline font-semibold">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Protected by industry-standard encryption
                </p>
            </motion.div>
        </div>
    );
}
