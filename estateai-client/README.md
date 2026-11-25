# EstateAI Client

The EstateAI client is a React, TypeScript, and Vite application styled with Tailwind CSS and a shared EstateAI design system. The first implementation covers the public home page, live property discovery, and property details.

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

The frontend does not generate sample listing data. The home page, listings, and detail routes render loading, error, and empty states based on real API responses.

AI search/chat/comparison, favorites, inquiries, notifications, and dashboard modules are not yet exposed by the current server routes. Related UI actions are marked unavailable rather than calling assumed endpoints or showing fake success responses. Implementations should wait for backend route, validation, and response contracts.

## Scripts

- `npm run dev` — local development server
- `npm run build` — TypeScript project checks and production build
- `npm run lint` — Oxlint
- `npm run preview` — preview the production build
