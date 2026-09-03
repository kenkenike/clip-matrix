import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: `${brand.name} is the performance creator network. Learn why we built a marketplace where distribution is earned, not bought.`,
};

const values = [
  {
    title: "Performance over promises",
    body: "Marketing budgets deserve receipts. We built verification first so every dollar maps to something real.",
  },
  {
    title: "Creators are partners",
    body: "Viral upside stays with the creator. Rates are public. Rules are clear. Payouts land weekly.",
  },
  {
    title: "Short-form is the frontier",
    body: "The fastest distribution channel on the internet deserved infrastructure designed for it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            We Turn Content Into <span className="text-accent">Distribution.</span>
          </>
        }
        copy={`${brand.name} started with a simple observation: brands were paying for access while creators were giving away reach. We built the marketplace where both sides win on verified performance.`}
        actions={<ButtonLink href="/contact" size="lg">Get in Touch</ButtonLink>}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            align="left"
            eyebrow="Our mission"
            title="Distribution should be measurable, meritocratic, and fast."
          />
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              Every day, millions of hours of long-form content - podcasts, streams, lectures,
              launches - get cut into short-form clips by creators who understand what travels.
              Until now, that labor was invisible to the people who benefit most.
            </p>
            <p>
              {brand.name} gives brands one place to launch campaigns and creators one place to
              find paid work that rewards quality and speed. Views are verified, rules are
              automated, and payouts run weekly.
            </p>
            <p>
              Today the network spans more than fifty thousand creators and over a billion tracked
              views across TikTok, Instagram Reels, YouTube Shorts, and X.
            </p>
          </div>
        </div>
      </Section>

      <Section alt>
        <SectionHeading eyebrow="Values" title="What we optimize for." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="card-hover-lift rounded-none border border-line bg-surface p-6">
              <h3 className="font-heading text-base font-semibold text-fg">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
