import type { Metadata } from "next";
import { FileSearch, ShieldCheck, UserCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { HowItWorks } from "@/components/home/how-it-works";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How Clip Matrix works for creators and brands: join, discover, create, post, submit, and earn - with every view verified before it pays.",
};

const verification = [
  {
    icon: FileSearch,
    title: "Submission review",
    body: "Every submitted clip is checked against the campaign rulebook: platform, hashtags, mentions, length, and content requirements.",
  },
  {
    icon: ShieldCheck,
    title: "View verification",
    body: "We reconcile view counts against platform APIs so the number on your dashboard matches what advertisers actually pay for.",
  },
  {
    icon: UserCheck,
    title: "Human escalation",
    body: "Anything that looks unusual goes to a human reviewer. Creators always see a clear status instead of silent rejections.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From Source Material to{" "}
            <span className="text-accent">Verified Payouts.</span>
          </>
        }
        copy="One marketplace, two flows. Creators turn content into distribution. Brands turn budgets into verified reach."
        actions={
          <>
            <ButtonLink href="/signup" size="lg">
              Join as Creator
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Launch as Brand
            </ButtonLink>
          </>
        }
      />

      <HowItWorks />

      <Section alt>
        <SectionHeading
          eyebrow="Verification"
          title="A view has to earn trust before it earns money."
          copy="Payments depend on numbers everyone can believe. Here is how each submission moves from posted to paid."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {verification.map((v, index) => (
            <Reveal key={v.title} delay={index * 80}>
              <div className="card-hover-lift h-full rounded-none border border-line bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent">
                  <v.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-fg">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-faint">
          Clips that clear all checks move to approved, then paid, on the campaign&apos;s payout
          schedule. Flagged clips are held for review and never charged to the brand while under
          investigation.
        </p>
      </Section>

      <Section>
        <SectionHeading eyebrow="Get started" title="Pick your side of the network." />
        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <ButtonLink href="/creators" size="lg">
            I Create Content
          </ButtonLink>
          <ButtonLink href="/brands" variant="secondary" size="lg">
            I Have Content to Distribute
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
