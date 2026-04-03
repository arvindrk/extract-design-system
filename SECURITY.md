# Security Policy

## Supported Versions

Security fixes are applied on a best-effort basis to the latest published version of `extract-design-system`.

## Reporting A Vulnerability

Please do not post sensitive vulnerability details in a public issue.

Preferred process:

1. Open a private GitHub vulnerability report if that option is available for this repository.
2. If private reporting is not available, open a public issue with minimal detail and request a private contact path.

Include:

- affected package version
- impact summary
- reproduction steps or proof of concept
- any suggested mitigation

## Security Boundaries

This project analyzes public websites and converts observed design primitives into starter token files.

Important constraints:

- target websites are untrusted third-party input
- extracted values should be reviewed before being treated as canonical design decisions
- the tool is intended for extraction and starter token generation, not broad automatic code rewrites
