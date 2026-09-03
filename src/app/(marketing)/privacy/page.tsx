import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${brand.name} collects, uses, and protects data for creators and brands.`,
};

const sections = [
  {
    heading: "1. What we collect",
    body: [
      "Account details (name, email, role), connected social account identifiers, content metrics for submitted clips, payout information you provide, and standard technical logs.",
      "We do not sell personal data. We collect only what is needed to run campaigns, verify views, and process payouts.",
    ],
  },
  {
    heading: "2. How we use it",
    body: [
      "To operate the marketplace: matching creators to campaigns, verifying views against platform APIs, calculating earnings, preventing fraud, and providing support.",
      "Aggregate, de-identified statistics may be used to publish network benchmarks. You can opt out of product emails at any time.",
    ],
  },
  {
    heading: "3. Sharing",
    body: [
      "Campaign performance data is shared with the brand that funded the relevant campaign. Payment processors receive the minimum data required to deliver payouts. We may disclose data when legally required.",
    ],
  },
  {
    heading: "4. Retention and your rights",
    body: [
      "We keep account records while your account is active and for a reasonable period after to satisfy tax and dispute obligations. You can request access, correction, export, or deletion of your data by contacting privacy@" +
        brand.domain + ".",
    ],
  },
  {
    heading: "5. Security",
    body: [
      "Credentials are encrypted in transit and at rest; payout identifiers are never fully displayed in the dashboard. Access to production data is restricted and logged.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy."
        copy={`How ${brand.name} handles your data. Last updated August 25, 2026.`}
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
