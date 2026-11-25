# EstateAI Client

The EstateAI client is a React, TypeScript, and Vite application styled with Tailwind CSS and an original EstateAI design system. Public routes include the home page, live property discovery, property details, sign in, sign up, forgot password, and reset password.

## Development

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root. The default is `http://localhost:5000/api/v1`.

## Current backend integration

Property discovery and details use the implemented backend contracts:

- `GET /properties` with the server's documented filter and pagination query fields. Results use `{ success, message, data: Property[], meta }`.
- `GET /properties/:id` with `{ success, message, data: { property: Property } }`.
- Auth request/response methods are typed from the implemented `/auth/*` routes. Refresh credentials are sent through HttpOnly cookies; access tokens remain in memory and are not written to local storage.
- Email/password sign-up and sign-in, session restoration, sign-out, and password recovery use backend-supported auth routes and schemas. Buyer/agent role selection matches the server enum.

The frontend does not generate sample listing data. The home page, listings, and detail routes render loading, error, and empty states based on real API responses.

Google sign-in is shown as a provider option but reports that setup is unavailable: the current backend does not expose an OAuth route. AI search/chat/comparison, favorites, inquiries, notifications, and dashboard modules are also not yet exposed by server routes. Related UI actions are marked unavailable rather than calling assumed endpoints or showing fake success responses. Implementations should wait for backend route, validation, and response contracts.

The visual refresh uses a warm charcoal, coral, and marigold palette inspired by the colors on Vidyst while keeping EstateAI's logo and page design original.

## Scripts

- `npm run dev` — local development server
- `npm run build` — TypeScript project checks and production build
- `npm run lint` — Oxlint
- `npm run test` — Vitest unit tests
- `npm run preview` — preview the production build
