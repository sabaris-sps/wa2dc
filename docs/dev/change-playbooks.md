# Change Playbooks

> Owner: WA2DC maintainers
> Last reviewed: 2026-02-12
> Scope: Safe procedures for command and setting changes.

## Add or change a slash command

Slash commands are managed in `src/discordHandler.js`.

For each command in `commandHandlers`, define:

- `description`
- `options` (registration schema)
- `execute(ctx)` implementation

Additional requirements:

- Startup registration is handled by `registerSlashCommands()`.
- Replies should remain ephemeral outside the control channel (`CommandResponder`).
- Use `ctx.replyPartitioned(...)` when response length can exceed Discord limits.
- Update `docs/commands.md` for user-visible command changes.

## Add a new setting

When introducing a setting:

1. Add default value in `src/state.js`.
2. Ensure loading older persisted settings still works through fallback defaults in `src/storage.js`.
3. Document user-facing behavior in docs.

## Rename or remove a setting

Never silently break legacy settings.
Add migration/compat logic so existing `storage` state continues to load.
