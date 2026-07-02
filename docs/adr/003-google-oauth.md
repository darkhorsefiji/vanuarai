# ADR 3 — Google OAuth identity (no phone/SMS)

**Date:** 2026-06-05
**Status:** Accepted

## Context

The platform needs reliable user identity for internet plan purchases and village
membership. Options: phone/SMS OTP, email magic-link, Google/Apple OAuth.

## Decision

Google OAuth as primary identity provider. No phone/SMS-OTP.

## Rationale

- Google is the dominant identity provider in Fiji (Android device penetration)
- Villages may lack cellular coverage, making SMS unreliable
- OAuth avoids password management and credential storage
- JWT tokens are stateless — no server-side session store needed
- Captive portal context handled via "Open in system browser" hop (Google blocks
  OAuth in embedded webviews via `disallowed_useragent`)

## Consequences

- Users without a Google account need a fallback (email magic-link planned)
- Google OAuth in captive mini-browser requires system-browser redirect
- JWT expiry = 30 days; tokens are long-lived to reduce re-auth friction
- No phone number collection required (privacy win for members)
