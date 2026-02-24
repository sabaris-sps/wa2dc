# Developer Knowledge Base

> Owner: WA2DC maintainers
> Last reviewed: 2026-02-12
> Scope: Source of truth for engineering/runtime behavior and change procedures.

This directory is the canonical reference for development and maintenance workflows.
`AGENTS.md` is intentionally short and should only map into these docs.

## Read order

- `runtime-and-layout.md`: app lifecycle and where code lives
- `storage-and-side-effects.md`: persisted data contracts and runtime files
- `bridge-constraints.md`: behavior that is easy to regress
- `change-playbooks.md`: how to add commands/settings safely
- `testing-and-release.md`: validation and packaging guardrails
- `security-and-privacy.md`: privacy boundaries and safety rules

## Maintenance policy

- Keep each doc focused and topic-scoped; avoid monolithic pages.
- When code changes behavior, update the corresponding doc in the same PR.
- Preserve this metadata header when editing docs:
  - owner
  - last reviewed date
  - explicit scope
