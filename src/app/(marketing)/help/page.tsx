import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { HelpSearch } from "@/app/(marketing)/help/help-search";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { marketingFaqsSeed } from "@/lib/mock-data/faq.seed";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Answers to common questions about Clip Matrix campaigns, earnings, verification, and payouts for creators and brands.",
};

const categories = [
  { title: "Getting started", body: "Account setup, connecting socials, and your first campaign.", count: "12 articles" },
  { title: "Earnings and payouts", body: "Rates, minimums, withdrawal schedules, and tax documents.", count: "9 articles" },
  { title: "Campaign rules", body: "Rule types, required tags, prohibited content, and appeals.", count: "15 articles" },
  { title: "Verification", body: "How views verify, what flags clips, and review timelines.", count: "7 articles" },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help center"
        title="How Can We Help?"
        copy="Search the knowledge base or browse the most asked questions below."
      />
      <Section>
        <div className="mx-auto max-w-xl">
          <HelpSearch />
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.title} className="card-hover-lift rounded-none border border-line bg-surface p-6">
              <h2 className="font-heading text-base font-semibold text-fg">{cat.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{cat.body}</p>
              <p className="mt-4 text-xs font-medium text-accent">{cat.count}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 mb-6 text-center font-heading text-xl font-bold">
          Popular questions
        </h2>
        <div className="mx-auto max-w-3xl">
          <Accordion items={marketingFaqsSeed.slice(0, 6)} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted">Still stuck?</p>
          <ButtonLink href="/contact" variant="secondary" className="mt-3">
            Contact Support
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
