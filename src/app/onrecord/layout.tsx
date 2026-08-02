import type { ReactNode } from "react";

export const metadata = { alternates: { canonical: "/onrecord" } };

export default function CanonicalLayout({ children }: { children: ReactNode }) {
  return children;
}
