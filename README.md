# P.T. Harrish Pyrotech Agencies

Responsive React and Vite storefront for the Sivakasi fireworks catalogue, product enquiries, and WhatsApp cart checkout.

## Development

```sh
npm install
npm run dev
```

## Quality Checks

```sh
npm run build
npm run lint
npm run test:e2e
```

The Playwright suite runs in Chromium and WebKit. It checks the viewport matrix in `tests/responsive.spec.js`, native table layout and contained horizontal scrolling, mobile navigation, search/filter/FAQ behavior, cart quantity synchronization, and WhatsApp checkout.

Run the optional Firefox project with `npm run test:e2e:firefox`; run every configured engine with `npm run test:e2e:all`. Install Playwright browsers with `npx playwright install chromium firefox webkit`. Firefox on Windows may require the Microsoft Visual C++ runtime.

## Security Scope

This is a static browser-only catalogue. It has no authentication, API, database, uploads, payment processing, or authoritative order service. Cart data in local storage is untrusted and is rebuilt from the product catalogue; WhatsApp messages are enquiry estimates that the business must confirm. Do not add secrets or treat client-side prices, quantities, or permissions as authoritative.

The production hosting platform must enforce HTTPS and response headers, including a site-appropriate Content Security Policy, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `frame-ancestors`/frame protection, and `Permissions-Policy`. No production host configuration is present in this repository, so these headers must be verified after a deployment target is selected. The HTML sets `strict-origin-when-cross-origin` as the referrer policy.
