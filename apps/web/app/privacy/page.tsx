import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Del",
  description: "Privacy policy for the Del companion app and coach dashboard.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We collect the information needed to provide the del coaching experience. This may include your name, email address, account identifiers, coach-client relationship data, messages, written check-ins, and optional voice notes you choose to record in the app.",
      "We also collect basic technical information needed to operate the service, such as authentication status, app version, and device or browser information associated with normal service logs.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use your information to create and secure your account, deliver the companion app and coach dashboard, let invited clients and coaches communicate, and support check-ins, practices, and voice note features.",
      "We may also use information to maintain service reliability, troubleshoot problems, and improve product quality and safety.",
    ],
  },
  {
    title: "How information is shared",
    body: [
      "Information you provide in del is shared with the coach or organization connected to your account as part of the service.",
      "We do not sell your personal information or use your content for third-party advertising.",
    ],
  },
  {
    title: "Storage and security",
    body: [
      "del stores account and product data with service providers used to operate the app, including hosted authentication, database, and file storage infrastructure.",
      "We take reasonable steps to protect information in transit and at rest, but no service can guarantee absolute security.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can choose whether to submit written check-ins or record voice notes. If you no longer want to use del, you can stop using the service and contact your coach or the organization that invited you for account-related help.",
      "If you have questions about data associated with your account, please contact the coach or organization that invited you to del.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#1C1410] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="font-serif text-4xl font-light italic text-gold-light">Del</p>
        <h1 className="mt-8 font-serif text-4xl font-light text-white">Privacy Policy</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm font-extralight leading-7 text-white/70">
          This page explains how del handles information when clients and coaches use the
          companion app and dashboard.
        </p>
        <p className="mt-2 font-sans text-xs font-extralight uppercase tracking-[0.2em] text-white/35">
          Last updated April 10, 2026
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-light text-gold-light">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="font-sans text-sm font-extralight leading-7 text-white/75"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 border-t border-white/10 pt-10">
          <h2 className="font-serif text-2xl font-light text-gold-light">Contact</h2>
          <p className="mt-4 font-sans text-sm font-extralight leading-7 text-white/75">
            For privacy questions about del, contact the coach or organization that invited
            you to the service. If you need a direct contact for this policy, update this page
            with your support email before submitting the app for broad distribution.
          </p>
        </section>
      </div>
    </main>
  );
}
