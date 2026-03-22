"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, LogOut, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name;

  const navLinks = [
    { href: "/vidya-vault", label: "VidyaVault" },
    { href: "/vidya-sang", label: "VidyaSang" },
    { href: "/vidya-manch", label: "VidyaManch" },
    { href: "/vidya-setu", label: "VidyaSetu" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Image
                  src="/vidya-verse-logo.png"
                  alt="VidyaVerse Logo"
                  height={40}
                  width={90}
                  className="object-contain"
                />
              </motion.div>
              <span className="text-2xl font-bold font-[var(--font-crimson)] gradient-text">
                VidyaVerse
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center gap-8"
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="relative text-sm font-medium text-foreground/60 hover:text-primary transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Right Side Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden md:flex items-center gap-4"
          >
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="text-foreground/60 hover:text-primary"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            {isLoggedIn ? (
              /* Logged In State */
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-foreground/60 hover:text-primary hover:bg-transparent gap-2"
                  >
                    <User className="h-4 w-4" />
                    {userName || "Dashboard"}
                  </Button>
                </Link>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={handleLogout}
                    className="relative px-6 py-2.5 text-sm font-semibold text-primary overflow-hidden group"
                  >
                    <span className="absolute inset-0 border-2 border-primary rounded-lg transition-all duration-300 group-hover:border-primary/60" />
                    <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-lg" />
                    <span className="relative z-10 flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </span>
                  </button>
                </motion.div>
              </>
            ) : (
              /* Logged Out State */
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-foreground/60 hover:text-primary hover:bg-transparent"
                    asChild
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button className="relative px-6 py-2.5 text-sm font-semibold text-primary overflow-hidden group">
                    <span className="absolute inset-0 border-2 border-primary rounded-lg transition-all duration-300 group-hover:border-primary/60" />
                    <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-lg" />
                    <Link href="/register" className="relative z-10">
                      Sign up
                    </Link>
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground/60 hover:text-primary"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-border/50"
            >
              <div className="py-6 space-y-4">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className="block py-2 text-foreground/60 hover:text-primary transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="pt-4 space-y-3"
                >
                  {isLoggedIn ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full border-primary text-primary"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full border-foreground/20 text-foreground/60 hover:text-primary hover:border-primary/50"
                        asChild
                      >
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          Log in
                        </Link>
                      </Button>

                      <button className="relative w-full px-6 py-3 text-sm font-semibold text-primary overflow-hidden group">
                        <span className="absolute inset-0 border-2 border-primary rounded-lg transition-all duration-300 group-hover:border-primary/60" />
                        <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300 rounded-lg" />
                        <Link
                          href="/register"
                          className="relative z-10"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign up
                        </Link>
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="glass rounded-2xl border-2 border-border/50 p-6 shadow-2xl">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for notes, PYQs, syllabus..."
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-lg"
                    />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to
                      search
                    </p>
                    <Button type="button" variant="ghost" onClick={() => setIsSearchOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}