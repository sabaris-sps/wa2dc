# Security And Privacy

> Owner: WA2DC maintainers
> Last reviewed: 2026-02-12
> Scope: Data handling, logging boundaries, and network-safety expectations.

WA2DC handles sensitive data including WhatsApp session state, Discord tokens, and mirrored message content.

## Logging boundaries

- Never log secrets (tokens, QR codes, auth blobs, raw credential payloads).
- Keep crash reports useful but avoid dumping sensitive state.
- Review added logs in both normal and failure paths.

## Network-safety boundaries

Link preview fetching includes safeguards against local/internal network abuse.
Do not weaken protections that block loopback/private/link-local targets.

## Principle of least exposure

- Keep control-channel data access restricted at the Discord permission layer.
- Avoid broadening command surface area without clear authorization expectations.
- Preserve privacy-first defaults for self-hosted deployments.
