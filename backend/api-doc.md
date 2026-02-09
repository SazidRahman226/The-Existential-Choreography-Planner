# API Documentation

## Authentication (`/api/auth`)

### Public Routes

#### Register
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  - `201 Created`: Registration successful. Returns user data. Cookies (`accessToken`, `refreshToken`) are set.
  - `400 Bad Request`: Missing fields or password too short.

#### Login
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "johndoe",
    "password": "password123"
  }
  ```
- **Response:**
  - `200 OK`: Login successful. Returns user data. Cookies (`accessToken`, `refreshToken`) are set.
  - `401 Unauthorized`: Invalid credentials.

#### Refresh Token
- **URL:** `/api/auth/refresh`
- **Method:** `POST`
- **Access:** Public (Requires `refreshToken` cookie)
- **Request Body:** None
- **Response:**
  - `200 OK`: Tokens refreshed successfully. New cookies set.
  - `401 Unauthorized`: Missing or invalid refresh token.

#### Check Username
- **URL:** `/api/auth/check-username/:username`
- **Method:** `GET`
- **Access:** Public
- **Response:**
  - `200 OK`: `{ "available": true, "message": "Username is available" }`

#### Forgot Password
- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
- **Response:**
  - `200 OK`: `{ "message": "Email sent" }`

#### Reset Password
- **URL:** `/api/auth/reset-password/:token`
- **Method:** `POST`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "password": "newpassword123"
  }
  ```
- **Response:**
  - `200 OK`: Password reset successful. Cookies set.

### Protected Routes (Authenticated User)

#### Logout
- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Access:** Authenticated User
- **Response:**
  - `200 OK`: Logged out successfully. Cookies cleared.

#### Get Profile
- **URL:** `/api/auth/profile`
- **Method:** `GET`
- **Access:** Authenticated User
- **Response:**
  - `200 OK`: Returns current user profile with badges.

#### Update Profile
- **URL:** `/api/auth/profile`
- **Method:** `PUT`
- **Access:** Authenticated User
- **Request Body:**
  ```json
  {
    "fullName": "John Doe Updated",
    "username": "newusername",
    "bio": "New bio",
    "avatar": "url_to_avatar"
  }
  ```
- **Response:**
  - `200 OK`: Profile updated successfully.

### Admin Routes

#### Get All Users
- **URL:** `/api/auth/users`
- **Method:** `GET`
- **Access:** Admin
- **Response:**
  - `200 OK`: List of all users.

#### Update User Role
- **URL:** `/api/auth/users/:id/role`
- **Method:** `PUT`
- **Access:** Admin
- **Request Body:**
  ```json
  {
    "role": "admin" // or "user"
  }
  ```
- **Response:**
  - `200 OK`: User role updated.

#### Update User Status
- **URL:** `/api/auth/users/:id/status`
- **Method:** `PUT`
- **Access:** Admin
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
- **Response:**
  - `200 OK`: User status updated.

---

## Flows (`/api/flows`)

**All Flow routes require Authentication.**

#### Get All Flows
- **URL:** `/api/flows`
- **Method:** `GET`
- **Access:** Authenticated User
- **Response:**
  - `200 OK`: List of flows belonging to the user.

#### Create Flow
- **URL:** `/api/flows`
- **Method:** `POST`
- **Access:** Authenticated User
- **Request Body:** (Example)
  ```json
  {
    "title": "My Flow",
    "description": "Flow description",
    "blocks": [],
    "edges": []
  }
  ```
- **Response:**
  - `201 Created`: Returns created flow.

#### Get Flow by ID
- **URL:** `/api/flows/:id`
- **Method:** `GET`
- **Access:** Authenticated User (Owner or Public flows)
- **Response:**
  - `200 OK`: Returns flow details.
  - `403 Forbidden`: Access denied (if deemed private and not owner).
  - `404 Not Found`: Flow not found.

#### Update Flow
- **URL:** `/api/flows/:id`
- **Method:** `PUT`
- **Access:** Authenticated User (Owner only)
- **Request Body:** Flow object fields to update.
- **Response:**
  - `200 OK`: Returns updated flow.

#### Delete Flow
- **URL:** `/api/flows/:id`
- **Method:** `DELETE`
- **Access:** Authenticated User (Owner only)
- **Response:**
  - `200 OK`: `{ "message": "Flow deleted successfully" }`

---

## Tasks (`/api/tasks`)

> **Note:** Currently, task routes appear to be public as they do not have authentication middleware applied in `taskRoutes.js` or `index.js`.

#### Get All Tasks
- **URL:** `/api/tasks`
- **Method:** `GET`
- **Access:** Public (Currently)
- **Response:**
  - `200 OK`: List of all tasks.

#### Create Task
- **URL:** `/api/tasks`
- **Method:** `POST`
- **Access:** Public (Currently)
- **Request Body:**
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "status": "pending", // optional
    "priority": "medium", // optional
    "dueDate": "2023-12-31" // optional
  }
  ```
- **Response:**
  - `201 Created`: Returns created task.

#### Get Task by ID
- **URL:** `/api/tasks/:id`
- **Method:** `GET`
- **Access:** Public (Currently)
- **Response:**
  - `200 OK`: Returns task details.
  - `404 Not Found`: Task not found.

#### Update Task
- **URL:** `/api/tasks/:id`
- **Method:** `PUT`
- **Access:** Public (Currently)
- **Request Body:** Fields to update.
- **Response:**
  - `200 OK`: Returns updated task.

#### Delete Task
- **URL:** `/api/tasks/:id`
- **Method:** `DELETE`
- **Access:** Public (Currently)
- **Response:**
  - `200 OK`: `{ "message": "Task deleted successfully" }`
