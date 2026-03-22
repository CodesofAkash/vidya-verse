"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link — no token found.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setStatus("success");
      setMessage("Email verified successfully!");

      // Redirect to login after 3 seconds so user can sign in
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-md"
      >
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold gradient-text">Email Verified! ✅</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-24 w-24 text-destructive mx-auto" />
            <h2 className="text-3xl font-bold text-destructive">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}