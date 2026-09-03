import Link from "next/link";
import { Logo, MatrixGlyph } from "@/components/logo";
import {
  XIcon,
  TikTokIcon,
  DiscordIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons";
import { brand } from "@/lib/brand";

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "For Creators", href: "/creators" },
      { label: "For Brands", href: "/brands" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Analytics", href: "/how-it-works" },
    ],
  },
  {
    heading: "Creators",
    links: [
      { label: "Getting Started", href: "/help" },
      { label: "Creator Guide", href: "/resources" },
      { label: "Earnings", href: "/dashboard/earnings" },
      { label: "Campaign Rules", href: "/how-it-works" },
      { label: "Supported Platforms", href: "/help" },
    ],
  },
  {
    heading: "Brands",
    links: [
      { label: "Launch Campaign", href: "/contact" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Analytics", href: "/brand/analytics" },
      { label: "Case Studies", href: "/blog" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/resources" },
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "About", href: "/about" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookie Policy", href: "/terms" },
      { label: "Creator Agreement", href: "/terms" },
      { label: "Brand Agreement", href: "/terms" },
    ],
  },
];

const socials = [
  { label: "X", icon: XIcon },
  { label: "Instagram", icon: InstagramIcon },
  { label: "YouTube", icon: YoutubeIcon },
  { label: "TikTok", icon: TikTokIcon },
  { label: "Discord", icon: DiscordIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-alt">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Performance-driven creator distribution. One brief in, hundreds of
              short-form posts out.
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href={`https://${brand.domain}`}
                  aria-label={`${brand.name} on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-accent/40 hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-xs font-semibold tracking-widest text-fg uppercase">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-faint">
            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-2 text-xs text-faint">
            <MatrixGlyph className="h-3 w-3 text-accent" />
            {brand.domain}
          </p>
        </div>
      </div>
    </footer>
  );
}
