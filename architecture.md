# Project Architecture & Workflow

This document outlines the architectural flow of "The Existential Choreography Planner".

## High-Level Architecture

The project follows a standard MERN (MongoDB, Express.js, React, Node.js) stack architecture.

```mermaid
graph TD
    User[User]
    
    subgraph Frontend ["Frontend (React + Vite)"]
        UI["User Interface / Pages"]
        AuthContext[Auth Provider]
        APIServices[API Services]
        
        UI --> AuthContext
        UI --> APIServices
    end
    
    subgraph Backend ["Backend (Node.js + Express)"]
        APIGateway["API Routes / Middleware"]
        Controllers[Controllers]
        Services["Business Logic / Services"]
        Repo["Repositories / DAL"]
        
        APIGateway --> Controllers
        Controllers --> Services
        Services --> Repo
    end
    
    subgraph Database ["Data Storage"]
        MongoDB[(MongoDB)]
    end
    
    User -- Interacts --> UI
    APIServices -- HTTP Requests (Axios/Fetch) --> APIGateway
    Repo -- Mongoose --> MongoDB
```

## Detailed Workflow

### 1. User Interaction Flow
1. **Access**: User visits the web application (Landing Page).
2. **Authentication**: User logs in or registers via `/login` or `/register`.
    - Frontend sends credentials to `/api/auth/login`.
    - Backend validates and returns JWT (Access/Refresh tokens) via HttpOnly cookies.
3. **Dashboard**: Authenticated user accesses `/dashboard`.
    - Frontend checks for valid Auth Context.
    - If valid, fetches user data and flows.
    
### 2. Data Flow (Example: Creating a New Flow)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as MongoDB
    
    U->>FE: Click "Create New Flow"
    FE->>BE: POST /api/flows (with title, description)
    Note over FE,BE: Auth Middleware verifies Token
    BE->>BE: FlowController checks input
    BE->>BE: FlowService creates model
    BE->>DB: Save new Flow document
    DB-->>BE: Return saved Flow
    BE-->>FE: Return JSON (Flow ID, Data)
    FE-->>U: Redirect to Flow Editor (/flows/:id)
```

## Technology Stack Structure

### Frontend (`/frontend`)
- **Framework**: React (Vite)
- **Routing**: `react-router-dom` (App.jsx)
- **State**: Context API (`AuthProvider`)
- **API Client**: Service layer patterns (`services/`)

### Backend (`/backend`)
- **Server**: Node.js + Express (`index.js`)
- **Authentication**: Passport.js + JWT (`config/passport.js`)
- **Database**: Mongoose (`config/db.js`)
- **Structure**: Layered Architecture
    - **Routes**: Define endpoints (`routes/`)
    - **Controllers**: Handle HTTP requests (`controllers/`)
    - **Services**: Business logic (`services/`)
    - **Repositories**: Database access (`repositories/`)

## Folder Structure

```text
├── backend/
│   ├── config/             # Database & Passport config
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & Error middlewares
│   ├── models/             # Mongoose schemas
│   ├── repositories/       # DAL (Data Access Layer)
│   ├── routes/             # API Endpoints
│   ├── services/           # Business Logic
│   ├── utils/              # Utility functions
│   └── index.js            # Entry point
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── providers/      # Context providers (Auth, Popup)
│   │   ├── routes/         # Route definitions (Public/Private)
│   │   ├── services/       # API integration
│   │   ├── styles/         # Global styles
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   └── vite.config.ts      # Vite configuration
├── Docker-compose.yaml     # Container orchestration
└── specSheet.md            # Project Specification
```
