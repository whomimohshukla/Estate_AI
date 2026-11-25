# 🏡 EstateAI – AI-Powered Real Estate Assistant

> An intelligent real estate discovery and property management platform powered by Google Gemini, semantic search, and modern full-stack technologies.

**EstateAI** is a full-stack AI-powered real estate platform that simplifies property discovery, listing management, property comparison, and customer relationship management.

The platform enables buyers to discover properties using natural language instead of relying entirely on traditional filters. Real estate agents can manage property listings, generate professional descriptions using AI, and track potential customers through an integrated CRM system.

The application combines Large Language Models (LLMs), vector embeddings, semantic search, and relational database queries to provide intelligent property discovery and management capabilities.

---

# 1. Project Overview

## What is EstateAI?

EstateAI is a real estate marketplace and intelligent property assistant designed for three primary users:

1. **Buyers:** Discover, search, compare, and inquire about properties.
2. **Real Estate Agents:** Manage property listings, generate AI descriptions, and manage customer leads.
3. **Administrators:** Manage users, approve property listings, monitor platform activity, and maintain platform quality.

Unlike traditional real estate platforms that primarily rely on predefined filters, EstateAI allows users to describe their requirements in natural language.

### Example

A buyer enters:

"I am looking for a 3BHK apartment in Noida under ₹80 lakh, near a metro station, with parking and a gym."

EstateAI understands the request using Google Gemini, converts it into structured search requirements, searches the property database, applies semantic similarity ranking, and returns relevant properties.

Users can then compare properties, ask questions through an AI assistant, save their favorites, and contact property agents.

---

# 2. Problem Statement

Traditional real estate platforms have several limitations for buyers and agents.

## Problems faced by buyers

- Finding suitable properties requires considerable manual searching.
- Traditional filters cannot easily interpret complex natural language requirements.
- Comparing multiple properties is time-consuming.
- Property descriptions may be incomplete or inconsistent.
- Buyers frequently need to contact agents to obtain basic information.
- Finding properties based on the meaning of a requirement can be difficult.

## Problems faced by agents

- Creating professional property descriptions manually takes time.
- Managing multiple property listings is difficult.
- Customer inquiries arrive through different communication channels.
- Tracking potential customers and follow-ups is challenging.
- Agents need a centralized system to monitor lead conversion.

## EstateAI Solutions

| Problem | EstateAI Solution |
|---|---|
| Complicated property search | AI-powered natural language search |
| Keyword-based search limitations | Semantic and hybrid search |
| Manual listing descriptions | Gemini AI description generation |
| Difficult property comparison | Automated property comparison |
| Repeated property questions | AI property assistant |
| Unorganized customer inquiries | Integrated lead management CRM |
| Manual follow-ups | Follow-up reminders and activity tracking |
| Unverified listings | Admin approval workflow |

---

# 3. Technology Stack

The project uses a separate frontend and backend architecture.

## Frontend

| Technology | Purpose |
|---|---|
| React.js | User interface |
| TypeScript | Static typing |
| Vite | Frontend development and build |
| Tailwind CSS | Styling |
| shadcn/ui | Reusable UI components |
| React Router | Application navigation |
| TanStack Query | Server-state management |
| Axios | API communication |
| Zustand | Client-side state management |
| React Hook Form | Form handling |
| Zod | Form validation |
| Lucide React | Icons |
| Recharts | Analytics and charts |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Type safety |
| PostgreSQL | Relational database |
| Prisma ORM | Database management |
| Zod | Request and response validation |
| JWT | Authentication |
| bcrypt | Password hashing |
| Google Gemini API | LLM integration |
| Gemini Embeddings | Text embeddings |
| pgvector | Vector similarity search |
| Cloudinary | Property image storage |
| Redis | Caching and background processing |
| BullMQ | Background job processing |
| Pino | Application logging |

## DevOps and Deployment

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Local infrastructure |
| AWS EC2 | Backend hosting |
| Vercel | Frontend hosting |
| Nginx | Reverse proxy |
| GitHub Actions | CI/CD |
| Postman | API testing |
| Playwright | End-to-end testing |

