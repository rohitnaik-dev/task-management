<!-- Task Management Application -->

A full-stack collaborative task management application built using React, TypeScript, Node.js, Express, PostgreSQL, and Socket.IO. It enables users to create and manage multi-member projects, track task lifecycles, assign tasks, reorder them via drag-and-drop, and receive real-time updates across multiple sessions.

---

<!-- Deployed Application & Demo Credentials -->

- Hosted Frontend: [https://task-management-client-j89g.onrender.com]
- Backend API URL: [https://task-management-rf1t.onrender.com/api]
- Health Check: [https://task-management-rf1t.onrender.com/health]

<!-- Demo Admin Account -->
- Email: `test@example.com`
- Password: `StrongPassword123`
- Role: `admin`

You can also register a new account on the login page; new accounts automatically receive the default `user` role

---

<!-- Development Scope -->

In accordance with the assessment instructions, development was divided as follows:


- Relational database schema and migration design for projects and tasks
- Task CRUD API endpoints and service layer
- Task assignment and project membership validation logic
- Task status lifecycle (Pending,In Progress, Completed)
- Dense task ordering and database transaction reordering logic
- Main task board and project UI in React
- Drag-and-drop task reordering with optimistic updates and rollback
- Socket.IO real-time event broadcasting and multi-user room subscription

- User authentication (registration, login, JWT issuance, password hashing with bcrypt)
- User management API (listing users, role switching)
- Role-based access control (RBAC) middleware (authenticate, requireAdmin, self-demotion protection)
- Client-side Axios interceptors for 401 handling

---

<!-- Tech Stack -->

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Sonner (toast notifications), @dnd-kit/react & @dnd-kit/helpers (drag-and-drop), socket.io-client.
- Backend: Node.js (ES Modules), Express 5, TypeScript, tsx, PostgreSQL (pg connection pool), Socket.IO, Zod validation, bcryptjs, jsonwebtoken.
- Database: PostgreSQL with custom sequential SQL migration runner.




<!-- Local Setup & Installation -->

<!-- Prerequisites -->
- Node.js (v18 or higher)
- PostgreSQL database (local or cloud instance such as Neon, Supabase, etc.)

<!-- Clone the Repository -->
bash

git clone https://github.com/rohitnaik-dev/task-management.git
cd task-management


 <!-- Configure Environment Variables -->

Backend (server/.env):
Copy the example file and update with your PostgreSQL connection string and a secure JWT secret:
bash
cp server/.env.example server/.env

Example values:
env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_management
JWT_SECRET=super_secret_jwt_key_for_development
JWT_EXPIRES_IN=1h


Frontend (client/.env):
bash
cp client/.env.example client/.env

Example values:
env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000


<!-- 3. Install Dependencies -->
bash
Install backend dependencies
cd server
npm install

Install frontend dependencies
cd ../client
npm install

Return to root
cd ..

Run Database Migrations
Run the migration script to create all database tables and indexes:
bash


 <!-- Start the Application -->

Run both frontend and backend in development mode (using two terminal windows):
Terminal 1 (Backend Server):
bash
npm run dev:server
Server starts on http://localhost:5000


Terminal 2 (Frontend Client):
bash
npm run dev:client
Vite dev server starts on http://localhost:5173


Open your browser at `http://localhost:5173` to use the application.



<!-- Production Build Commands -->

bash
Build both backend (tsc) and frontend (vite build)
npm run build

Run typecheck across the backend
npm run typecheck:server

Run linting across the frontend
npm run lint:client

Start production server
npm --prefix server start


