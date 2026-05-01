# Project Management Dashboard

A modern project management workspace built for small teams. This application combines secure user authentication, project planning, task tracking, team management, and real-time insights in a polished React + TypeScript interface.

## Key Features

- **User authentication**
  - Signup and login flows
  - JWT-based session management
  - Protected routes for authenticated users
- **Dashboard analytics**
  - Task status summary
  - Overdue task detection
  - Breakdown of open vs completed tasks by project
  - Personalized assignment highlights
- **Projects management**
  - Create and organize projects
  - Track project progress with task completion metrics
  - Edit and delete projects (admin-only actions)
  - Assign members to projects
- **Task management**
  - Create and edit tasks with project association
  - Assign tasks to team members
  - Update task status: todo, in-progress, done
  - Filter tasks by ownership, status, and overdue state
- **Team directory**
  - User roster with role badges
  - Task load summary per teammate
  - Full workspace membership visibility
- **Backend API**
  - Express server with secure endpoints
  - Prisma ORM backed by SQLite
  - Role-based access controls for administrative actions

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- UI: Radix UI components, Lucide icons, Sonner notifications
- Data fetching: TanStack React Query, Axios
- Validation: Zod
- Backend: Express, Prisma, SQLite, JWT, bcrypt

## Repository Structure

- `src/` – React application source
- `server/` – API server and Prisma database configuration
- `public/` – static assets
- `package.json` – frontend install and build scripts
- `server/package.json` – backend server scripts

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure the backend

Create a `.env` file in the `server/` folder with the following values:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
```

### 4. Start the backend server

```bash
cd server
npm run dev
```

### 5. Start the frontend app

```bash
npm run dev
```

### 6. Open the app

Visit the URL shown in the terminal, typically `http://localhost:5173`.

## Available Scripts

### Frontend
- `npm run dev` — start the Vite development server
- `npm run build` — build the production bundle
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run test` — run unit tests with Vitest

### Backend
- `cd server && npm run dev` — start the API server in watch mode
- `cd server && npm start` — run the backend server directly

## Notes

- The backend uses SQLite for local development by default.
- Admin users can manage projects and team assignments.
- Task status updates and project progress are reflected instantly in the dashboard.
