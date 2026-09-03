import type { ComponentType, SVGProps } from "react";
import { TikTokIcon, XIcon, InstagramIcon, YoutubeIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "x";

export const platformMeta: Record<
  SocialPlatform,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  tiktok: { label: "TikTok", icon: TikTokIcon },
  instagram: { label: "Reels", icon: InstagramIcon },
  youtube: { label: "Shorts", icon: YoutubeIcon },
  x: { label: "X", icon: XIcon },
};

export function platformLabel(platform: SocialPlatform): string {
  return platformMeta[platform].label;
}

export function PlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const Icon = platformMeta[platform].icon;
  return <Icon aria-hidden="true" className={cn("h-4 w-4", className)} />;
}

export function PlatformBadge({ platform, className }: { platform: SocialPlatform; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted",
        className
      )}
    >
      <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
      {platformMeta[platform].label}
    </span>
  );
}

export function PlatformBadges({
  platforms,
  className,
}: {
  platforms: SocialPlatform[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {platforms.map((p) => (
        <PlatformBadge key={p} platform={p} />
      ))}
    </div>
  );
}
