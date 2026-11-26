# Estate Client

The Estate client is a React, TypeScript, and Vite application styled with Tailwind CSS and a custom Estate design system. The homepage centres natural-language property search: a buyer describes a home in everyday language, Estate interprets the request, and the client shows backend-ranked listing results.

## Development

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root. The default is `http://localhost:5000/api/v1`.

## Current backend integration

Property discovery, natural-language search, and details use the implemented backend contracts:

- `GET /properties` with the server's documented filter and pagination query fields. Results use `{ success, message, data: Property[], meta }`.
- `GET /properties/:id` with `{ success, message, data: { property: Property } }`.
- `POST /ai/search` with `{ query, page?, limit? }`. The page renders the backend's interpreted filters, ranked properties, relevance scores, suggestions, and pagination metadata without fabricating listings.
- Authenticated search history loads from `GET /saved-searches/history?limit=8`; guest searches skip that request.
- Authenticated favorite actions use `GET /favorites/:propertyId`, `POST /favorites/:propertyId`, and `DELETE /favorites/:propertyId`.
- Auth request/response methods are typed from the implemented `/auth/*` routes. Refresh credentials are sent through HttpOnly cookies; access tokens remain in memory and are not written to local storage.
- Email/password sign-up and sign-in, session restoration, sign-out, and password recovery use backend-supported auth routes and schemas. Buyer/agent role selection matches the server enum.
- Buyer, agent, and admin workspaces are protected by role-aware routes. Signing in returns users to the protected page they originally requested when their role is allowed there; otherwise it opens their role's workspace.
- The AI assistant, property comparison, favorites, inquiries, saved searches, agent leads/listings, notifications, and admin review screens use the existing typed service layer. They do not substitute local mock results for backend responses.

The frontend does not generate sample listing data. The home page, listings, and detail routes render loading, error, and empty states based on real API responses.

Google sign-in is shown as a provider option but reports that setup is unavailable: the current backend does not expose an OAuth route. The frontend does not show fake data or hide API failures.

The visual system uses charcoal, warm neutrals, and marigold yellow, with DM Sans for interface text and DM Serif Display for editorial headings. One shared Estate logo is used in the navbar, footer, and authentication pages. The homepage includes a reduced-motion-aware typewriter example and a plain-language three-step explanation of the search flow.

## Scripts

- `npm run dev` — local development server
- `npm run build` — TypeScript project checks and production build
- `npm run lint` — Oxlint
- `npm run test` — Vitest unit tests
- `npm run preview` — preview the production build
