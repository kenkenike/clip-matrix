import type { Metadata } from "next";
import { BrandOverviewView } from "@/app/brand/overview-view";

export const metadata: Metadata = {
  title: "Brand Dashboard",
  description: "Your Clip Matrix brand overview: campaigns, spend, views, and creator performance.",
};

export default function BrandHomePage() {
  return <BrandOverviewView />;
}
