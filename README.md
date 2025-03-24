# Prehab Take Home REST API - Issac Holguin

Hey team, here is my project!

This README is a summary of the project with instructions and explainations of the project.

## Environment

- **Node:** 18.20.5
- **NPM:** 10.8.2

## Tech Stack

- **Express.js** - API server framework
- **SQLite** - Database
- **DrizzleORM** - Database ORM and migrations
- **ZOD** - Schema and input validation
- **Jest** - Testing framework
- **Supertest** - API testing utility

## Getting Started

### Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run db:init:local` (this initializes local sqlite db with migrations)
4. Set up environment variables:
   ```bash
   ./setup-env.sh
   ```
   This creates:
   - `.env.local` for development
   - `.env.test` for testing
   - Adds default JWT_SECRET to both files (you can modify these later)
5. Run `npm run dev`

### Development Container (VSCode) (preferred way to avoid dependency issues + OS differences)

1. Clone the repository
2. Ensure the "Dev Containers" extension is installed in VSCode
3. Open the repository in VSCode
4. Run `Dev Containers: Reopen in Container` command. this will automatically set up the entire dev environment in a container, installation dependencies, run migrations, etc.
5. Once the container is running in the `/workspaces/issac-holguin-prehab-takehome` directory, open a new terminal and run the following command:
   ```bash
   npm run dev
   ```

Project should be running on `http://localhost:3000`

## Running Tests

Tests are implemented using Jest and Supertest:

- Unit tests for routes and middleware
- Integration tests for the exercise search functionality (GET /exercises) that validate the service layer

Since the project uses SQLite, an in-memory database is used for testing to improve speed and isolation.

To run tests:

```bash
docker compose -f docker-compose.test.yml up --build
```

This will start the test container and run the tests.

## Production Deployment

To build and run a production container:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This creates a production container and runs it, mapping port 3000 on the host to port 3000 in the container.

## Project Structure

```
├── drizzle/                  # Database migrations
├── src/
│   ├── __tests__/           # Unit and integration tests
│   ├── config/              # Configuration (DB, logger)
│   ├── db/                  # Database schemas and setup
│   ├── middleware/          # Auth, permissions, validation, logging
│   ├── routes/              # API routes
│   ├── services/            # Service layer for database interactions
│   ├── types/               # Type definitions (e.g., AppError)
│   ├── utils/               # Utilities (JWT, bcrypt)
│   └── app.ts               # Main application entry point
```


## Database Schema

The schema file combines DrizzleORM and Zod to create a robust, type-safe database schema with built-in validation. 

### Database Tables

There are two main tables in the system:

**Users Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | Primary Key, Auto Increment |
| username | text | Not Null, Unique |
| password | text | Not Null |

**Exercises Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | Primary Key, Auto Increment |
| name | text | Not Null |
| description | text | Not Null |
| difficulty | integer | Not Null |
| isPublic | integer | Not Null |
| userId | integer | Foreign Key → users.id |

### Schema Validation

The implementation uses a two-layer validation approach:

1. **DrizzleORM Layer**
   * Handles database schema definition
   * Manages relationships between tables
   * Creates database indexes for performance
   * Provides type safety at the database level

2. **Zod Validation Layer**
   * Validates user input before it reaches the database
   * Enforces business rules like:
     * Username length (3-20 characters)
     * Password length (6-100 characters)
     * Exercise name length (1-100 characters)
     * Exercise description length (1-1000 characters)
     * Difficulty range (1-5)
     * Handles data transformations (like boolean to integer for SQLite)

## Database Migrations

This section covers how DB migrations work. DrizzleORM is used to create and apply migrations based off of the schema in `src/db/schema.ts`.

### Local Development

```bash
npm run db:generate:local
npm run db:migrate:local
```

### Production

```bash
npm run db:generate:prod
npm run db:migrate:prod
```

The difference is in the configuration files:

- `drizzle.config.ts` for local development
- `drizzle.config.prod.ts` for production



## Performance Optimizations

DrizzleORM enables easy creation of multi-column indexes for improved query performance. The following indexes have been implemented:

```typescript
// Primary index combination for the most common filter pattern
index("isPublic_userId_idx").on(t.isPublic, t.userId),

// For filtering + sorting combinations
index("isPublic_difficulty_idx").on(t.isPublic, t.difficulty),

// Single column index for direct difficulty lookups and sorts
index("difficulty_idx").on(t.difficulty),
```

These indexes optimize the most common query patterns for the exercises table.

## API Documentation

Here are all the routes:

- POST /users/register
- POST /users/login
- POST /users/refresh-token

- GET /exercises
- GET /exercises/:id
- POST /exercises
- PATCH /exercises/:id
- DELETE /exercises/:id

### Authentication Endpoints

#### POST /users/register

- **Input**: `{ username: string, password: string }`
- **Requirements**:
  - Username: 3-20 characters
  - Password: 6-100 characters
- **Auth**: No auth required
- **Returns**: User object, access token, and refresh token

#### POST /users/login

- **Input**: `{ username: string, password: string }`
- **Auth**: No auth required
- **Returns**: User object, access token, and refresh token

#### POST /users/refresh-token

- **Input**: `{ refreshToken: string }`
- **Auth**: No auth required
- **Returns**: New access token and refresh token

### Exercise Endpoints

#### GET /exercises

- **Query params**:
  - `name`: Filter by name (optional)
  - `description`: Filter by description (optional)
  - `difficulty`: Filter by difficulty 1-5 (optional)
  - `sortBy`: "difficulty" (optional)
  - `sortOrder`: "asc" or "desc" (optional)
- **Auth**: Optional (shows private exercises owned by user if authenticated)
- **Returns**: List of exercises

#### GET /exercises/:id

- **Path params**: `id` (exercise ID)
- **Auth**: Optional (required for private exercises)
- **Returns**: Single exercise object
- **Note**: Private exercises only visible to owner

#### POST /exercises

- **Input**:
  ```typescript
  {
    name: string,        // 1-100 chars
    description: string, // 1-1000 chars
    difficulty: number,  // 1-5
    isPublic: boolean
  }
  ```
- **Auth**: Required
- **Returns**: Created exercise object

#### PATCH /exercises/:id

- **Path params**: `id` (exercise ID)
- **Input**: Partial update of:
  ```typescript
  {
    name?: string,       // 1-100 chars
    description?: string,// 1-1000 chars
    difficulty?: number  // 1-5
  }
  ```
- **Auth**: Required
- **Permission rules**:
  - Owners can modify their own exercises
  - Any authenticated user can modify public exercises
  - Private exercises can only be modified by owner

#### DELETE /exercises/:id

- **Path params**: `id` (exercise ID)
- **Auth**: Required
- **Permission rules**:
  - Only the owner can delete their exercises
- **Returns**: Success message with deleted exercise ID