---

# 4. Application Architecture

The application consists of independent frontend and backend applications.

```text
                  ESTATEAI PLATFORM
                         |
          +--------------+--------------+
          |                             |
          v                             v
    REACT FRONTEND                 EXPRESS BACKEND
    TypeScript                     Node.js
    Vite                           TypeScript
          |                             |
          |                        REST APIs
          |                             |
          +-----------------------------+
                                        |
                     +------------------+----------------+
                     |                  |                |
                     v                  v                v
                PostgreSQL         GEMINI AI        CLOUDINARY
                     |                  |
                     |            +-----+------+
                     |            |            |
                     v            v            v
                  pgvector      Gemini LLM   Embeddings
                     |
                     v
                Semantic Search

                 REDIS + BULLMQ
                     |
                     v
                Background Workers
```

## Architecture principles

- Frontend and backend must remain separate applications.
- Backend owns all business logic.
- Frontend communicates with backend through REST APIs.
- Gemini API calls must only happen on the backend.
- Database operations must be performed through the backend.
- Prisma handles relational database operations.
- pgvector handles embedding similarity operations.
- Background workers handle expensive asynchronous operations.
- Every module should have a clearly defined responsibility.

---

# 5. User Roles and Permissions

EstateAI has three main user roles.

## 5.1 Buyer

Buyers can:

- Register and log in.
- Manage their profiles.
- Browse available properties.
- Search properties using filters.
- Search properties using natural language.
- Use AI-powered property discovery.
- View property details.
- View property images.
- Compare multiple properties.
- Save favorite properties.
- Save search preferences.
- Ask questions through the AI chatbot.
- View previous AI conversations.
- Contact property agents.
- Submit property inquiries.
- Track their inquiries.
- Receive notifications.
- Report suspicious property listings.

Buyers must not be able to create or manage agent property listings.

## 5.2 Real Estate Agent

Agents can:

- Register and log in.
- Manage their profiles.
- Create property listings.
- Edit their own properties.
- Archive their own properties.
- Upload multiple property images.
- Generate AI property descriptions.
- Preview and edit generated descriptions.
- Submit listings for approval.
- View their listing status.
- Manage buyer inquiries.
- View assigned leads.
- Update lead status.
- Add notes to leads.
- Schedule follow-ups.
- Track lead activities.
- View property analytics.
- View dashboard statistics.

Agents must not modify properties or private leads belonging to other agents.

## 5.3 Administrator

Administrators can:

- Access the admin dashboard.
- Manage users.
- Manage agents.
- Activate and deactivate accounts.
- View all properties.
- Approve property listings.
- Reject property listings.
- Request listing corrections.
- Manage reported properties.
- View platform analytics.
- Monitor leads.
- View audit logs.
- Monitor platform activities.

Administrative permissions must be enforced on the backend.

---

# 6. Complete Feature Requirements

## Module 1: Authentication and User Management

- User registration.
- User login.
- User logout.
- Email verification.
- Forgot password.
- Reset password.
- JWT access tokens.
- Refresh token rotation.
- Secure session management.
- Role-based authorization.
- Profile management.
- Profile image upload.
- Change password.
- Account activation and deactivation.

Roles:

```text
BUYER
AGENT
ADMIN
```

## Module 2: Property Management

### Property CRUD

- Create property.
- Read property details.
- Update property.
- Archive property.
- Delete or soft-delete property.
- View agent-owned properties.
- Manage listing availability.

### Property information

Each property should support:

- Title.
- Description.
- Property type.
- Sale or rent.
- Price.
- Bedrooms.
- Bathrooms.
- Area in square feet.
- Address.
- Locality.
- City.
- State.
- Country.
- Postal code.
- Latitude.
- Longitude.
- Amenities.
- Furnishing status.
- Parking availability.
- Metro distance.
- Availability status.

### Property types

```text
APARTMENT
HOUSE
VILLA
PLOT
COMMERCIAL
```

