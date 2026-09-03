import { Youtube, Instagram, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Platform = "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "X";

export function PlatformBadge({ platform }: { platform: Platform }) {
  if (platform === "YOUTUBE") {
    return (
      <Badge variant="danger" className="gap-1">
        <Youtube className="h-3 w-3" />
        YouTube
      </Badge>
    );
  }
  if (platform === "TIKTOK") {
    return (
      <Badge variant="muted" className="gap-1 bg-foreground/90 text-background">
        <Music2 className="h-3 w-3" />
        TikTok
      </Badge>
    );
  }
  if (platform === "X") {
    return (
      <Badge variant="secondary" className="gap-1">
        <span className="font-bold leading-none">𝕏</span>
        X
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Instagram className="h-3 w-3" />
      Instagram
    </Badge>
  );
}