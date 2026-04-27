# Career Card Commercialization Implementation Notes

## Implemented Foundation

- Added local server-backed commercial entities: users, subscriptions, resume sources, career cards, published sites, AI suggestions, and share events.
- Added cookie-based demo login through `/api/auth/session`.
- Added production-shaped API boundaries for resume sources, career cards, AI suggestions, published sites, events, and mock billing checkout.
- Updated publish flow so anonymous users can still create portable links, while logged-in users can generate service-backed published snapshots.
- Added mock plan upgrade flow to validate commercial gating before integrating WeChat/Alipay/Stripe.
- Added privacy and terms pages to establish the trust surface required for resume data.

## Local Development Storage

The current implementation writes JSON files under `.data/`. This is intentional for local development and should be swapped behind the same repository/service interfaces when moving to Supabase/Postgres and object storage.

## Production Replacement Points

- Replace `src/lib/server/json-store.ts` with Postgres/Supabase repositories.
- Replace `/api/billing/checkout` mock upgrade with real payment provider checkout and signed webhook handling.
- Replace cookie-only demo auth with a real passwordless auth provider or first-party OTP implementation.
- Add field-level privacy controls before public release.
- Add dashboard reporting for events stored through `/api/events`.