### Listing purposes

```text
SALE
RENT
```

### Property statuses

```text
DRAFT
PENDING
AVAILABLE
SOLD
RENTED
REJECTED
ARCHIVED
```

### Property images

- Multiple image uploads.
- Image deletion.
- Image reordering.
- Cover image selection.
- Image preview.
- File validation.
- Image compression.
- Cloudinary storage.

## Module 3: Property Search and Discovery

### Normal search

- Search by city.
- Search by locality.
- Search by property title.
- Minimum price.
- Maximum price.
- Bedrooms.
- Bathrooms.
- Property type.
- Sale or rent.
- Minimum area.
- Maximum area.
- Amenities.
- Parking.
- Furnishing.
- Availability.
- Sorting.
- Pagination.

### Advanced search

- Location-based search.
- Nearby metro stations.
- Nearby schools.
- Nearby hospitals.
- Nearby shopping centres.
- Radius-based search.
- Map-based property discovery.

Location and distance claims must use verified geospatial information rather than AI-generated assumptions.

## Module 4: AI Natural Language Search

This is the primary AI functionality.

Example:

"Find a 2BHK apartment in Noida under ₹60 lakh with parking and a gym."

Gemini should extract structured requirements:

```json
{
  "city": "Noida",
  "propertyType": "APARTMENT",
  "bedrooms": 2,
  "maxPrice": 6000000,
  "amenities": [
    "PARKING",
    "GYM"
  ],
  "purpose": "SALE"
}
```

Features:

- Conversational search.
- Gemini LLM integration.
- Structured output.
- Requirement extraction.
- City extraction.
- Budget extraction.
- Property type extraction.
- Bedroom extraction.
- Amenity extraction.
- Sale/rent intent detection.
- Query validation using Zod.
- SQL filter generation through trusted backend logic.
- Search result ranking.
- Search suggestions.
- Search history.
- Interpreted filter display.
- No-result suggestions.
- Search refinement.

Never allow Gemini to generate and directly execute SQL statements.

## Module 5: Semantic Search and Hybrid Search

Use Gemini Embeddings and PostgreSQL pgvector.

Features:

- Generate embeddings for properties.
- Generate embeddings for user queries.
- Store embeddings in PostgreSQL.
- Similarity search.
- Cosine distance.
- HNSW indexing.
- Embedding synchronization.
- Content hash tracking.
- Background embedding generation.
- Hybrid SQL and vector search.
- Semantic ranking.
- Search relevance scoring.

Hybrid search should respect strict requirements such as budget, availability, city and bedrooms.

## Module 6: AI Property Description Generator

Use Gemini to generate:

- Property titles.
- Short descriptions.
- Detailed descriptions.
- Property highlights.
- SEO-friendly descriptions.
- Social media descriptions.
- Property tags.

Additional features:

- Tone selection.
- Regenerate description.
- Edit description.
- Preview description.
- Approve description before publishing.

AI must only use supplied property information. It must not invent amenities, distances, specifications or facilities.

## Module 7: AI Property Chatbot

Implement a property-aware chatbot using Retrieval-Augmented Generation (RAG).

Features:

- Chat interface.
- Property-specific questions.
- Retrieve property information.
- Gemini-generated responses.
- Conversation history.
- Context-aware follow-up questions.
- Property specification explanations.
- Amenity questions.
- Price-per-square-foot calculations.
- Unknown-information handling.
- Message history.
- Delete conversations.
- AI rate limiting.

For factual answers, retrieve the latest property information from PostgreSQL and provide it as context to Gemini.

## Module 8: Property Comparison

- Compare two or three properties.
- Compare total prices.
- Compare price per square foot.
- Compare area.
- Compare bedrooms.
- Compare bathrooms.
- Compare amenities.
- Compare location.
- Compare furnishing.
- Compare verified metro distance.
- Highlight differences.
- Generate AI comparison explanations.
- Save comparisons.

All numerical calculations must happen in backend code, not be invented by the LLM.

