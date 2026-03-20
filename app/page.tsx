import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-[#f8f3e8] text-[#3b2f2f]">

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#e6dcc6]">
        <div className="flex items-center gap-2 text-xl font-semibold">
          📖 VidyaVerse
        </div>

        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#">Home</a>
          <a href="#">About Us</a>
          <a href="#">Resources</a>
          <a href="#">Doubt Forum</a>
        </nav>

        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-lg text-sm">
            Log in
          </button>
          <button className="px-4 py-2 bg-[#d97706] text-white rounded-lg text-sm">
            Sign Up
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-8 py-16 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT */}
        <div>
          <h1 className="text-5xl font-serif leading-tight">
            Explore your entire
            <br />
            knowledge universe,
            <br />
            all in one place.
          </h1>

          <p className="mt-4 text-[#6b5e4a]">
            A complete ecosystem for learning, collaboration, and guidance —
            built for students.
          </p>

          <div className="mt-6 flex gap-4">
            <button className="bg-[#d97706] text-white px-6 py-3 rounded-xl">
              Get Started
            </button>

            <button className="border px-6 py-3 rounded-xl">
              Explore Resources
            </button>
          </div>
        </div>

        {/* RIGHT (Laptop) */}
        <div className="relative">
          <Image
            src="/hero-laptop.png"
            alt="VidyaVerse UI"
            className="rounded-xl shadow-xl"
            width={500}
            height={300}
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="text-center py-10 px-8 border-t border-[#e6dcc6]">
        <h2 className="text-xl font-semibold mb-8">
          Everything you need to succeed in college
        </h2>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              title: "VidyaVault",
              desc: "High-quality notes & study material",
            },
            {
              title: "VidyaManch",
              desc: "Ask and answer doubts",
            },
            {
              title: "VidyaSetu",
              desc: "1-on-1 mentorship sessions",
            },
            {
              title: "VidyaSangh",
              desc: "Join college communities",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-[#e6dcc6] rounded-xl p-5 shadow-sm"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm mt-2 text-[#6b5e4a]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN ILLUSTRATION */}
      <section className="px-8 py-16 flex justify-center">
        <Image
          src="/vidyaverse-hero-image.png"
          alt="VidyaVerse Illustration"
          className="max-w-5xl w-full"
          width={800}
          height={400}
        />
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-8 border-t border-[#e6dcc6]">
        <h2 className="text-xl font-semibold">
          Start your journey with VidyaVerse today
        </h2>

        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-[#d97706] text-white px-6 py-3 rounded-xl">
            Get Started
          </button>

          <button className="border px-6 py-3 rounded-xl">
            Join as Mentor
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e6dcc6] py-10 px-8 text-center text-sm">
        <div className="flex justify-center gap-8 mb-6">
          <div>About Us</div>
          <div>FAQ</div>
          <div>Contact Us</div>
          <div>Privacy Policy</div>
          <div>Terms of Service</div>
        </div>

        <p className="text-[#6b5e4a]">
          © 2026 VidyaVerse. All rights reserved.
        </p>
      </footer>
    </main>
  );
}