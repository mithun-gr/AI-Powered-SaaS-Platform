"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getAuthSession } from "@/lib/auth-session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check for officially active HTTP session cookie
    const session = getAuthSession();
    if (session) {
      if (session.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md w-full"
      >
        <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight mb-2">
            <span className="text-white">Mor</span>
            <span className="text-primary">chantra</span>
            </h1>
            <p className="text-muted-foreground text-lg">
            Premium Business Services Portal
            </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full pt-4">
          <Link href="/login" className="w-full">
            <Button className="w-full text-lg h-12 bg-primary hover:bg-primary/90 transition-colors">
                Sign In
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">Client Dashboard</Button>
            </Link>
            <Link href="/admin" className="w-full">
              <Button variant="outline" className="w-full">Admin Panel</Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
              Secure authentication powered by Morchantra Identity
          </p>
        </div>
      </motion.div>
    </div>
  );
}
