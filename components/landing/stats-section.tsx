"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 10000, suffix: "+", label: "Study Resources", prefix: "" },
  { value: 5000, suffix: "+", label: "Active Students", prefix: "" },
  { value: 500, suffix: "+", label: "Expert Mentors", prefix: "" },
  { value: 95, suffix: "%", label: "Success Rate", prefix: "" },
];

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        onEnter: () => {
          stats.forEach((stat, index) => {
            gsap.to(counts, {
              [index]: stat.value,
              duration: 2,
              ease: "power2.out",
              onUpdate: function () {
                setCounts([...counts]);
              },
            });
          });
        },
        once: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-2">
              <div className="text-5xl md:text-6xl font-bold gradient-text font-[var(--font-crimson)]">
                {stat.prefix}
                {Math.floor(counts[index]).toLocaleString()}
                {stat.suffix}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}