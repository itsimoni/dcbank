"use client";

import { useSearchParams } from "next/navigation";

export default function HomeClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return <div>q: {q}</div>;
}
