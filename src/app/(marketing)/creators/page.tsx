import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { EarningsCalculator } from "@/components/marketing/earnings-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Avatar } from "@/components/ui/avatar";
import { creatorTestimonialsSeed } from "@/lib/mock-data/faq.seed";

export const metadata: Metadata = {
  title: "For Creators",
  description:
    "Get paid to create viral content. Browse live campaigns, post clips to TikTok, Reels, Shorts, and X, and earn on every verified view with Clip Matrix.",
};

const steps = [
  { num: "01", title: "Create your account", body: "Sign up free in under two minutes. No follower minimums beyond one thousand." },
  { num: "02", title: "Connect socials", body: "Link TikTok, Instagram, YouTube, and X so we can verify views automatically." },
  { num: "03", title: "Pick campaigns", body: "Browse live briefs with upfront rates and rules. Join as many as you like." },
  { num: "04", title: "Post and submit", body: "Cut the source material your way, publish, then paste the URL into your dashboard." },
  { num: "05", title: "Get paid weekly", body: "Verified views convert to earnings. Withdraw above fifty dollars any week." },
];

export default function CreatorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For creators"
        title={
          <>
            Get Paid to Create <span className="text-accent">Viral Content.</span>
          </>
        }
        copy="No pitching. No invoicing. No gatekeepers. Turn brand material into short-form cuts you already know how to make, and earn on every verified view."
        actions={
          <>
            <ButtonLink href="/signup" size="lg">
              Start Creating
            </ButtonLink>
            <ButtonLink href="/campaigns" variant="secondary" size="lg">
              Browse Campaigns
            </ButtonLink>
          </>
        }
      />

      <Section>
        <SectionHeading
          eyebrow="The flow"
          title="Five steps to your first payout."
          align="left"
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.num} delay={index * 60}>
              <li className="h-full rounded-none border border-line bg-surface p-6">
                <span className="font-heading text-sm font-bold text-accent">{step.num}</span>
                <h3 className="mt-3 font-heading text-lg font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <li className="flex h-full flex-col justify-center rounded-none border border-accent/35 bg-accent-dim p-6 text-center shadow-[0_0_50px_-16px_rgba(163,230,53,0.4)]">
              <p className="font-heading text-2xl font-bold text-accent">$18,340</p>
              <p className="mt-1 text-sm text-muted">average lifetime earnings for top-decile clippers</p>
            </li>
          </Reveal>
        </ol>
      </Section>

      <Section alt>
        <SectionHeading
          eyebrow="Earnings calculator"
          title="What could your views be worth?"
          copy="Drag to your monthly view count and pick a rate band. Live campaigns range from $10 to $60 per 100K verified views."
        />
        <div className="mt-12">
          <EarningsCalculator />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Creators" title="Built by people who post daily." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {creatorTestimonialsSeed.map((t, index) => (
            <Reveal key={t.name} delay={index * 80}>
              <figure className="card-hover-lift h-full rounded-none border border-line bg-surface p-6">
                <blockquote className="text-sm leading-relaxed text-fg">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-fg">{t.name}</p>
                    <p className="text-xs text-muted">{t.meta}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 text-center">
          <ButtonLink href="/signup" size="lg">
            Start Creating
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
