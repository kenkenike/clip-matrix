import type { Metadata } from "next";
import { ArrowDown, BadgeCheck, Eye, ShieldCheck, Trophy } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "For Brands",
  description:
    "Turn one piece of content into hundreds of posts. Launch performance-based clipping campaigns on Clip Matrix and pay only for verified views.",
};

const funnel = ["One video", "100+ creators", "Hundreds of clips", "Millions of views"];

const benefits = [
  {
    icon: BadgeCheck,
    title: "Performance-based spend",
    body: "Budgets flow to verified views, not promises. Every dollar maps to a delivered impression you can audit.",
  },
  {
    icon: ShieldCheck,
    title: "Automated verification",
    body: "Platform API reconciliation plus integrity screening means inflated numbers never reach your invoice.",
  },
  {
    icon: Trophy,
    title: "Creator leaderboard",
    body: "See exactly which creators drive results for your brand, then concentrate spend behind the top of the board.",
  },
  {
    icon: Eye,
    title: "Brand-safe by rulebook",
    body: "Set required phrases, hashtags, mentions, follower tiers, and prohibited content. Submissions are checked automatically.",
  },
];

export default function BrandsPage() {
  return (
    <>
      <PageHero
        eyebrow="For brands"
        title={
          <>
            Turn One Piece of Content Into{" "}
            <span className="text-accent">Hundreds of Posts.</span>
          </>
        }
        copy="Your audience is already on short-form. Clip Matrix puts your material in the hands of thousands of creators competing to distribute it."
        actions={
          <>
            <ButtonLink href="/contact" size="lg">
              Launch Campaign
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary" size="lg">
              See How It Works
            </ButtonLink>
          </>
        }
      />

      <Section alt>
        <div className="mx-auto max-w-2xl">
          {funnel.map((stage, index) => (
            <Reveal key={stage} delay={index * 90}>
              <div
                className={
                  index === funnel.length - 1
                    ? "rounded-none border border-accent/40 bg-accent-dim px-6 py-5 text-center shadow-[0_0_50px_-16px_rgba(163,230,53,0.4)]"
                    : "rounded-none border border-line bg-surface px-6 py-5 text-center"
                }
                style={{ marginLeft: `${index * 4}%`, marginRight: `${index * 4}%` }}
              >
                <p className={index === funnel.length - 1 ? "font-heading text-2xl font-bold text-accent" : "font-heading text-lg font-semibold text-fg"}>
                  {stage}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="mt-1 flex justify-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <ArrowDown key={i} className="mx-8 h-5 w-5 text-accent/50" aria-hidden="true" />
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Why Clip Matrix" title="Built for accountable distribution." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, index) => (
            <Reveal key={b.title} delay={index * 70}>
              <div className="card-hover-lift h-full rounded-none border border-line bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent">
                  <b.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-fg">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section alt>
        <div className="text-center">
          <SectionHeading
            eyebrow="Get started"
            title="Launch Once. Distribute Everywhere."
            copy="Most campaigns see first submissions within hours of going live."
          />
          <div className="mt-9 flex flex-wrap justify-center gap-3.5">
            <ButtonLink href="/contact" size="lg">
              Launch Campaign
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Talk to Sales
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
