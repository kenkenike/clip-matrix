import { SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function DualCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <div className="radial-glow flex h-full flex-col items-start justify-between rounded-none border border-line bg-surface p-8 sm:p-10">
            <div>
              <SectionHeading
                align="left"
                eyebrow="For creators"
                title="Your Next Viral Clip Could Pay You."
                copy="Join 52,000+ creators earning on verified views. Free to join, paid to post."
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Start Creating
              </ButtonLink>
              <ButtonLink href="/campaigns" variant="secondary" size="lg">
                Browse Campaigns
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex h-full flex-col items-start justify-between rounded-none border border-accent/35 bg-surface p-8 shadow-[0_0_60px_-16px_rgba(163,230,53,0.3)] sm:p-10">
            <div>
              <SectionHeading
                align="left"
                eyebrow="For brands"
                title="Launch Once. Distribute Everywhere."
                copy="One brief becomes hundreds of platform-native posts across TikTok, Reels, Shorts, and X."
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" size="lg">
                Launch Your Campaign
              </ButtonLink>
              <ButtonLink href="/brands" variant="secondary" size="lg">
                See How It Works
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
