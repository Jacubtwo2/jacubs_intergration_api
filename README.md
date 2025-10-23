# Jacubs Integration API

Production-ready NestJS service that provides a complete authentication and user profile experience with PostgreSQL, TypeORM, and Swagger-powered documentation. The API supports signup, login, JWT access/refresh token flows, profile management, and secure profile image uploads.

## Features

- **Robust auth flow** with signup, login, refresh rotation, and logout powered by access & refresh JWT tokens.
- **Secure credential storage** using bcrypt (with a crypto-based fallback for local environments where native bindings are unavailable).
- **Users module** exposing profile read/update endpoints plus profile image upload (validated PNG/JPEG, 5 MB max, stored under `/uploads`).
- **PostgreSQL via TypeORM** with a dedicated users migration and repository-backed services.
- **Security middleware** including Helmet, CORS (configurable origin), secure HTTP-only refresh cookies, and a rate limit guard on login attempts.
- **OpenAPI documentation** served from the versioned API prefix with an API Dog–inspired Swagger UI shell.
- **Comprehensive tests** covering AuthService units and an end-to-end happy path for the entire auth lifecycle.

## Scaffolding & Dependencies

To reproduce the project locally from scratch, run the following commands:

```bash
nest new my-api
cd my-api
npm i @nestjs/typeorm typeorm pg
npm i @nestjs/jwt @nestjs/passport passport passport-jwt
npm i class-validator class-transformer bcrypt helmet
npm i -D @types/bcrypt
npm i multer @nestjs/platform-express
npm i @nestjs/config
```

The repository already contains the configured modules, DTOs, guards, and tests—clone it directly if you want the finished implementation.

## Getting Started

1. Install dependencies (internet access required for the first install):

   ```bash
   npm install
   ```

2. Copy the environment template and adjust values for your stack:

   ```bash
   cp .env.example .env
   ```

3. Ensure your PostgreSQL instance has the `uuid-ossp` extension enabled (required for UUID primary keys).

4. Run the users migration:

   ```bash
   npm run migration:run
   ```

5. Start the API:

   ```bash
   npm run start:dev
   ```

   The API listens on `http://localhost:3001` by default and is automatically prefixed with the configured `API_VERSION` (e.g. `/api/v1`). Swagger documentation is available at `/{API_VERSION}/docs`.

## Testing

```bash
# Unit tests (AuthService coverage)
npm run test

# End-to-end auth journey
npm run test:e2e

# Coverage report
npm run test:cov
```

> **Note:** In constrained environments where native `bcrypt` bindings cannot be installed, the service falls back to a crypto-based password hasher. The production deployment should still install `bcrypt` to take advantage of its mature hashing guarantees.

## Example Requests

All endpoints are served under the configured API version (e.g. `/api/v1`). Replace `<JWT>` placeholders with the returned access tokens.

```bash
# Signup
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "password": "Secure123",
    "confirmPassword": "Secure123"
  }' -i

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "Secure123" }' -i

# Refresh (requires refresh_token cookie from the previous response)
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Cookie: refresh_token=<refresh-cookie-value>" -i

# Get current profile
curl http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer <JWT>"

# Update profile details
curl -X PATCH http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "+12065551234", "bio": "Lifelong mathematician." }'

# Upload profile image (PNG/JPEG only)
curl -X POST http://localhost:3001/api/v1/users/me/profile-image \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@profile.png"

# Logout (clears refresh cookie and revokes stored hash)
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <JWT>" -i
```

## Security Highlights

- Global validation pipe with whitelist & transformation.
- Helmet, CORS with configurable origin, and static assets served from `/uploads`.
- Secure, HTTP-only `refresh_token` cookie (`SameSite=Lax`, secure flag configurable via env).
- Login rate limiting (5 attempts per 15 minutes per IP/email combo).
- JWT access tokens (15 minutes) and refresh tokens (7 days) with rotation enforcement.

## Additional Notes

- The uploads directory (`/uploads`) is served statically for development convenience. Swap the `FilesService` implementation to store images in S3 or another provider when moving to production.
- The OpenAPI document is generated directly from the Nest controllers and DTOs so it stays in sync with the codebase.
- Use `npm run migration:revert` to roll back the latest TypeORM migration if needed.
