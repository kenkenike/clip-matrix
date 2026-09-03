import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms governing use of the ${brand.name} platform for creators and brands.`,
};

const sections = [
  {
    heading: "1. Overview",
    body: [
      `${brand.name} ("we", "the platform") operates a marketplace connecting brands that launch campaigns with creators who produce short-form content. These terms apply to everyone who creates an account or uses ${brand.domain}.`,
      "Brands and creators are independent participants. We provide tooling, verification, and payment infrastructure; we do not take editorial control of creator content beyond enforcing campaign rules.",
    ],
  },
  {
    heading: "2. Accounts",
    body: [
      "You must be at least 18 years old and able to form a binding contract. Provide accurate information, keep your credentials secure, and notify us promptly of unauthorized access.",
      "Creators must hold the rights to accounts they connect. One person may operate one creator account unless we agree otherwise in writing.",
    ],
  },
  {
    heading: "3. Campaigns and payouts",
    body: [
      "Brands set campaign budgets, rates, and rules. Creators earn amounts calculated from verified views on qualifying clips, subject to each campaign's published rules.",
      "We may withhold or reverse earnings tied to invalid traffic, rule violations, duplicate content, or platform-confirmed anomalies. Rejected submissions are never charged to brand budgets.",
    ],
  },
  {
    heading: "4. Content rights",
    body: [
      "Creators retain ownership of their edits and grant brands a license to reshare submitted clips within the scope of the applicable campaign. Brands supply source material and warrant they hold the necessary rights.",
      "You may not submit content that infringes intellectual property, violates law, or breaches a campaign's prohibited-content list.",
    ],
  },
  {
    heading: "5. Prohibited conduct",
    body: [
      "No fake engagement, purchased views, bot activity, self-viewing schemes, or attempts to manipulate verification. Violations can result in forfeiture of pending earnings and account termination.",
    ],
  },
  {
    heading: "6. Termination and liability",
    body: [
      "Either party may stop using the platform at any time. We may suspend accounts that breach these terms. The service is provided as is, and our aggregate liability is limited to fees you paid us in the preceding twelve months where permitted by law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service."
        copy={`The agreement between you and ${brand.name}. Last updated August 25, 2026.`}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-10">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-heading text-xl font-bold text-fg">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
