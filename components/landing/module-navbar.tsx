"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "next-auth/react";

type ModuleNavbarProps = {
  moduleName: string;
  moduleHref: string;
  moduleImageSrc: string;
};

const navLinks = [
  { href: "/", label: "VidyaVerse" },
  { href: "/vidya-vault", label: "VidyaVault" },
  { href: "/vidya-manch", label: "VidyaManch" },
  { href: "/vidya-sang", label: "VidyaSang" },
  { href: "/vidya-setu", label: "VidyaSetu" },
];

export function ModuleNavbar({ moduleName, moduleHref, moduleImageSrc }: ModuleNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut({ redirect: false });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      await signOut({ redirect: false });
      router.push("/");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-background/70 backdrop-blur-md border-b border-border/40"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="h-16 flex items-center justify-between gap-3">
          <Link href={moduleHref} className="flex items-center gap-2 min-w-0">
            <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-border/60 bg-background">
              <Image
                src={moduleImageSrc}
                alt={`${moduleName} logo`}
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="truncate text-lg font-(--font-crimson) gradient-text">
              {moduleName}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks
              .filter((link) => pathname !== link.href)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2 text-foreground/80">
                    <User className="h-4 w-4" />
                    {userName || "Dashboard"}
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSearch}
              className="pb-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources, topics, mentors..."
                  className="w-full h-10 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button type="submit" size="sm">Search</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="py-3 space-y-1">
                {navLinks
                  .filter((link) => pathname !== link.href)
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-2 py-2 rounded-md text-sm transition-colors ${
                        pathname === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:bg-muted"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                <div className="pt-2 flex flex-col gap-2">
                  {isLoggedIn ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Dashboard</Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Log in</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full">Sign up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}