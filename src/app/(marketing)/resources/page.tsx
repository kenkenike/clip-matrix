import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { resourceItemsSeed, blogPostsSeed } from "@/lib/mock-data/content.seed";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, handbooks, and tools for creators and brands on Clip Matrix: campaign rules, rate benchmarks, brand briefs, and more.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Everything You Need to Clip Smarter."
        copy="Guides and templates drawn from thousands of campaigns - free for everyone on the network."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resourceItemsSeed.map((item) => (
            <div key={item.title} className="card-hover-lift rounded-none border border-line bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-heading text-base font-semibold text-fg">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-none border border-line bg-surface-alt p-7 text-center sm:p-9">
          <h2 className="font-heading text-xl font-bold text-fg">Want the deep-dive reads?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The blog covers strategy and data from across the network.
          </p>
          <ButtonLink href="/blog" variant="secondary" className="mt-5">
            Read the Blog
          </ButtonLink>
          <p className="mt-6 text-xs text-faint">
            Latest: {blogPostsSeed[0].title}
          </p>
        </div>
      </Section>
    </>
  );
}
