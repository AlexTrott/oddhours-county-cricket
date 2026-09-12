# Next

Shipped this run: live ESPN JSON ingest (env-gated) + full-season fixtures UI. Seed still works with ingest off.

## Not this run

- **YouTube live discovery** — `youtubeChannelId` is still empty on every county.
- **Push notifications** — settings shows a closed button.
- **Accounts** — favourite is cookie + localStorage; competition cookie is extra, not an account.
- **Women’s cricket** — out of scope; RSS ingest drops women’s titles.
- Licensed ball-by-ball feed.

## Open / later

- Replace `takedown@example.com` before a public URL.
- ESPN standings do not expose batting/bowling bonus separately; Championship bonus columns stay 0 after ingest.
- Blast ESPN group names (North / Central & West / South) are mapped onto config Group A/B/C by team set + description.
- `/health` warns at >3 min delayed and >15 min unavailable while ingest is enabled (seed mode never uses those banners).
- Turso/libSQL if the host cannot keep a SQLite file.
- Worker on the same Node process (`pnpm ingest --watch`) instead of an external cron.

## Product

- Women’s regional / county competitions as a separate config tree.
- Ball-by-ball if a licensed feed exists.
