"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Mail, Lock, Loader2, MessageCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { fadeIn } from "@/lib/animations";
import { MOCK_USERS } from "@/lib/dummy-data";
import { TwoFactorVerification } from "@/components/auth/2fa-verification";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import { setAuthCookie, clearAuthCookie, getAuthSession } from "@/lib/auth-session";

function LoginContent() {
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true); // default ON — 7-day persistence across shutdowns
    const [role, setRole] = useState<"client" | "admin">("client");
    const [loggedInUser, setLoggedInUser] = useState<any>(null);
    const [requires2FA, setRequires2FA] = useState(false);
    const [pendingUser, setPendingUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check existing auth cookie (middleware already validated this server-side)
        const session = getAuthSession();
        if (session) {
            setLoggedInUser({ role: session.role, email: session.email, name: session.name });
        }
    }, []);

    /** Redirect after a successful login — respects ?next= param */
    const redirectAfterLogin = (userRole: "client" | "admin") => {
        const next = searchParams.get("next");
        if (next && next.startsWith("/") && !next.startsWith("//")) {
            router.replace(next);
        } else {
            router.replace(userRole === "admin" ? "/admin" : "/dashboard");
        }
    };

    const handleContinue = () => {
        redirectAfterLogin(loggedInUser?.role === "admin" ? "admin" : "client");
    };

    const handleLogout = () => {
        clearAuthCookie();
        localStorage.removeItem("user");
        setLoggedInUser(null);
        setRole("client");
        setRequires2FA(false);
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError("");
        try {
            const CLIENT_ID = "655323194437-gvtes1sgeo0sbg5triv8e2jfehp457o1.apps.googleusercontent.com";
            const redirectUri = `${window.location.origin}/auth/callback`;
            const next = searchParams.get("next") || "/dashboard";

            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: "openid email profile",
                access_type: "offline",
                prompt: "select_account",
                state: next, // pass destination so callback can redirect correctly
            });

            // Hard redirect to Google — no Supabase dependency, 100% free forever
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        } catch (err: any) {
            setError("Google sign-in failed. Please try again.");
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Check for role mismatch (Admin check)
            if (role === "client" && (email === "admin@morchantra.com" || email.includes("admin"))) {
                setError("It looks like you're an Admin. Please switch to the 'Admin Dashboard' tab.");
                setIsLoading(false);
                return;
            }

            let loggedIn = false;

            // ── Try Supabase Auth first ──
            try {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                let userRole = "client";
                let twoFactorEnabled = false;
                let twoFactorSecret = null;
                let combinedUser: any = { email, id: data.user.id };

                const { data: dbUser } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                if (dbUser) {
                    userRole = dbUser.role;
                    twoFactorEnabled = dbUser.two_factor_enabled;
                    twoFactorSecret = dbUser.two_factor_secret;
                    combinedUser = { ...combinedUser, ...dbUser };
                } else {
                    userRole = data.user.user_metadata?.role || "client";
                    combinedUser = { ...combinedUser, role: userRole, name: data.user.user_metadata?.name || "Client" };
                }

                if (twoFactorEnabled) {
                    setPendingUser({ ...combinedUser, twoFactorSecret });
                    setRequires2FA(true);
                    setIsLoading(false);
                } else {
                    // ✅ Write auth cookie — middleware reads this server-side
                    setAuthCookie(userRole as "client" | "admin", email, combinedUser.name || "User", rememberMe);
                    localStorage.setItem("user", JSON.stringify(combinedUser));
                    redirectAfterLogin(userRole as "client" | "admin");
                }
                loggedIn = true;

            } catch (supabaseErr: any) {
                // Supabase is offline or credentials wrong — try mock users below
                console.warn("Supabase login failed, trying mock users:", supabaseErr.message);
            }

            // ── Fallback: Mock users for development ──
            if (!loggedIn) {
                const normalizedEmail = email.trim().toLowerCase();
                const fallbackUser = MOCK_USERS.find(
                    u => u.email.toLowerCase() === normalizedEmail && u.role === role
                );
                
                if (fallbackUser) {
                    // Make demo123 always work for the demo user, regardless of what they saved in Settings.
                    const storedPw = typeof window !== "undefined"
                        ? localStorage.getItem(`mrc_user_pw_${normalizedEmail}`) ?? fallbackUser.password
                        : fallbackUser.password;

                    if (password !== fallbackUser.password && password !== storedPw) {
                        setError("Invalid email or password. Please check your credentials and try again.");
                        setIsLoading(false);
                    } else {
                        const { password: _pw, ...userWithoutPass } = fallbackUser;
                        setAuthCookie(fallbackUser.role as "client" | "admin", fallbackUser.email, fallbackUser.name, rememberMe);
                        localStorage.setItem("user", JSON.stringify(userWithoutPass));
                        redirectAfterLogin(fallbackUser.role as "client" | "admin");
                    }
                } else {
                    setError("Invalid email or password. Please check your credentials and try again.");
                    setIsLoading(false);
                }
            }

        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setIsLoading(false);
        }

    };

    const handle2FAVerify = async (code: string) => {
        setIsLoading(true);
        setError("");
        try {
            const secret = (pendingUser as any).twoFactorSecret;
            if (!secret) {
                setError("2FA is not configured for this account. Please contact support.");
                setIsLoading(false);
                return;
            }

            // Verify server-side — Node.js crypto, no browser issues
            const res = await fetch("/api/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", token: code, secret }),
            });

            if (!res.ok) {
                if (res.status === 429) {
                    setError("Too many attempts. Please wait a minute and try again.");
                } else {
                    setError("Verification service unavailable. Please try again.");
                }
                setIsLoading(false);
                return;
            }

            const data = await res.json();

            if (data.valid === true) {
                const { password: _pw, ...userWithoutPass } = pendingUser;
                // ✅ Write auth cookie after 2FA success too
                setAuthCookie(pendingUser.role as "client" | "admin", pendingUser.email, pendingUser.name || "User", rememberMe);
                localStorage.setItem("user", JSON.stringify(userWithoutPass));
                redirectAfterLogin(pendingUser.role as "client" | "admin");
            } else {
                setError("Invalid code. Please open your authenticator app and enter the current 6-digit code.");
                setIsLoading(false);
            }
        } catch (err) {
            console.error("2FA login error:", err);
            setError("Connection error during verification. Please try again.");
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-black to-primary/10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8 opacity-0">
                         <h1 className="text-4xl font-bold mb-2">Morchantra</h1>
                    </div>
                    <Card className="opacity-0 min-h-[400px]">
                        <CardContent></CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (loggedInUser) {
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
                    </div>
                    <Card className="red-glow">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <div className="h-20 w-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center mb-4">
                                    <span className="text-3xl font-bold text-primary">
                                        {loggedInUser.name.charAt(0)}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold mb-1">{loggedInUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{loggedInUser.email}</p>
                                <div className="mt-2 inline-block px-3 py-1 bg-secondary rounded-full text-xs font-medium uppercase tracking-wider">
                                    {loggedInUser.role} Account
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Button onClick={handleContinue} className="w-full h-12 text-lg">
                                    Continue to Dashboard
                                </Button>
                                <Button onClick={handleLogout} variant="outline" className="w-full">
                                    Switch Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    if (requires2FA) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-black to-primary/10">
                <TwoFactorVerification 
                    onVerify={handle2FAVerify}
                    onBack={() => setRequires2FA(false)}
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        );
    }

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
                        <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                        <p className="text-center text-muted-foreground text-sm">
                            Access your business portal
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* Role Selector */}
                        <div className="flex p-1 bg-secondary/50 rounded-lg mb-6">
                            <button
                                type="button"
                                onClick={() => setRole("client")}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    role === "client"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Client Portal
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("admin")}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    role === "admin"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Admin Dashboard
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder={role === "admin" ? "admin@morchantra.com" : "john@example.com"}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-3">
                                    <Checkbox 
                                        id="remember" 
                                        checked={rememberMe} 
                                        onCheckedChange={setRememberMe} 
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer group"
                                    >
                                        Remember me
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute mt-6 left-0 bg-secondary px-2 py-1 text-xs rounded shadow-lg pointer-events-none z-10 w-max text-white">
                                          Stay signed in for 7 days
                                        </span>
                                    </label>
                                </div>
                                <Link href="/forgot-password" className="text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        Sign In as {role === "client" ? "Client" : "Admin"}
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* ── Google Sign-In ── */}
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-3 text-muted-foreground tracking-widest">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-background hover:bg-muted/60 text-sm font-medium text-foreground transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Official Google G logo */}
                            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M43.611 20.083H42V20H24V28H35.303C33.654 32.657 29.223 36 24 36C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24C4 35.045 12.955 44 24 44C35.045 44 44 35.045 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#FFC107"/>
                                <path d="M6.306 14.691L12.877 19.51C14.655 15.108 18.961 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.618 9.382C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691Z" fill="#FF3D00"/>
                                <path d="M24 44C29.166 44 33.86 42.023 37.409 38.808L31.219 33.57C29.211 35.097 26.715 36 24 36C18.798 36 14.381 32.683 12.717 28.054L6.195 33.079C9.505 39.556 16.227 44 24 44Z" fill="#4CAF50"/>
                                <path d="M43.611 20.083H42V20H24V28H35.303C34.511 30.237 33.072 32.166 31.216 33.571L31.219 33.57L37.409 38.808C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#1976D2"/>
                            </svg>
                            Sign in with Google
                        </button>

                        <div className="mt-5 text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Link href="/signup" className="text-primary hover:underline font-semibold">
                                Sign up
                            </Link>
                        </div>

                        {/* Demo Credentials — click to auto-fill */}
                        <button
                            type="button"
                            onClick={() => {
                                setEmail(role === "client" ? "demo@morchantra.com" : "admin@morchantra.com");
                                setPassword("demo123");
                            }}
                            className="mt-6 w-full p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                        >
                            <p className="text-xs text-muted-foreground text-center mb-1.5 group-hover:text-primary transition-colors font-medium">
                                Demo {role === "client" ? "Client" : "Admin"} Credentials
                                <span className="ml-1.5 text-[10px] text-primary/70 font-normal">(click to auto-fill)</span>
                            </p>
                            <div className="text-xs text-center space-y-0.5 text-muted-foreground">
                                <p>📧 {role === "client" ? "demo@morchantra.com" : "admin@morchantra.com"}</p>
                                <p>🔑 demo123</p>
                            </div>
                        </button>

                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-black to-primary/10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
