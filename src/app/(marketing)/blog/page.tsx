import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { blogPostsSeed } from "@/lib/mock-data/content.seed";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Strategy, playbooks, and data on performance clipping, creator distribution, and short-form growth from the Clip Matrix team.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notes From the Network."
        copy="What we learn from millions of tracked views: strategy breakdowns, creator playbooks, and platform data."
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogPostsSeed.map((post) => (
            <article key={post.slug} className="card-hover-lift flex h-full flex-col rounded-none border border-line bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="accent">{post.tag}</Badge>
                <span className="text-xs text-faint">{post.readTime}</span>
              </div>
              <h2 className="mt-4 font-heading text-lg leading-snug font-semibold text-fg">
                {post.title}
              </h2>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
              <p className="mt-4 border-t border-line pt-4 text-xs text-faint">{post.date}</p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
