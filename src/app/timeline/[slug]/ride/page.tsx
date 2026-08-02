export const revalidate = 60;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRide } from "@/lib/ride-data";
import { RideMount } from "./RideMount";

type Search = Promise<{ mode?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Search }): Promise<Metadata> {
  const { slug } = await params;
  const { mode } = await searchParams;
  const full = mode === "full";
  const ride = await getRide(slug, full ? "full" : undefined);
  if (!ride) return {};
  return {
    alternates: { canonical: `/timeline/${slug}/ride` },
    title: `${full ? "Full story" : "Ride the thread"} — ${ride.title}`,
    description: full
      ? `Every one of the ${ride.stops.length} developments on this thread, narrated.`
      : `${ride.stops.length} developments on one thread, narrated at ${ride.chapters.length} moments.`,
  };
}

export default async function RidePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Search }) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const ride = await getRide(slug, mode === "full" ? "full" : undefined);
  if (!ride) notFound();
  return <RideMount ride={ride} />;
}
