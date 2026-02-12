# Testing And Release

> Owner: WA2DC maintainers
> Last reviewed: 2026-02-12
> Scope: Validation commands, CI expectations, and packaging constraints.

## Validation matrix

Preferred checks before handoff:

- `npm run lint`
- `npm test`
- `WA2DC_SMOKE_TEST=1 node src/index.js` for startup-sensitive changes

CI executes `npm test` (including smoke boot coverage).

## Packaging model

Release pipeline builds packaged binaries from an ESM bundle:

- esbuild bundles `src/runner.js` to `out.js` (ESM)
- `pkg` produces platform binaries from `out.js`
- runtime may branch on `process.pkg` for packaged-vs-source behavior

## Packaging-safe dependency rules

When adding/changing dependencies, verify:

- esbuild can bundle the runtime entry successfully
- pkg can resolve/load any runtime assets
- dynamic fs/native addon behavior is explicitly handled when required

Generated artifacts (`out.js`, `build/`) should not be manually edited.
