import { brand } from "@/lib/brand";

export const marketingFaqsSeed: { question: string; answer: string }[] = [
  {
    question: `What is ${brand.name}?`,
    answer: `${brand.name} is a performance marketplace for short-form video. Brands launch campaigns with a fixed budget, creators turn the brand's source material into clips, and payouts flow based on verified views rather than flat fees.`,
  },
  {
    question: "How do creators get paid?",
    answer:
      "Every campaign lists a rate per 100K verified views. Once your clip clears verification and passes the minimum view threshold, earnings accrue to your balance and are paid out weekly through your chosen payout method.",
  },
  {
    question: "Do creators need followers?",
    answer:
      "No. Accounts need at least one thousand followers to qualify, but reach is not required. Because pay is performance-based, a brand-new account that produces a hit clip earns exactly like an established one.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "TikTok, Instagram Reels, YouTube Shorts, and X. Campaigns specify which platforms qualify, and you can submit different cuts of the same content across all of them.",
  },
  {
    question: "How are views verified?",
    answer:
      "We reconcile view counts against platform APIs, screen submissions against campaign rules, and run automated quality checks before any views count toward payout.",
  },
  {
    question: "When do creators receive payment?",
    answer:
      "Balances become available as soon as earnings clear review. Withdrawals above fifty dollars process weekly, with next-business-day arrival on most methods.",
  },
  {
    question: "How do brands create campaigns?",
    answer:
      "Upload source content or paste links, set your budget and rate, define rules like required hashtags and prohibited content, then launch. Creators start submitting within hours.",
  },
  {
    question: "Can creators join multiple campaigns?",
    answer:
      "Yes, there is no cap. Many creators run several campaigns in parallel as long as each submission follows the rules of its own campaign.",
  },
  {
    question: "What happens if a clip goes viral?",
    answer:
      "You keep earning at the campaign rate on every verified view up to the per-clip maximum payout. Viral upside stays with the creator, which is the entire point.",
  },
  {
    question: "How is fake engagement detected?",
    answer:
      "Submissions pass automated integrity screening covering view velocity, engagement patterns, and platform-side signals before approval. Flagged clips are held for human review and never paid while under investigation.",
  },
  {
    question: "What content can brands submit?",
    answer:
      "Podcasts, gameplay, music sessions, product footage, webinars, essays, and more. If it can be cut into vertical short-form, it can be a campaign.",
  },
  {
    question: "Can brands control campaign rules?",
    answer:
      "Fully. Set allowed platforms, required phrases, hashtags, mentions, minimum follower tiers, minimum qualifying views, and prohibited content. Every submission is checked against your rulebook automatically.",
  },
];

export const creatorTestimonialsSeed = [
  {
    quote:
      "I clipped a two-hour podcast episode on my phone during lunch. That one upload out-earned my whole month of sponsored posts.",
    name: "Marcus T.",
    meta: "42K followers - TikTok",
  },
  {
    quote:
      "No pitching, no negotiating, no waiting on invoices. I post, paste the link, and watch the balance climb as views verify.",
    name: "Priya S.",
    meta: "128K followers - Reels",
  },
  {
    quote:
      "The leaderboard keeps me honest. Watching my name climb past full-time editors is the best motivation there is.",
    name: "Jonah W.",
    meta: "76K followers - Shorts",
  },
];
