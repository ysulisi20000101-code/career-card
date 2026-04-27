import { cookies } from "next/headers";
import type { SessionUser, Subscription, User } from "@/types/commercial";
import { createId, nowIso, readJsonStore, writeJsonStore } from "@/lib/server/json-store";

const SESSION_COOKIE = "career_card_session";
const USER_STORE = "users.json";
const SUBSCRIPTION_STORE = "subscriptions.json";

type UserStore = Record<string, User>;
type SubscriptionStore = Record<string, Subscription>;

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value.replace(/\D/g, ""));
}

async function findUserByIdentity(identity: string): Promise<User | null> {
  const users = await readJsonStore<UserStore>(USER_STORE, {});
  const normalized = normalizeIdentity(identity);
  return (
    Object.values(users).find(
      (user) =>
        (user.email && normalizeIdentity(user.email) === normalized) ||
        (user.phone && normalizeIdentity(user.phone) === normalized),
    ) ?? null
  );
}

async function saveUser(user: User): Promise<User> {
  const users = await readJsonStore<UserStore>(USER_STORE, {});
  users[user.id] = user;
  await writeJsonStore(USER_STORE, users);
  return user;
}

async function saveSubscription(subscription: Subscription): Promise<Subscription> {
  const subscriptions = await readJsonStore<SubscriptionStore>(SUBSCRIPTION_STORE, {});
  subscriptions[subscription.userId] = subscription;
  await writeJsonStore(SUBSCRIPTION_STORE, subscriptions);
  return subscription;
}

export async function getSubscription(userId: string): Promise<Subscription> {
  const subscriptions = await readJsonStore<SubscriptionStore>(SUBSCRIPTION_STORE, {});
  const existing = subscriptions[userId];
  if (existing) return existing;
  const createdAt = nowIso();
  return saveSubscription({
    id: createId("sub"),
    userId,
    plan: "free",
    status: "trial",
    aiCreditsTotal: 5,
    aiCreditsUsed: 0,
    publishedSiteLimit: 1,
    createdAt,
    updatedAt: createdAt,
  });
}

export async function upgradeSubscription(userId: string, plan: "pro" | "advanced"): Promise<Subscription> {
  const current = await getSubscription(userId);
  const next: Subscription = {
    ...current,
    plan,
    status: "active",
    aiCreditsTotal: plan === "advanced" ? 200 : 60,
    publishedSiteLimit: plan === "advanced" ? 20 : 5,
    updatedAt: nowIso(),
  };
  return saveSubscription(next);
}

export async function signIn(identity: string): Promise<SessionUser> {
  const normalized = normalizeIdentity(identity);
  if (!isEmail(normalized) && !isPhone(normalized)) {
    throw new Error("INVALID_IDENTITY");
  }
  const existing = await findUserByIdentity(normalized);
  const now = nowIso();
  const user =
    existing ??
    (await saveUser({
      id: createId("usr"),
      email: isEmail(normalized) ? normalized : undefined,
      phone: isPhone(normalized) ? normalized : undefined,
      displayName: normalized.split("@")[0] || "Career Card 用户",
      createdAt: now,
      updatedAt: now,
    }));
  const subscription = await getSubscription(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    plan: subscription.plan,
  };
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const users = await readJsonStore<UserStore>(USER_STORE, {});
  const user = users[userId];
  if (!user) return null;
  const subscription = await getSubscription(user.id);
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    plan: subscription.plan,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
