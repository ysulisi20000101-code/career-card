"use client";

import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";
import { mockResumeData } from "@/lib/mock-data";

export default function PublicProfilePage() {
  return <CareerNarrativeSite data={mockResumeData} />;
}
