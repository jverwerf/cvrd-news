export const revalidate = 60;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRide } from "@/lib/ride-data";
import { RideMount } from "./RideMount";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ride = await getRide(slug);
  if (!ride) return {};
  return {
    title: `Ride the thread — ${ride.title}`,
    description: `${ride.stops.length} developments on one thread, narrated at ${ride.chapters.length} moments.`,
  };
}

export default async function RidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ride = await getRide(slug);
  if (!ride) notFound();
  return <RideMount ride={ride} />;
}
