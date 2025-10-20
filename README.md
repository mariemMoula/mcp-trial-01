# 🚀 MCP Trial 01 - Authenticated User Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Stytch](https://img.shields.io/badge/Stytch-19303D?style=for-the-badge)](https://stytch.com/)
[![Google AI](https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

A **production-ready Model Context Protocol (MCP)** implementation with enterprise-grade authentication, PostgreSQL database, and AI integration. Features Stytch magic link authentication, Prisma ORM, role-based permissions, audit logging, and comprehensive user management tools.

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Authentication Setup](#-authentication-setup)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Documentation Guide](#-documentation-guide)
- [MCP Server Components](#-mcp-server-components)
- [Client Features](#-client-features)
- [Database Management](#-database-management)
- [Scripts & Tools](#-scripts--tools)
- [VS Code Integration](#-vs-code-integration)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 **Enterprise Authentication**

- **Stytch Integration**: Passwordless magic link authentication
- **PostgreSQL Database**: Secure user data with Prisma ORM
- **Permission System**: Role-based access control (RBAC)
- **Audit Logging**: Complete activity tracking and compliance
- **Token Validation**: Secure session management with JWT
- **OAuth Callback Server**: Express.js server for authentication flow

### 🗄️ **Database & ORM**

- **PostgreSQL**: Production-ready relational database
- **Prisma ORM**: Type-safe database queries with autocomplete
- **Migration System**: Version-controlled schema changes
- **Prisma Studio**: Visual database browser and editor
- **Data Validation**: Runtime validation with Zod schemas
- **Connection Pooling**: Optimized database performance

### 🏗️ **MCP Server Capabilities**

- **🔧 Tools**: Create and manage users with validation
- **📚 Resources**: Access user data (all users or specific profiles)
- **💬 Prompts**: AI-powered fake user generation
- **🛡️ Protected Endpoints**: Permission-based access control
- **💾 Dual Storage**: Both PostgreSQL (production) and JSON (development)

### 🎭 **Interactive Clients**

- **Authenticated Client**: Full Stytch integration with magic links
- **Interactive CLI**: User-friendly menu-driven interface
- **Basic Client**: Simple MCP client for testing
- **🤖 AI Integration**: Google Gemini with function calling
- **✅ Input Validation**: Comprehensive validation with retry logic
- **🔄 Real-time Communication**: Seamless MCP protocol support

## 🚀 Quick Start

Get up and running in 5 minutes:

```powershell
# 1. Clone and install
git clone https://github.com/mariemMoula/mcp-trial-01.git
cd mcp-trial-01
npm install

# 2. Setup environment (copy .env.example to .env and add your keys)
# Required: DATABASE_URL, STYTCH_PROJECT_ID, STYTCH_SECRET, GEMINI_API_KEY

# 3. Setup database
npm run db:migrate    # Create database schema
npm run db:import     # Import sample users (optional)

# 4. Run the authenticated server
npm run client:interactive

# 5. Login with your email and click the magic link!
```

**That's it!** You now have a fully authenticated MCP server with PostgreSQL. 🎉

## 🏛️ Architecture

```
🎯 AUTHENTICATED MCP SYSTEM

┌─────────────────────────────────────┐
│       👤 USER (your@email.com)      │
└──────────────┬──────────────────────┘
               │
               ↓ 1. Request Magic Link
    ┌──────────────────────┐
    │   � STYTCH AUTH     │
    │   Send Magic Link    │
    │   Verify Email       │
    │   Issue Token        │
    └──────────┬───────────┘
               │
               ↓ 2. Access Token
    ┌──────────────────────┐
    │  🎭 AUTH CLIENT      │
    │  Token Management    │
    │  OAuth Server        │
    │  Interactive Menu    │
    └──────────┬───────────┘
               │
               ↓ 3. Authenticated Requests
    ┌──────────────────────┐
    │  🏗️ AUTH SERVER      │
    │  ├─ Validate Token   │
    │  ├─ Check Permissions│
    │  ├─ Execute Tools    │
    │  ├─ Access Resources │
    │  └─ Log Audits       │
    └──────────┬───────────┘
               │
               ↓ 4. Database Queries
    ┌──────────────────────┐
    │  �️ POSTGRESQL       │
    │  ├─ users (auth)     │
    │  ├─ sessions         │
    │  ├─ permissions      │
    │  ├─ audit_logs       │
    │  └─ mcp_users (data) │
    └──────────────────────┘
```

### **Two User Models**

| Model     | Table       | Purpose                      | Managed By |
| --------- | ----------- | ---------------------------- | ---------- |
| `User`    | `users`     | Authentication & permissions | Stytch     |
| `McpUser` | `mcp_users` | MCP tools data               | MCP Tools  |

**Why separate?** Different lifecycles, security isolation, and access patterns.

## 📋 Prerequisites

- **Node.js** 18+
- **PostgreSQL** 12+ (local or hosted)
- **npm** or **yarn**
- **Stytch Account** (free tier available)
- **Google AI API Key** (Gemini)
- **VS Code** (optional, for MCP integration)

## 🚀 Installation

```powershell
# 1. Clone the repository
git clone https://github.com/mariemMoula/mcp-trial-01.git
cd mcp-trial-01

# 2. Install dependencies
npm install

# 3. Build TypeScript files
npm run build
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL (Recommended for Development)

```powershell
# Install PostgreSQL on Windows
# Download from: https://www.postgresql.org/download/windows/

# After installation, create database
psql -U postgres
CREATE DATABASE mcp_trial;
\q

# Your DATABASE_URL will be:
# postgresql://postgres:your_password@localhost:5432/mcp_trial
```

### Option 2: Hosted PostgreSQL (Recommended for Production)

Use any PostgreSQL hosting service:

- **Supabase** (Free tier with 500MB)
- **Neon** (Free tier with 10GB)
- **Railway** (Free tier with 5GB)
- **Heroku Postgres** (Free tier with 1GB)

## 🔐 Authentication Setup

### 1. Create Stytch Account

1. Go to [stytch.com](https://stytch.com/) and sign up (free tier available)
2. Create a new project (e.g., "MCP Trial 01")
3. Navigate to **API Keys** section
4. Copy your **Project ID** and **Secret**

### 2. Configure OAuth Callback

In Stytch Dashboard:

1. Go to **Redirect URLs**
2. Add: `http://localhost:3000/auth/callback`
3. Save settings

### 3. Get Google AI Key

1. Go to [ai.google.dev](https://ai.google.dev/)
2. Click "Get API Key"
3. Create or select a project
4. Copy your API key

## ⚙️ Configuration

Create `.env` file in project root:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/mcp_trial"

# Stytch Authentication
STYTCH_PROJECT_ID="your_stytch_project_id"
STYTCH_SECRET="your_stytch_secret"

# Google AI (Gemini)
GEMINI_API_KEY="your_gemini_api_key"

# OAuth Callback Server (default: 3000)
OAUTH_PORT=3000
```

**Security Note:** Never commit `.env` to git! It's already in `.gitignore`.

### Initialize Database

```powershell
# Run Prisma migrations to create tables
npm run db:migrate

# This creates:
# ✅ users (authentication data)
# ✅ sessions (login sessions)
# ✅ permissions (permission definitions)
# ✅ user_permissions (user-permission mapping)
# ✅ audit_logs (activity tracking)
# ✅ mcp_users (MCP tool data)

# (Optional) Import sample users from JSON
npm run db:import
```

## 🎮 Usage

### � Authenticated Server (Production)

**Full authentication with Stytch + PostgreSQL:**

```powershell
# Start authenticated interactive client
npm run client:interactive

# What happens:
# 1. Enter your email
# 2. Check your inbox for magic link
# 3. Click the link (opens browser)
# 4. Automatic login in terminal
# 5. Interactive menu appears

# Menu options:
# ❯ 👤 Create user
#   🎲 Create random user
#   👥 View all users
#   🔧 List available tools
#   📚 List available resources
#   🚪 Logout
```

**Direct server access:**

```powershell
# Run authenticated server directly (for debugging)
npm run server:auth:direct

# Get authentication token
npm run auth:get-token
```

### 🧪 Basic Servers (Development/Testing)

**Simple MCP server (no auth):**

```powershell
# Run basic server
npm run server:dev

# Run basic client
npm run client:dev

# Use MCP Inspector (visual debugging)
npm run server:inspect
```

### 📱 Interactive Client Features

```
🎯 What would you like to do?

❯ 👤 Create user
  • Enter name, email, address, phone
  • Validates all inputs
  • Saves to PostgreSQL via Prisma
  • Returns user ID and confirmation

  🎲 Create random user
  • Generates realistic fake data
  • Unique emails with timestamps
  • Automatic phone formatting
  • Instant database insertion

  👥 View all users
  • Shows all users in database
  • Formatted JSON output
  • Ordered by creation date
  • Requires 'resources.users' permission

  🔧 List available tools
  • Shows all MCP tools you can use
  • Displays required permissions
  • Interactive tool selection

  📚 List available resources
  • Shows all data resources
  • URI format examples
  • Permission requirements

  🚪 Logout
  • Ends current session
  • Clears authentication token
  • Stops OAuth callback server
```

## � Documentation Guide

This project includes **15+ comprehensive guides** covering authentication, Prisma, and MCP implementation.

### 🎯 Quick Navigation

| Need                             | Read This                    | Time      |
| -------------------------------- | ---------------------------- | --------- |
| **Get started fast**             | `START-HERE.md`              | 5 min     |
| **Add authentication**           | `TUTORIAL-STEP-BY-STEP.md`   | 45-60 min |
| **Migrate to Prisma**            | `QUICK-START-POSTGRES.md`    | 5 min     |
| **Understand Prisma deeply**     | `PRISMA-MIGRATION-GUIDE.md`  | 30 min    |
| **Visual architecture diagrams** | `PRISMA-VISUAL-GUIDE.md`     | 15 min    |
| **Fix permission errors**        | `PERMISSION-FIX.md`          | 5 min     |
| **Command reference**            | `QUICK-REFERENCE.md`         | Reference |
| **Troubleshoot issues**          | `SETUP-AND-TESTING-GUIDE.md` | As needed |

### � Complete Documentation List

**Authentication Tutorials:**

- `START-HERE.md` - Overview and getting started
- `TUTORIAL-STEP-BY-STEP.md` - Complete authentication tutorial (Steps 0-5)
- `TUTORIAL-PART-2.md` - Creating auth code (Steps 6-8)
- `TUTORIAL-PART-3.md` - Integration and testing (Steps 9-11)
- `AUTHENTICATION-DEEP-DIVE.md` - Advanced authentication concepts
- `AUTHENTICATION-FAQ.md` - Common questions and answers
- `PERMISSION-FIX.md` - Troubleshooting permission issues

**Prisma & Database:**

- `PRISMA-COMPLETE-GUIDE.md` - Table of contents for Prisma guides
- `QUICK-START-POSTGRES.md` - 5-minute Prisma migration
- `PRISMA-MIGRATION-GUIDE.md` - Complete Prisma tutorial with syntax
- `PRISMA-VISUAL-GUIDE.md` - Architecture diagrams and data flow
- `MIGRATION-CHECKLIST.md` - Step-by-step migration checklist

**MCP Implementation:**

- `ARCHITECTURE-EXPLAINED.md` - System architecture overview
- `AUTHENTICATED-SERVER-UPDATED.md` - Server migration to Prisma
- `EXPRESS-API-EXPLAINED.md` - OAuth callback server details
- `INTERACTIVE-CLIENT-GUIDE.md` - Client implementation guide

**Reference Guides:**

- `QUICK-REFERENCE.md` - All commands cheat sheet
- `COMMANDS-REFERENCE.md` - Detailed command explanations
- `SETUP-AND-TESTING-GUIDE.md` - Complete setup and troubleshooting

### 🚀 Suggested Learning Path

```
1️⃣ START-HERE.md (5 min)
   ↓ Understand what you're building

2️⃣ QUICK-START-POSTGRES.md (5 min)
   ↓ Migrate to PostgreSQL + Prisma

3️⃣ TUTORIAL-STEP-BY-STEP.md (45-60 min)
   ↓ Add Stytch authentication

4️⃣ Run client:interactive
   ↓ Test the complete system

5️⃣ PRISMA-MIGRATION-GUIDE.md (30 min)
   ↓ Deep dive into Prisma concepts

6️⃣ Build your own features! 🎉
```

---

## 🏗️ MCP Server Components

### 🔧 **Tools** (Protected by Permissions)

#### `create-user`

Creates a new user in PostgreSQL database.

**Permission Required:** `tools.create-user`

**Input Schema:**

```typescript
{
  name: string; // Full name (required)
  email: string; // Valid email format (unique)
  address: string; // Complete address (required)
  phone: string; // Phone number (required)
}
```

**Example:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "456 Oak Ave, Springfield 62701",
  "phone": "(555) 987-6543"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 5,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2025-10-20T10:30:00.000Z"
  },
  "createdBy": "admin@example.com"
}
```

#### `create-random-user`

Generates and saves realistic fake user data.

**Permission Required:** `tools.create-random-user`

**No input required** - automatically generates:

- Realistic name combinations (50+ first names, 50+ last names)
- Diverse email domains (@gmail.com, @yahoo.com, @outlook.com, etc.)
- Authentic addresses with street numbers and zip codes
- Properly formatted US phone numbers
- Unique emails with timestamps to prevent duplicates

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 6,
    "name": "Michael Chen",
    "email": "mchen_483921@gmail.com",
    "address": "789 Pine St, Austin 78701",
    "phone": "(555) 234-5678",
    "createdAt": "2025-10-20T10:31:00.000Z"
  }
}
```

### 📚 **Resources** (Protected by Permissions)

#### `users://all`

Returns complete list of all users from PostgreSQL.

**Permission Required:** `resources.users` or `resources.users.read`

**URI:** `users://all`

**Response:**

```json
[
  {
    "id": 1,
    "name": "John Smith",
    "email": "john@example.com",
    "address": "123 Main St, Springfield 62701",
    "phone": "(555) 123-4567",
    "createdAt": "2025-10-19T15:20:00.000Z",
    "updatedAt": "2025-10-19T15:20:00.000Z"
  }
  // ... more users
]
```

#### `users://{userId}/profile`

Returns detailed profile for a specific user by ID.

**Permission Required:** `resources.user-details`

**URI:** `users://5/profile`

**Response:**

```json
{
  "id": 5,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "456 Oak Ave, Springfield 62701",
  "phone": "(555) 987-6543",
  "createdAt": "2025-10-20T10:30:00.000Z",
  "updatedAt": "2025-10-20T10:30:00.000Z"
}
```

### 💬 **Prompts** (AI Generation Templates)

#### `generate-fake-user`

AI-powered user generation prompt for Google Gemini.

**Parameters:**

- `name` (optional): Specific name to use
- `style` (optional): Generation style
  - `professional`: Corporate emails, formal addresses
  - `casual`: Common providers, simple formatting (default)
  - `international`: Diverse names and formats

**Usage Example:**

```typescript
const prompt = await mcp.getPrompt({
  name: "generate-fake-user",
  arguments: { style: "professional" },
});
// Returns prompt template for AI to generate user data
```

## 🎭 Client Features

### 🔐 **Authentication Flow**

```
1. User enters email
   ↓
2. Stytch sends magic link to inbox
   ↓
3. User clicks link (opens browser)
   ↓
4. OAuth callback server captures token
   ↓
5. Token stored for MCP requests
   ↓
6. Interactive menu appears
   ↓
7. All requests include token in header
   ↓
8. Server validates token with Stytch
   ↓
9. Permissions checked before execution
   ↓
10. Audit log created for each action
```

### 🤖 **AI Integration**

- **Google Gemini**: Function calling with MCP tools
- **Streaming Support**: Real-time response generation
- **Context Awareness**: AI understands available tools and resources
- **Error Recovery**: Automatic retry with helpful suggestions

### ✅ **Input Validation**

- **Email Validation**: RFC-compliant format checking
- **Phone Validation**: US format with flexible input (accepts multiple formats)
- **Retry Logic**: Up to 3 attempts with helpful error messages
- **Type Safety**: Full TypeScript + Zod schema validation
- **Duplicate Detection**: Prevents duplicate emails in database

### 🎮 **Interactive Menu System**

- **@inquirer/prompts**: Beautiful CLI interface
- **Clear Navigation**: Easy-to-use menu options
- **Real-time Feedback**: Loading indicators and success messages
- **Error Handling**: Graceful error display with recovery options
- **Session Management**: Persistent login until logout

## �️ Database Management

### **Prisma Commands**

```powershell
# Create and apply migrations
npm run db:migrate
# or: npx prisma migrate dev --name your_migration_name

# Open Prisma Studio (visual database browser)
npm run db:studio

# Regenerate Prisma Client (after schema changes)
npm run db:generate

# Reset database (⚠️ DESTRUCTIVE - deletes all data)
npm run db:reset

# Import users from JSON to PostgreSQL
npm run db:import
```

### **Prisma Studio**

Visual database browser at `http://localhost:5555`:

- ✅ View all tables and data
- ✅ Edit records directly
- ✅ Add new records with form validation
- ✅ Delete records
- ✅ Filter and search data
- ✅ View relationships between tables

**Launch:** `npm run db:studio`

### **Database Schema**

Your PostgreSQL database includes:

| Table              | Purpose                 | Key Fields                     |
| ------------------ | ----------------------- | ------------------------------ |
| `users`            | Authentication data     | email, stytchUserId, createdAt |
| `sessions`         | Login sessions          | sessionToken, expiresAt        |
| `permissions`      | Permission definitions  | name, category, description    |
| `user_permissions` | User-permission mapping | userId, permissionId           |
| `audit_logs`       | Activity tracking       | userId, action, resourceType   |
| `mcp_users`        | MCP tool user data      | name, email, address, phone    |

### **Migration History**

Migrations are stored in `prisma/migrations/`:

- `20251018111717_init/` - Initial schema with auth tables
- `20251020143059_add_mcp_users/` - Added mcp_users table

## 🛠️ Scripts & Tools

### **User Management Scripts**

Located in `scripts/` directory:

```powershell
# Import users from JSON to PostgreSQL
npx tsx scripts/importUsers.ts

# View audit logs (all user activity)
npx tsx scripts/viewAuditLogs.ts

# Delete a user and all related data
npx tsx scripts/deleteUser.ts
```

### **Audit Logs**

View all user activity:

```powershell
npx tsx scripts/viewAuditLogs.ts

# Example output:
# 📋 Audit Logs (Last 50):
# ────────────────────────────────────────────────
# 🔧 TOOL_CALL: create-random-user
#    User: admin@example.com
#    Time: 2025-10-20 10:30:15
#    Result: SUCCESS
#
# 📚 RESOURCE_ACCESS: users://all
#    User: admin@example.com
#    Time: 2025-10-20 10:31:42
#    Result: SUCCESS
```



## �🔧 VS Code Integration

### **Adding MCP Server to VS Code**

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. **Search**: "MCP: Add Server"
3. **Configure Server**:

   ```json
   {
     "name": "mcp-trial-01-auth",
     "command": "npx",
     "args": ["tsx", "src/authenticated_server.ts"],
     "cwd": "C:\\Users\\YourName\\path\\to\\mcp-trial-01",
     "env": {
       "MCP_ACCESS_TOKEN": "your_stytch_token_here"
     }
   }
   ```

4. **Verify Installation**: "MCP: Show Servers"

### **Getting Your Access Token**

```powershell
# Method 1: Run authenticated client once
npm run client:interactive
# After login, token is displayed in console

# Method 2: Get token programmatically
npm run auth:get-token
```

### **Using with VS Code AI Chat**

Once configured with your access token, all MCP tools are available in VS Code's AI chat:

```
You: Create a random user
AI: [Calls create-random-user tool via MCP]
    ✅ Created user: Michael Chen (mchen_483921@gmail.com)

You: Show all users
AI: [Accesses users://all resource]
    📋 Found 12 users in database
```

## 📚 API Reference

### **Environment Variables**

```env
# Required
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
STYTCH_PROJECT_ID="project-test-xxx"
STYTCH_SECRET="secret_test_xxx"
GEMINI_API_KEY="AIzaSyXXX"

# Optional
OAUTH_PORT=3000              # OAuth callback server port
NODE_ENV=development         # Environment mode
```


## �🛠️ Development

### **Project Structure**

```
mcp-trial-01/
├── src/
│   ├── authenticated_server.ts    # Production MCP server (Prisma + Stytch)
│   ├── authenticated_client.ts    # Interactive auth client
│   ├── server.ts                  # Basic MCP server (JSON storage)
│   ├── client.ts                  # Basic MCP client
│   ├── interactive_client.ts      # Menu-driven client
│   ├── auth/
│   │   ├── authMiddleware.ts      # Token validation
│   │   └── authorizationService.ts # Permission checks
│   └── data/
│       └── users.json             # Legacy JSON storage
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
├── scripts/
│   ├── importUsers.ts             # JSON to PostgreSQL import
│   ├── viewAuditLogs.ts           # View activity logs
│   └── deleteUser.ts              # Delete user utility
├── build/                         # Compiled JavaScript
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── .env                           # Environment variables (not in git)
```

### **Available Scripts**

```powershell
# Build
npm run build                    # Compile TypeScript

# Servers
npm run server:dev               # Basic server (JSON storage)
npm run server:auth:direct       # Authenticated server (direct run)
npm run server:inspect           # MCP Inspector (debugging)

# Clients
npm run client:dev               # Basic client
npm run client:interactive       # Interactive menu client (auth)
npm run auth:get-token           # Get authentication token

# Database
npm run db:migrate               # Create/apply migrations
npm run db:studio                # Open Prisma Studio
npm run db:generate              # Regenerate Prisma Client
npm run db:import                # Import JSON users to PostgreSQL
npm run db:reset                 # Reset database (⚠️ DESTRUCTIVE)
```

### **Development Workflow**

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration:** `npm run db:migrate`
3. **Verify in Prisma Studio:** `npm run db:studio`
4. **Update server code** in `src/authenticated_server.ts`
5. **Test with client:** `npm run client:interactive`
6. **Check audit logs:** `npx tsx scripts/viewAuditLogs.ts`

### **Testing Strategy**

```powershell
# 1. Test basic MCP functionality
npm run server:dev
npm run client:dev

# 2. Test Prisma queries
npm run db:studio

# 3. Test authentication flow
npm run client:interactive

# 4. Test permissions
# Try accessing tools without proper permissions

# 5. Test audit logging
npx tsx scripts/viewAuditLogs.ts

# 6. Test with MCP Inspector (visual debugging)
npm run server:inspect
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Setup**

```powershell
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/mcp-trial-01.git
cd mcp-trial-01

# 2. Install dependencies
npm install

# 3. Setup development environment
cp .env.example .env
# Add your API keys and database URL

# 4. Setup database
npm run db:migrate

# 5. Test your changes
npm run client:interactive
```


### **Code Style**

- TypeScript with strict mode enabled
- Use Prettier for formatting
- Follow existing code patterns
- Add JSDoc comments for public functions
- Include error handling

### **What to Contribute**

- 🐛 Bug fixes
- ✨ New MCP tools or resources
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Test coverage
- 🌍 Internationalization



## 🙏 Acknowledgments

### **Frameworks & Tools**

- [Model Context Protocol](https://modelcontextprotocol.io/) - Excellent MCP framework
- [Prisma](https://www.prisma.io/) - Modern database toolkit
- [PostgreSQL](https://www.postgresql.org/) - Powerful open-source database
- [Stytch](https://stytch.com/) - Passwordless authentication platform
- [Google AI](https://ai.google.dev/) - Gemini API integration
- [Vercel AI SDK](https://sdk.vercel.ai/) - Universal AI framework
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Express.js](https://expressjs.com/) - OAuth callback server
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts

### **Special Thanks**

- The MCP community for excellent documentation and examples
- Stytch team for comprehensive authentication docs
- Prisma team for type-safe database access
- All contributors and users of this project

## 📊 Project Stats

- **Lines of Code:** ~3,000+ (TypeScript)
- **Database Tables:** 6 (users, sessions, permissions, audit_logs, mcp_users)
- **MCP Tools:** 2 (create-user, create-random-user)
- **MCP Resources:** 2 (users://all, users://{id}/profile)
- **Authentication:** Stytch magic links with Prisma
- **TypeScript:** Strict mode with full type safety


---

<div align="center">

### **Built with ❤️ using Model Context Protocol**

[![GitHub Stars](https://img.shields.io/github/stars/mariemMoula/mcp-trial-01?style=social)](https://github.com/mariemMoula/mcp-trial-01/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/mariemMoula/mcp-trial-01?style=social)](https://github.com/mariemMoula/mcp-trial-01/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/mariemMoula/mcp-trial-01)](https://github.com/mariemMoula/mcp-trial-01/issues)

[🐛 Report Bug](https://github.com/mariemMoula/mcp-trial-01/issues) • [✨ Request Feature](https://github.com/mariemMoula/mcp-trial-01/issues) • [📚 Documentation](https://github.com/mariemMoula/mcp-trial-01/wiki) • [⭐ Star on GitHub](https://github.com/mariemMoula/mcp-trial-01)

**If this project helped you, consider giving it a ⭐!**

</div>
