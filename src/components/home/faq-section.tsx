import { SectionHeading, Section } from "@/components/marketing/section";
import { Accordion } from "@/components/ui/accordion";
import { marketingFaqsSeed } from "@/lib/mock-data/faq.seed";

export function FaqSection() {
  return (
    <Section alt>
      <SectionHeading
        eyebrow="FAQ"
        title="Questions, Answered."
        copy="Everything brands and creators ask before their first campaign."
      />
      <div className="mx-auto mt-12 max-w-3xl">
        <Accordion items={marketingFaqsSeed} />
      </div>
    </Section>
  );
}
