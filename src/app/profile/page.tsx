"use client";

import Link from "next/link";
import { ArrowRight, MonitorSmartphone } from "lucide-react";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";
import { mockResumeData } from "@/lib/mock-data";

export default function PublicProfilePage() {
  return (
    <>
      {/* Demo mode nav bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 16px",
          background: "rgba(99,102,241,0.08)",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          backdropFilter: "blur(8px)",
          fontSize: 13,
          color: "#4f46e5",
        }}
      >
        <span style={{ opacity: 0.7 }}>这是个人职业网站样例</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <Link
          href="/profile/interview"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: "#4f46e5",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <MonitorSmartphone style={{ width: 14, height: 14 }} />
          查看面试演示样例
          <ArrowRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>
      <div style={{ paddingTop: 42 }}>
        <CareerNarrativeSite data={mockResumeData} />
      </div>
    </>
  );
}
