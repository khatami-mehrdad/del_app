import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-6">
      <div className="text-center">
        <h1 className="font-serif text-5xl font-light italic text-gold-light">del</h1>
        <p className="mt-3 font-sans text-sm font-extralight leading-relaxed text-white/40">
          Your therapeutic coaching companion
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block rounded-full bg-gold px-10 py-3.5 font-sans text-xs font-light uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold-light"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
