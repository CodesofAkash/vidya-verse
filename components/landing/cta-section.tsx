"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20" />
      <div className="absolute inset-0 ancient-pattern opacity-10" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 glass rounded-3xl p-12 md:p-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Join the Knowledge Revolution</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold font-[var(--font-crimson)] leading-tight">
            Start Your Journey with{" "}
            <span className="gradient-text">VidyaVerse</span> Today
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students who are learning smarter, not harder. 
            Access premium resources, expert mentors, and a thriving community—all for free.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 group text-lg px-8" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free forever • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}