

<!-- prompts -->
 I'm setting up user authentication for an Express + TypeScript project backed by PostgreSQL using the pg pool.
 
Can you help me write the service and controller functions for user registration and login?

 Requirements:
 1. Passwords must be hashed using bcrypt (10 rounds).
 2. Validate input fields using Zod (name min 2 chars, valid email format, password min 8 chars).
 3. New registrations should default to the 'user' role.
 4. If an email is already registered, return a 409 Conflict with a clear error message.
 5. On login, verify the password with bcrypt.compare. If valid, sign and return a JWT containing the user id as subject, along with user details (id, name, email, role). Never return the password hash.
 6. Use parameterized SQL queries ($1, $2) to avoid SQL injection."


 <!-- Prompt -->
How do I create a clean JWT authentication middleware in Express with TypeScript?

What it should do:
1. Read the token from req.headers.authorization (checking for 'Bearer ').
2. Verify the token against process.env.JWT_SECRET using jsonwebtoken.
3. Look up the user in PostgreSQL by id to confirm the account is active.
4. Attach the user record to req.user and call next().
5. Return 401 with structured JSON if the token is missing, malformed, or expired.


Created `server/src/types/express.d.ts` declaration merging for `req.user` with `{ id: string; name: string; email: string; role: 'admin' | 'user' }`.
Added custom `AuthError` class handling with specific HTTP status codes.




<!-- Prompt -->
I have my authenticate middleware setting req.user.

Now I need an authorization middleware to guard admin routes:
1. Create a requireAdmin middleware function.
2. If req.user is missing, return 401 Unauthorized.
3. If req.user.role is not 'admin', return 403 Forbidden with { message: 'Admin access required' }.
4. If the user is an admin, call next().


<!-- Prompt -->
Can you help me write the service and controller functions for admin user management?
 
Endpoints:
1. GET /api/users - returns all users (id, name, email, role, created_at) ordered by creation date. Exclude password hashes.
2. PATCH /api/users/:id/role - accepts { role: 'admin' | 'user' } with Zod validation and updates the user role in PostgreSQL.

Important safety check:
Admins must not be allowed to demote their own account. If req.user.id equals the target user id and the requested role is 'user', reject the request with 400 Bad Request and an explanatory message.

---


 <!-- Prompt -->
In a React + Vite SPA using Axios and React Router:

How should I configure an Axios response interceptor to handle HTTP 401 errors?
1. Check if the error response status is 401.
2. Clear auth_token and cached user from localStorage.
3. Disconnect any active Socket.IO connection.
4. Redirect the user to /login.
5. Avoid triggering an infinite loop if the 401 comes from the /api/auth/login endpoint itself."


