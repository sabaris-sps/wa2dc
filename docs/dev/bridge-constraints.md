# Bridge Constraints

> Owner: WA2DC maintainers
> Last reviewed: 2026-02-13
> Scope: Message-routing and identity constraints that prevent regressions.

## Echo-loop prevention

Bridge bounce protection relies on state trackers:

- `state.sentMessages`
- `state.sentReactions`
- `state.sentPins`

When adding new mirrored events, extend loop-prevention tracking accordingly.

## JID/LID migration hygiene

WhatsApp identifiers may be PN-based JIDs or LID-based JIDs.
Use shared helpers instead of assumptions:

- `utils.whatsapp.formatJid(...)`
- `utils.whatsapp.hydrateJidPair(...)`
- `utils.whatsapp.migrateLegacyJid(...)`

Do not hardcode behavior to `@s.whatsapp.net` or `@lid` only.

## Discord platform limits

Respect transport constraints when emitting output:

- 2000-character message limit
- use `utils.discord.partitionText(...)` for long responses
- respect file-size gating (for example `DiscordFileSizeLimit`)

## Routing gates

Routing may be restricted by deployment settings. Message-flow changes must preserve:

- `state.settings.oneWay`
- whitelist checks via `state.settings.Whitelist`
- helper checks via `utils.whatsapp.inWhitelist(...)`
- broadcast delivery mode for WhatsApp `@broadcast` chats (`sendMessage(..., ..., { broadcast: true })`
  on Discord -> WhatsApp sends)
- newsletter delivery mode for WhatsApp `@newsletter` chats:
  by default, Discord -> WhatsApp message/edit/delete/reaction flows are handled the same way as DMs/groups (generic bridge path, no newsletter-only pre-gates).
  Set `WA2DC_NEWSLETTER_SPECIAL_FLOW=1` to re-enable the legacy newsletter-specific handling (server-id resolution waits, ack-aware media retries, and newsletter reaction API path).
  Poll sends to newsletters should still try interactive payload first, then fall back to text on send or ack rejection (commonly ack error `479`).
  Mirror incoming WhatsApp newsletter reactions via `newsletter.reaction` events and key them by `server_id`.
