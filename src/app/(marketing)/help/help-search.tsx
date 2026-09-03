"use client";

import { useState } from "react";
import { SearchBar } from "@/components/ui/inputs";

export function HelpSearch() {
  const [query, setQuery] = useState("");
  return <SearchBar value={query} onChange={setQuery} placeholder="Search help articles..." />;
}