## Module 9: Favorites and Saved Searches

- Add favorite property.
- Remove favorite property.
- View favorite properties.
- Save searches.
- Edit saved searches.
- Delete saved searches.
- View search history.
- Notify buyers when new listings match saved searches.

## Module 10: Lead Management CRM

### Lead creation

- Buyer inquiry submission.
- Property association.
- Buyer association.
- Agent association.
- Buyer budget.
- Buyer requirements.
- Inquiry message.
- Lead creation timestamp.

### Lead pipeline

```text
NEW
CONTACTED
INTERESTED
NEGOTIATION
CONVERTED
LOST
```

### Lead management

- View leads.
- Filter leads.
- Search leads.
- View lead details.
- Update lead status.
- Add notes.
- Record activities.
- Schedule follow-ups.
- Track follow-up dates.
- Track conversions.
- Export leads to CSV.

## Module 11: AI Lead Assistant

- Summarize buyer requirements.
- Summarize lead conversations.
- Generate follow-up messages.
- Suggest relevant properties.
- Extract buyer budgets.
- Categorize inquiries.
- Suggest follow-up questions.
- Generate email drafts.

AI-generated recommendations must remain suggestions for agents to review.

## Module 12: Agent Dashboard

- Total properties.
- Active listings.
- Pending listings.
- Sold properties.
- Rented properties.
- Total property views.
- Total inquiries.
- New leads.
- Converted leads.
- Recent activities.
- Lead pipeline.
- Property management.
- AI description generator.
- Follow-up reminders.

## Module 13: Admin Dashboard

- Total users.
- Total buyers.
- Total agents.
- Total properties.
- Pending property approvals.
- Active listings.
- Sold/rented properties.
- Total leads.
- User management.
- Agent management.
- Property approvals.
- Property rejection.
- Reported listings.
- Platform analytics.
- Audit logs.

## Module 14: Notifications

- In-app notifications.
- New lead notifications.
- Property approval notifications.
- Property rejection notifications.
- Lead status notifications.
- Follow-up reminders.
- Mark as read.
- Notification history.
- Email notifications.
- Optional real-time notifications using Socket.io.

## Module 15: Analytics

- Property views.
- Property inquiry counts.
- Lead conversion rates.
- Agent performance.
- Popular properties.
- Popular locations.
- Search activity.
- Monthly reports.
- Dashboard charts.
- CSV export.

## Module 16: Security

- Password hashing.
- JWT authentication.
- Refresh token rotation.
- HttpOnly cookies.
- Role-based authorization.
- Property ownership checks.
- Zod validation.
- Helmet security headers.
- CORS restrictions.
- Rate limiting.
- Secure file uploads.
- Environment variable protection.
- SQL injection protection.
- AI prompt and output validation.
- Audit logging.
- Database backups.

## Module 17: Performance and Background Processing

- Redis caching.
- BullMQ job queues.
- Background embedding generation.
- Background image processing.
- Email notification jobs.
- Failed-job retry handling.
- Job status tracking.
- Database indexing.
- Query optimization.
- API compression.
- AI usage limits.

## Module 18: Testing and Deployment

- Unit tests.
- Integration tests.
- API testing.
- End-to-end tests.
- Docker configuration.
- Docker Compose.
- Vercel deployment.
- AWS EC2 deployment.
- Nginx reverse proxy.
- HTTPS.
- GitHub Actions CI/CD.
- Health checks.
- Logging.
- Monitoring.
- Production database backup.
- README documentation.

---

# 7. Database Design

Use PostgreSQL with Prisma ORM.

Main tables:

```text
users
properties
property_images
property_embeddings
favorites
saved_searches
leads
lead_activities
conversations
messages
refresh_tokens
notifications
property_views
audit_logs
```

## Important relationships

- One agent can own multiple properties.
- One property can have multiple images.
- One property can receive multiple leads.
- One buyer can submit multiple inquiries.
- One user can save multiple properties.
- One property can have one current embedding.
- One user can have multiple conversations.
- One conversation can contain multiple messages.
- One lead can contain multiple activity records.

