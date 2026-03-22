"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, Users, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "VidyaVault",
    subtitle: "High-quality notes & study material",
    position: "top-[18%] left-[12%]", // Library building (left)
    hoverArea: "top-[8%] left-[12%] w-[40%] h-[55%]", // Red-marked library region
    hoverShape: "ellipse(50% 46% at 48% 49%)",
    hoverZ: "z-[31]",
    link: "/vidya-vault",
  },
  {
    icon: MessageSquare,
    title: "VidyaManch",
    subtitle: "Ask and answer doubts",
    position: "top-[20%] right-[-2%]", // Stadium (right)
    hoverArea: "top-[20%] right-[-2%] w-[39%] h-[45%]", // Blue-marked stadium region
    hoverShape: "ellipse(50% 45% at 48% 50%)",
    hoverZ: "z-[32]",
    link: "/vidya-manch",
  },
  {
    icon: Users,
    title: "VidyaSetu",
    subtitle: "1-on-1 mentorship sessions",
    position: "top-[22%] left-[39%]", // Bridge (bottom-left)
    hoverArea: "top-[22%] left-[39%] w-[29%] h-[31%]", // Yellow-marked bridge region
    hoverShape: "ellipse(47% 43% at 50% 50%)",
    hoverZ: "z-[34]",
    link: "/vidya-setu",
  },
  {
    icon: Globe,
    title: "VidyaSangh",
    subtitle: "Join college communities",
    position: "bottom-[24%] left-[40%]", // Community center
    hoverArea: "bottom-[24%] left-[40%] w-[27%] h-[23%]", // Green-marked lower-center region
    hoverShape: "ellipse(48% 44% at 50% 50%)",
    hoverZ: "z-[33]",
    link: "/vidya-sang",
  },
];

export function HeroSection() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearLeaveTimeout = () => {
    if (!leaveTimeoutRef.current) return;
    clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = null;
  };

  const showCard = (index: number) => {
    clearLeaveTimeout();
    setActiveCard(index);
  };

  const scheduleHideCard = () => {
    clearLeaveTimeout();
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveCard(null);
    }, 140);
  };

  return (
    <section className="relative h-screen flex items-center overflow-hidden bg-black">
      {/* Subtle Texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      <div className="container mx-auto px-8 lg:px-16 xl:px-20 relative z-10">
        <div className="grid lg:grid-cols-[48%_52%] gap-10 xl:gap-14 items-center max-w-[1600px] mx-auto">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10 lg:pr-8 xl:pr-10 max-w-[40rem]"
          >
            {/* Inspired Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-2 text-sm text-foreground/85"
            >
              <span className="mt-15">Built by a student, for students</span>
              <span className="text-base mt-15">🏛️</span>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-[4.8rem] lg:text-[6.2rem] xl:text-[7rem] 2xl:text-[7.5rem] font-bold font-[var(--font-crimson)] mt-[-20] leading-[0.88] tracking-tight">
                <span className="block text-primary">Study</span>
                <span className="block text-primary">Solve</span>
                <span className="block text-primary">Succeed</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base lg:text-lg text-foreground/85 max-w-lg leading-relaxed"
            >
              Access notes, ask doubts, and connect with mentors — everything you need to learn faster.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-black font-semibold text-base px-8 h-12 rounded-none shadow-lg"
                asChild
              >
                <Link href="/register">Explore Resources</Link>
              </Button>
            </motion.div>

            {/* Bottom Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <Link
                href="#ai"
                className="text-sm text-foreground/85 hover:text-foreground transition-colors"
              >
                Browse resources or ask a doubt
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Image Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative hidden lg:block lg:-ml-8 xl:-ml-12 lg:pt-6"
          >
            {/* Image Container with Better Blend */}
            <div className="relative w-full aspect-[4/3] max-w-[54rem] ml-auto">
              {/* The Image */}
              <div className="relative w-full h-full z-10 overflow-hidden rounded-[1.5rem] [mask-image:radial-gradient(circle_at_center,black_64%,transparent_100%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_64%,transparent_100%)]">
                <Image
                  src="/vidyaverse-hero-image.png"
                  alt="VidyaVerse Knowledge Universe"
                  fill
                  className="object-cover scale-[1.01]"
                  priority
                  quality={100}
                />

                {/* Side and bottom fades so the image melts into the section background */}
                <div className="absolute inset-y-0 left-0 w-24 pointer-events-none bg-gradient-to-r from-black via-black/55 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-24 pointer-events-none bg-gradient-to-l from-black via-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none bg-gradient-to-t from-black via-black/58 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-24 pointer-events-none bg-gradient-to-b from-black/86 via-black/48 via-45% to-transparent" />
                <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.34)_52%,transparent_100%)]" />

                {/* Hover Areas for Each Building */}
                {features.map((feature, index) => (
                  <Link 
                    key={`hover-${index}`}
                    href={feature.link}
                    className={`absolute ${feature.hoverArea} ${feature.hoverZ} cursor-pointer bg-transparent`}
                    style={{ clipPath: feature.hoverShape }}
                    onMouseEnter={() => showCard(index)}
                    onMouseLeave={scheduleHideCard}
                  />
                ))}

                {/* Feature Cards - Only Show on Hover */}
                <AnimatePresence>
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = activeCard === index;

                    if (!isActive) return null;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`absolute ${feature.position} z-[50]`}
                        onMouseEnter={() => showCard(index)}
                        onMouseLeave={scheduleHideCard}
                      >
                        <Link href={feature.link} className="pointer">
                          <div className="relative bg-black/92 backdrop-blur-xl border border-orange-500/65 rounded-xl p-4 shadow-[0_18px_45px_-20px_rgba(234,88,12,0.55)] min-w-[260px]">
                            {/* Content */}
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-lg bg-orange-500">
                                <Icon className="h-5 w-5 text-black" />
                              </div>
                              <div>
                                <h3 className="font-bold text-base mb-1 font-[var(--font-crimson)] text-white">
                                  {feature.title}
                                </h3>
                                <p className="text-xs text-white/72 leading-relaxed">
                                  {feature.subtitle}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}