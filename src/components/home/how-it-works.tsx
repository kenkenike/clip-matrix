"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/marketing/section";
import { Tabs } from "@/components/ui/tabs";
import { Reveal } from "@/components/reveal";

interface Step {
  num: string;
  title: string;
  body: string;
}

const creatorSteps: Step[] = [
  { num: "01", title: "Join", body: "Create a free account and connect your TikTok, Instagram, YouTube, and X profiles in minutes." },
  { num: "02", title: "Discover", body: "Browse live campaigns across podcasts, gaming, music, SaaS, and more. Rates and rules are upfront." },
  { num: "03", title: "Create", body: "Turn the brand's source material into short-form cuts in your own style. Your edit, your voice." },
  { num: "04", title: "Post", body: "Publish to TikTok, Reels, Shorts, or X from any account that meets the campaign requirements." },
  { num: "05", title: "Submit", body: "Paste the public post URL. We detect metrics automatically and queue your clip for verification." },
  { num: "06", title: "Earn", body: "Get paid on verified performance. Every qualifying view accrues earnings you can withdraw weekly." },
];

const brandSteps: Step[] = [
  { num: "01", title: "Create Campaign", body: "Upload source content or paste links, name the campaign, and pick a category." },
  { num: "02", title: "Set Budget", body: "Choose a total budget and a rate per 100K verified views. You only pay for delivered performance." },
  { num: "03", title: "Define Rules", body: "Set required hashtags, phrases, mentions, follower tiers, and prohibited content." },
  { num: "04", title: "Launch", body: "Go live to the creator network. Submissions typically start arriving within hours." },
  { num: "05", title: "Track", body: "Watch views, creators, clips, engagement, and spend update in real time on your dashboard." },
  { num: "06", title: "Scale", body: "Double down on what performs. Raise rates, extend deadlines, and grow distribution." },
];

export function HowItWorks() {
  const [audience, setAudience] = useState("creators");
  const steps = audience === "creators" ? creatorSteps : brandSteps;

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Six steps from source material to payouts."
          copy="The same marketplace, two directions. Pick your side of the network."
        />

        <div className="mt-10 flex justify-center">
          <Tabs
            tabs={[
              { id: "creators", label: "For Creators" },
              { id: "brands", label: "For Brands" },
            ]}
            active={audience}
            onChange={setAudience}
          />
        </div>

        <ol className="relative mt-14 space-y-2 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12 lg:space-y-0">
          <div
            aria-hidden="true"
            className="absolute top-6 left-[19px] hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-accent/60 via-accent/25 to-transparent lg:hidden"
          />
          {steps.map((step, index) => (
            <Reveal key={step.num} delay={index * 60}>
              <li className="relative flex gap-5 py-4 lg:block lg:py-0">
                <div className="flex flex-col items-center lg:block">
                  <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-dim font-heading text-sm font-bold text-accent">
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
