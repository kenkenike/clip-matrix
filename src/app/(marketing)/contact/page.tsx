import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ContactForm } from "@/app/(marketing)/contact/contact-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to the ${brand.name} team about campaigns, enterprise plans, or creator support. We reply within one business day.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's Talk Distribution."
        copy="Campaign questions, enterprise pricing, or creator support - reach the right team on the first try."
      />
      <Section>
        <SectionHeading
          eyebrow="Send a message"
          title="We read everything."
        />
        <div className="mt-10">
          <ContactForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Prefer email? Reach us at{" "}
          <span className="text-accent">hello@{brand.domain}</span>
        </p>
      </Section>
    </>
  );
}
