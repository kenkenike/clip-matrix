import { clipsSeed } from "@/lib/mock-data/clips.seed";
import { attachFraud, withTitles } from "@/lib/mock-data/admin.seed";
import type { Clip } from "@/lib/services/types";

const store: Clip[] = withTitles(attachFraud(clipsSeed.map((c) => ({ ...c }))));

export function allClips(): Clip[] {
  return store;
}
