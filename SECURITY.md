# Security

This is a beta application. Only the current published source is maintained; no security audit or response-time guarantee is claimed.

## Report a vulnerability privately

Use GitHub's private vulnerability reporting if the repository owner has enabled it under Security. If it is unavailable, open an issue requesting a private reporting channel without disclosing exploit details, private structures, credentials or affected-user data. Do not post a working exploit or confidential file in a public issue.

## Data handling

Browser EPM estimates and cube imports are processed locally. Image recognition is a separate explicit transfer to an external service. The portable site has no user-account or cloud-backup system. The optional recognition endpoint validates origin, file type and size, but origin checking is not user authentication. Maintainers of a public deployment should choose access and usage controls appropriate to their audience.

Keep third-party runtime libraries updated and retain their licences. Do not put API credentials into browser JavaScript. Hosting configuration and repository visibility are separate from website access protection; see SETUP.md.