## Database rules

- Use UUID primary keys.
- Use Decimal for monetary values.
- Add indexes on commonly filtered fields.
- Add foreign key constraints.
- Add unique constraints for email and favorites.
- Use soft deletion where appropriate.
- Store image URLs rather than image binary data.
- Store embedding vectors in pgvector.
- Use transactions for related database operations.

---

# 8. Backend Architecture

Use modular architecture with clear separation of concerns.

```text
estateai-server/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── gemini.ts
│   │   ├── cloudinary.ts
│   │   └── redis.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── properties/
│   │   ├── images/
│   │   ├── favorites/
│   │   ├── saved-searches/
│   │   ├── leads/
│   │   ├── conversations/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── admin/
│   │   └── ai/
│   │       ├── search/
│   │       ├── embeddings/
│   │       ├── descriptions/
│   │       ├── chatbot/
│   │       ├── comparison/
│   │       └── lead-assistant/
│   │
│   ├── middleware/
│   ├── jobs/
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

## Backend module structure

Each module should use the following separation when appropriate:

```text
module/
├── module.routes.ts
├── module.controller.ts
├── module.service.ts
├── module.repository.ts
├── module.schema.ts
└── module.types.ts
```

Responsibilities:

- Routes: Define endpoints.
- Controllers: Handle HTTP requests and responses.
- Services: Implement business logic.
- Repositories: Handle database operations.
- Schemas: Validate input.
- Types: Define TypeScript contracts.

Do not put all business logic inside controllers.

---

# 9. Frontend Architecture

```text
estateai-client/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── property/
│   │   ├── search/
│   │   ├── chatbot/
│   │   ├── comparison/
│   │   ├── dashboard/
│   │   └── forms/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── buyer/
│   │   ├── agent/
│   │   ├── admin/
│   │   └── auth/
│   │
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── context/
│   ├── types/
│   ├── utils/
│   ├── routes/
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── .env.example
└── package.json
```

## Required frontend pages

### Public pages

- Home.
- Property search.
- Property details.
- About.
- Contact.

### Authentication pages

- Login.
- Register.
- Forgot password.
- Reset password.

### Buyer pages

- Buyer dashboard.
- AI search.
- AI chatbot.
- Favorites.
- Saved searches.
- Property comparison.
- My inquiries.

### Agent pages

- Agent dashboard.
- My properties.
- Create property.
- Edit property.
- Property details.
- Leads.
- Lead details.
- Follow-up management.

### Admin pages

- Admin dashboard.
- Users.
- Agents.
- Property approvals.
- Reported listings.
- Analytics.
- Settings.

---

# 10. API Design

Use REST APIs with versioning.

Base URL:

```text
/api/v1
```

## Authentication APIs

```http
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
```

## Property APIs

```http
POST   /properties
GET    /properties
GET    /properties/:id
PATCH  /properties/:id
DELETE /properties/:id

POST   /properties/:id/images
DELETE /properties/:id/images/:imageId

GET    /agents/me/properties
PATCH  /properties/:id/status
```

## AI APIs

```http
POST /ai/search
POST /ai/generate-description
POST /ai/chat
POST /ai/compare

GET  /ai/conversations
GET  /ai/conversations/:id

POST /ai/embeddings/:propertyId
POST /ai/embeddings/reindex
```

## Lead APIs

```http
POST  /leads
GET   /leads
GET   /leads/:id

PATCH /leads/:id/status
PATCH /leads/:id/follow-up

POST  /leads/:id/activities
GET   /leads/:id/activities
```

## Favorite APIs

```http
POST   /favorites/:propertyId
DELETE /favorites/:propertyId
GET    /favorites
```

## Admin APIs

```http
GET   /admin/dashboard
GET   /admin/users
GET   /admin/properties/pending

