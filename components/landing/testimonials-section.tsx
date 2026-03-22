"use client";

import { useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Computer Science, 3rd Year",
    college: "Government College Chamba",
    image: "👩‍🎓",
    rating: 5,
    text: "VidyaVerse transformed my exam preparation. I found notes I couldn't get anywhere else, and the mentors helped me grasp difficult concepts in Data Structures.",
  },
  {
    name: "Rahul Verma",
    role: "Physics, 2nd Year",
    college: "DAV College Jalandhar",
    image: "👨‍🎓",
    rating: 5,
    text: "The doubt-solving community is incredible! I posted a quantum mechanics question at midnight and got three detailed answers by morning.",
  },
  {
    name: "Anjali Patel",
    role: "Mathematics, 4th Year",
    college: "Government College Chamba",
    image: "👩‍💼",
    rating: 5,
    text: "I started as a student and became a contributor. Now I mentor juniors and earn while helping others. VidyaVerse is more than a platform—it's a community.",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".testimonial-card",
        {
          y: 80,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 ancient-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-crimson)]">
            Student <span className="gradient-text">Success Stories</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Hear from students who transformed their learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card glass rounded-2xl p-8 space-y-6 hover:border-primary/40 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 h-12 w-12 text-primary/10" />

              {/* Rating */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-muted-foreground leading-relaxed relative z-10">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <div className="font-semibold font-[var(--font-crimson)]">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.college}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}