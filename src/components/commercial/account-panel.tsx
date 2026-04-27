"use client";

import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAN_LABELS } from "@/lib/commercial/plans";
import type { SessionUser } from "@/types/commercial";

interface AccountPanelProps {
  compact?: boolean;
  onChange?: (user: SessionUser | null) => void;
}

export function AccountPanel({ compact = false, onChange }: AccountPanelProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [identity, setIdentity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as { user: SessionUser | null };
        if (!cancelled) {
          setUser(payload.user);
          onChange?.(payload.user);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [onChange]);

  async function signIn() {
    setError("");
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity }),
    });
    const payload = (await response.json()) as { user?: SessionUser; error?: string };
    if (!response.ok || !payload.user) {
      setError(payload.error || "登录失败");
      return;
    }
    setUser(payload.user);
    onChange?.(payload.user);
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    onChange?.(null);
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs shadow-sm">
        <UserRound className="h-3.5 w-3.5 text-indigo-500" />
        <span className="max-w-[160px] truncate text-zinc-700">{user.email || user.phone || user.displayName}</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">{PLAN_LABELS[user.plan]}</span>
        {!compact && (
          <button onClick={signOut} className="text-zinc-400 hover:text-zinc-700" aria-label="退出登录">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        <Input
          value={identity}
          onChange={(event) => setIdentity(event.target.value)}
          placeholder="邮箱或手机号"
          className="h-8 text-xs"
        />
        <Button size="sm" variant="brand" className="rounded-full" onClick={signIn}>
          登录
        </Button>
      </div>
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