PATCH /admin/properties/:id/approve
PATCH /admin/properties/:id/reject
```

---

# 11. AI Architecture and Implementation Rules

Google Gemini is the primary AI provider.

All AI functionality must be implemented through dedicated backend services.

## Gemini services

```text
ai/
├── search/
│   └── search.service.ts
├── embeddings/
│   └── embeddings.service.ts
├── descriptions/
│   └── description.service.ts
├── chatbot/
│   └── chat.service.ts
├── comparison/
│   └── comparison.service.ts
└── lead-assistant/
    └── lead-assistant.service.ts
```

## Natural Language Search Workflow

```text
User Query
    |
    v
Express API
    |
    v
Gemini LLM
    |
    v
Structured Search Filters
    |
    v
Zod Validation
    |
    v
Backend Search Builder
    |
    +---------------------+
    |                     |
    v                     v
PostgreSQL Filters    Query Embedding
    |                     |
    |                     v
    |                  pgvector
    |                     |
    +----------+----------+
               |
               v
          Hybrid Ranking
               |
               v
         Property Results
```

## Semantic Search Workflow

1. Generate searchable text from verified property data.
2. Generate an embedding using the selected Gemini embedding model.
3. Store the embedding in PostgreSQL using pgvector.
4. Generate an embedding for the user's search query.
5. Calculate vector similarity.
6. Apply strict structured filters.
7. Rank eligible properties.
8. Return matching property records.

## RAG Chatbot Workflow

1. Receive user question.
2. Identify the relevant property.
3. Retrieve current property information.
4. Retrieve relevant conversation context.
5. Send retrieved information to Gemini.
6. Generate a grounded response.
7. Store the conversation and message.
8. Return the answer.

## AI Safety Rules

- Gemini must never directly access PostgreSQL.
- Gemini must never generate executable SQL.
- Validate all model outputs.
- Never trust AI-generated property prices.
- Never invent property amenities.
- Never invent location distances.
- Never claim a property is available without checking its current status.
- Perform calculations in backend code.
- Keep API keys on the backend.
- Apply rate limiting to AI endpoints.
- Handle model failures gracefully.

---

# 12. Environment Variables

Backend `.env.example`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_EMBEDDING_MODEL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

REDIS_URL=

CLIENT_URL=http://localhost:5173
```

