"use client";

import { useEffect, useRef } from "react";
import { UserPlus, Upload, CheckCircle, Download } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your free account in seconds",
    step: "01",
  },
  {
    icon: Upload,
    title: "Share Knowledge",
    description: "Upload notes or ask questions",
    step: "02",
  },
  {
    icon: CheckCircle,
    title: "Get Verified",
    description: "Resources reviewed by moderators",
    step: "03",
  },
  {
    icon: Download,
    title: "Access Everything",
    description: "Download verified resources instantly",
    step: "04",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".step-card", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });

      gsap.from(".connecting-line", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        scaleX: 0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 ancient-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-crimson)]">
            How <span className="gradient-text">VidyaVerse</span> Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes and join the knowledge revolution
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary connecting-line origin-left" />

          <div className="grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="step-card relative">
                  <div className="group glass rounded-2xl p-6 text-center space-y-4 hover:border-primary/40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="pt-8 flex justify-center">
                      <div className="inline-flex p-4 rounded-xl bg-primary/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
                        <Icon className="h-10 w-10 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold font-[var(--font-crimson)]">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}