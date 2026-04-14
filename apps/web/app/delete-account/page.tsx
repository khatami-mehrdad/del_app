import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete account | Del",
  description: "Request deletion of your Del companion account and associated data.",
};

/**
 * Shown on the public web for Google Play account-deletion URL requirements.
 * Override via NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL in Vercel / GitHub env.
 */
const deletionEmail =
  process.env.NEXT_PUBLIC_ACCOUNT_DELETION_EMAIL ?? "khatami.mehrdad@gmail.com";

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#1C1410] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="font-serif text-4xl font-light italic text-gold-light">Del</p>
        <h1 className="mt-8 font-serif text-4xl font-light text-white">
          Delete your account and data
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-sm font-extralight leading-7 text-white/70">
          Del Companion is the client app for del. This page explains how to request deletion of
          your account and the personal data associated with it.
        </p>
        <p className="mt-2 font-sans text-xs font-extralight uppercase tracking-[0.2em] text-white/35">
          Last updated April 10, 2026
        </p>

        <section className="mt-12 space-y-4 border-t border-white/10 pt-10">
          <h2 className="font-serif text-2xl font-light text-gold-light">How to request deletion</h2>
          <p className="font-sans text-sm font-extralight leading-7 text-white/75">
            Send an email from the address registered on your del account to:
          </p>
          <p className="font-sans text-base font-light text-gold-light">
            <a
              href={`mailto:${deletionEmail}?subject=Del%20Companion%20account%20deletion%20request`}
              className="underline underline-offset-4 hover:text-gold"
            >
              {deletionEmail}
            </a>
          </p>
          <p className="font-sans text-sm font-extralight leading-7 text-white/75">
            Use the subject line{" "}
            <span className="text-white/90">&quot;Del Companion account deletion request&quot;</span>
            . In the body, include the email address you use to sign in to del (if different from
            the sender).
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl font-light text-gold-light">
            What we delete when you request account deletion
          </h2>
          <ul className="list-inside list-disc space-y-2 font-sans text-sm font-extralight leading-7 text-white/75">
            <li>Your authentication account for del</li>
            <li>Your profile information held for the service</li>
            <li>Messages, check-ins, and other app content tied to your account</li>
            <li>Voice note files you uploaded that are stored for the service</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl font-light text-gold-light">What we may retain</h2>
          <p className="font-sans text-sm font-extralight leading-7 text-white/75">
            We may retain certain information for a limited period where required by law, to resolve
            disputes, or to enforce our agreements. When retention is required, we limit use to those
            purposes.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl font-light text-gold-light">Timing</h2>
          <p className="font-sans text-sm font-extralight leading-7 text-white/75">
            We aim to complete deletion or confirm next steps within a reasonable period, typically
            within 30 days of verifying your request, unless a longer period is required by law.
          </p>
        </section>

        <section className="mt-12 border-t border-white/10 pt-10">
          <p className="font-sans text-sm font-extralight leading-7 text-white/55">
            See also{" "}
            <a href="/privacy" className="text-gold-light underline underline-offset-4 hover:text-gold">
              Privacy policy
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