Frontend `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Never commit actual secrets to GitHub.

---

# 13. Development Roadmap

Develop the application in the following order.

## Phase 1: Project Foundation

- Initialize frontend.
- Initialize backend.
- Configure TypeScript.
- Configure PostgreSQL.
- Configure Prisma.
- Design database schema.
- Implement authentication.
- Implement role-based authorization.
- Implement global error handling.

## Phase 2: Property Marketplace

- Build property CRUD.
- Build image upload.
- Implement listing approval.
- Build property search.
- Implement filters.
- Implement pagination.
- Build property details page.
- Add sample property data.

## Phase 3: AI Integration

- Configure Gemini SDK.
- Implement natural language search.
- Implement structured outputs.
- Implement AI descriptions.
- Implement embeddings.
- Install pgvector.
- Build semantic search.
- Build hybrid search.

## Phase 4: Advanced AI

- Implement property chatbot.
- Implement RAG.
- Store conversation history.
- Build property comparison.
- Add AI lead assistance.

## Phase 5: CRM and Dashboards

- Build buyer dashboard.
- Build agent dashboard.
- Build admin dashboard.
- Implement lead management.
- Implement favorites.
- Implement saved searches.
- Implement notifications.
- Implement analytics.

## Phase 6: Production

- Implement Redis.
- Implement BullMQ.
- Add automated tests.
- Configure Docker.
- Configure deployment.
- Configure monitoring.
- Write technical documentation.
- Deploy the application.

---

# 14. Coding Standards and AI Development Instructions

**IMPORTANT: These rules must be followed by AI coding assistants working on this repository.**

1. Always inspect the existing project structure before making changes.
2. Never recreate or overwrite existing functionality without understanding it.
3. Follow the established folder structure.
4. Use TypeScript throughout frontend and backend.
5. Avoid using `any` unless absolutely necessary.
6. Keep frontend and backend separate.
7. Use modular architecture in Express.
8. Keep controllers thin.
9. Keep business logic in services.
10. Use Prisma for relational database operations.
11. Use parameterized raw SQL for pgvector operations.
12. Validate incoming requests using Zod.
13. Implement proper error handling.
14. Use reusable React components.
15. Use TanStack Query for server-state management.
16. Keep API calls inside frontend service modules.
17. Do not expose Gemini API keys in frontend code.
18. Do not call Gemini directly from React.
19. Enforce authentication and authorization on backend endpoints.
20. Check property ownership before updates or deletions.
21. Never trust frontend role information.
22. Do not hardcode property data in production components.
23. Use environment variables for configuration.
24. Add database migrations for schema changes.
25. Write tests for important business logic.
26. Maintain consistent API response formats.
27. Add loading, error and empty states to frontend screens.
28. Use transactions when multiple database operations must succeed together.
29. Never allow AI-generated values to override verified property records.
30. Update README documentation when adding significant functionality.

## API response convention

Success:

```json
{
  "success": true,
  "message": "Property retrieved successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Property not found",
  "errors": []
}
```

## Development expectations

When implementing a feature, the coding assistant should:

1. Explain the feature briefly.
2. Identify affected modules.
3. Define database changes if necessary.
4. Implement backend functionality.
5. Implement frontend functionality.
6. Add validation and authorization.
7. Test the implementation.
8. Explain how to run and verify it.
9. Update documentation.

Do not implement the entire project in one enormous code change. Work incrementally by module and verify each milestone.

---

# 15. Testing Strategy

## Unit Testing

Test:

- Authentication utilities.
- Property validation.
- Search filter parsing.
- Price calculations.
- Lead status transitions.
- AI response validation.
- Authorization logic.

## Integration Testing

Test:

- Registration and login.
- Property creation.
- Property editing.
- Listing approval.
- Property search.
- AI search.
- Lead creation.
- Lead status updates.

## End-to-End Testing

Test the complete user journey:

1. Agent registers.
2. Agent creates a property.
3. Admin approves the listing.
4. Buyer searches for the property using AI.
5. Buyer views the listing.
6. Buyer saves the property.
7. Buyer compares it with another property.
8. Buyer contacts the agent.
9. Agent receives the lead.
10. Agent updates the lead status.

---

# 16. Definition of Done

The project will be considered ready for its first production-style release when:

- All three user roles work correctly.
- Authentication and authorization are secure.
- Agents can manage their properties.
- Admins can approve listings.
- Buyers can search and discover properties.
- Natural language search works through Gemini.
- Semantic search works using pgvector.
- Hybrid search respects strict user requirements.
- AI descriptions use verified listing data.
- The chatbot provides grounded answers.
- Property comparison produces accurate calculations.
- Lead management works end to end.
- Dashboards show real database information.
- APIs are validated and tested.
- Docker and deployment configurations work.
- Documentation is complete.

---

# 17. Project Vision

EstateAI aims to make real estate discovery more intelligent and property management more organized.

The platform combines a traditional real estate marketplace with conversational AI, semantic search, automated content generation, and CRM functionality.

The long-term vision is to build an intelligent property platform where buyers can discover properties through natural language, agents can manage their entire listing and customer workflow, and administrators can operate the marketplace through a centralized system.

**Core product differentiator:**

An AI-powered real estate assistant that understands buyer requirements, finds relevant properties using hybrid search, provides grounded property information, and connects interested buyers with real estate agents.

---

**Project Name:** EstateAI  
**Category:** AI-Powered Real Estate SaaS  
**Architecture:** Separate Frontend and Backend  
**Frontend:** React + TypeScript + Vite  
**Backend:** Node.js + Express + TypeScript  
**Database:** PostgreSQL + Prisma + pgvector  
**AI Provider:** Google Gemini  
**Image Storage:** Cloudinary  
**Deployment:** Vercel + AWS EC2

**Development Approach:** Modular, scalable, secure, testable, and production-oriented.# Estate_AI
