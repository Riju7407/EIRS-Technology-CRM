# EIRS CRM - Customer Relationship Management System

A full-stack MERN application for managing client relationships, follow-up scheduling, and interaction logging — built with MVC architecture.

---

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Database  | MongoDB + Mongoose  |
| Backend   | Node.js + Express   |
| Frontend  | React.js + Vite     |
| Auth      | JWT (JSON Web Token)|
| Styling   | Custom CSS          |

---

## Project Structure

```
EIRS-CRM/
├── client/                    # React.js Frontend
│   ├── src/
│   │   ├── api/               # Axios instance
│   │   ├── components/
│   │   │   ├── clients/       # ClientForm
│   │   │   ├── followups/     # FollowUpForm
│   │   │   ├── interactions/  # InteractionForm
│   │   │   ├── common/        # Spinner, Modal, StatusBadge, PrivateRoute
│   │   │   └── layout/        # Navbar, Sidebar, Layout
│   │   ├── context/           # AuthContext
│   │   ├── pages/             # All page components
│   │   └── services/          # API service layers
│   └── package.json
│
└── server/                    # Express.js Backend (MVC)
    ├── config/                # Database connection
    ├── controllers/           # Business logic
    │   ├── authController.js
    │   ├── clientController.js
    │   ├── followUpController.js
    │   └── interactionController.js
    ├── middleware/             # Auth & error handling
    ├── models/                # Mongoose schemas
    │   ├── User.js
    │   ├── Client.js
    │   ├── FollowUp.js
    │   └── Interaction.js
    ├── routes/                # Express routers
    └── server.js
```

---

## Features

### Client Management
- Store complete customer details (name, email, phone, company, address)
- Track purchase history with invoice numbers and amounts
- Manage service interactions per client
- Auto-calculate total purchase value
- Assign clients to agents
- Filter by status, source, search

### Follow-Up Scheduling
- Schedule follow-ups with date and time
- Categorize with labels:
  - **Pending Response**
  - **Payment Due**
  - **Scheduled Call**
  - **Market Follow-up**
  - **Urgent**, New Lead, Proposal Sent, Negotiation, etc.
- Priority levels: Low, Medium, High, Critical
- Auto-mark overdue follow-ups
- Track completion with outcomes
- Multi-channel: Phone, Email, In-Person, Video, WhatsApp

### Interaction Logs
- Log queries, complaints, feedback, calls, meetings, notes
- Track sentiment (Positive, Neutral, Negative)
- Assign status: Open → In-Progress → Resolved → Closed
- Resolution tracking with resolver details
- Full interaction history per client

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd EIRS-CRM
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   Edit `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/eirs_crm
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Start Backend (from `/server`):**
```bash
npm run dev
```

**Start Frontend (from `/client`):**
```bash
npm run dev
```

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | /api/auth/register   | Register admin/agent |
| POST   | /api/auth/login      | Login              |
| GET    | /api/auth/me         | Get current user   |
| GET    | /api/auth/users      | Get all users (admin) |

### Clients
| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| GET    | /api/clients               | Get all clients       |
| GET    | /api/clients/stats         | Get client stats      |
| GET    | /api/clients/:id           | Get single client     |
| POST   | /api/clients               | Create client         |
| PUT    | /api/clients/:id           | Update client         |
| DELETE | /api/clients/:id           | Delete client (admin) |
| POST   | /api/clients/:id/purchase  | Add purchase history  |

### Follow-Ups
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/followups        | Get all follow-ups       |
| GET    | /api/followups/stats  | Get follow-up stats      |
| GET    | /api/followups/labels | Get available labels     |
| GET    | /api/followups/:id    | Get single follow-up     |
| POST   | /api/followups        | Create follow-up         |
| PUT    | /api/followups/:id    | Update follow-up         |
| DELETE | /api/followups/:id    | Delete (admin)           |

### Interactions
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/interactions                 | Get all interactions     |
| GET    | /api/interactions/stats           | Get interaction stats    |
| GET    | /api/interactions/client/:id      | Client's interactions    |
| GET    | /api/interactions/:id             | Single interaction       |
| POST   | /api/interactions                 | Log interaction          |
| PUT    | /api/interactions/:id             | Update interaction       |
| DELETE | /api/interactions/:id             | Delete (admin)           |

---

## Default Admin Setup

Register a new admin via the API or create one directly:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@eirs.com",
  "password": "admin123",
  "role": "admin"
}
```

Then use these credentials to log into the CRM dashboard.

---

## License
EIRS CRM — All rights reserved &copy; 2024
