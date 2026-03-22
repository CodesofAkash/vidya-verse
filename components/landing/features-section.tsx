"use client";

import { useEffect, useRef } from "react";
import { BookOpen, MessageSquare, Users, Award, Search, Shield } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: BookOpen,
    title: "VidyaVault",
    description: "Access high-quality notes, PYQs, and study materials curated by top students.",
    color: "primary",
  },
  {
    icon: MessageSquare,
    title: "VidyaManch",
    description: "Ask questions, share knowledge, and collaborate with your peers.",
    color: "accent",
  },
  {
    icon: Users,
    title: "VidyaSetu",
    description: "Connect with experienced mentors for personalized 1-on-1 guidance.",
    color: "secondary",
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Every resource is verified by moderators to ensure accuracy and relevance.",
    color: "primary",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find exactly what you need with advanced filters by subject, semester, and topic.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security and privacy controls.",
    color: "secondary",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        {
          y: 60,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 ancient-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-crimson)]">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed in College</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Four pillars of learning, unified in one seamless platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="feature-card group glass rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
              >
                <div className={`inline-flex p-4 rounded-xl bg-${feature.color}/10 mb-6 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
                  <Icon className={`h-8 w-8 text-${feature.color}`} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 font-[var(--font-crimson)]">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Join thousands of students already learning smarter
          </p>
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background -ml-4 first:ml-0"
              />
            ))}
            <div className="w-12 h-12 rounded-full bg-muted border-2 border-background -ml-4 flex items-center justify-center text-sm font-semibold">
              +5K
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}