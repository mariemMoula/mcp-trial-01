# 🚀 MCP Trial 01 - Model Context Protocol User Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Google AI](https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

A comprehensive **Model Context Protocol (MCP)** implementation featuring a robust user management system with AI integration. This project demonstrates proper MCP client-server architecture with tools, resources, prompts, and advanced input validation.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [MCP Server Components](#-mcp-server-components)
- [Client Features](#-client-features)
- [VS Code Integration](#-vs-code-integration)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🏗️ **MCP Server Capabilities**

- **🔧 Tools**: Create users manually or generate random fake users
- **📚 Resources**: Access user data (all users or specific user profiles)
- **💬 Prompts**: AI-powered fake user generation with customizable styles
- **🛡️ Validation**: Robust input validation using Zod schemas
- **💾 Persistence**: JSON-based data storage with automatic ID management

### 🎭 **Interactive Client**

- **🎮 CLI Interface**: User-friendly command-line interface with interactive menus
- **🤖 Dual AI Integration**: Support for both Google AI SDK and AI SDK approaches
- **✅ Input Validation**: Comprehensive validation with retry logic and helpful error messages
- **🔄 Real-time Communication**: Seamless MCP client-server communication
- **📱 Multi-modal Operations**: Handle tools, resources, prompts, and direct AI queries

## 🏛️ Architecture

```
🎯 MCP SYSTEM ARCHITECTURE
├── 🏗️ MCP SERVER (src/server.ts)
│   ├── 🔧 TOOLS
│   │   ├── create-user (manual input with validation)
│   │   └── create-random-user (automatic generation)
│   ├── 📚 RESOURCES
│   │   ├── users://all (complete user list)
│   │   └── users://{userId}/profile (individual profiles)
│   ├── 💬 PROMPTS
│   │   └── generate-fake-user (AI generation templates)
│   └── � DATA LAYER
│       └── JSON storage with automatic persistence
│
└── 🎭 MCP CLIENT (src/client.ts)
    ├── 🔌 MCP Connection Management
    ├── 🎮 Interactive CLI Interface
    ├── 🤖 AI Integration (Google AI + AI SDK)
    ├── ✅ Advanced Input Validation
    └── 🔧 Multi-type Handler Functions
```

## 📋 Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Google AI API Key** (Gemini)
- **VS Code** (optional, for MCP integration)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mariemMoula/mcp-trial-01.git
   cd mcp-trial-01
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

1. **Create environment file**

   ```bash
   cp .env.example .env
   ```

2. **Add your Google AI API key**

   ```env
   GEMINI_API_KEY=your_google_ai_api_key_here
   ```

3. **Verify data directory**
   ```bash
   # Ensure the data directory exists with users.json
   mkdir -p src/data
   echo '[]' > src/data/users.json
   ```

## 🎮 Usage

### 🖥️ **Running the Server**

```bash
# Development mode with hot reload
npm run server:dev

# Production mode
npm run server:inspect

# Direct execution
npx tsx src/server.ts
```

### 🎯 **Running the Client**

```bash
# Development mode
npm run client:dev

# Direct execution
npx tsx src/client.ts
```

### 📱 **Client Interface Options**

When you run the client, you'll see an interactive menu:

```
? What would you like to do
❯ Query     - Direct AI queries with tool access
  Tools     - Execute server tools (create users)
  Resources - Access server data (view users)
  Prompts   - Use AI generation templates
```

## 🏗️ MCP Server Components

### 🔧 **Tools**

#### `create-user`

Creates a new user with manual input validation.

**Parameters:**

- `name`: Full name (string, required)
- `email`: Email address (validated format)
- `address`: Complete address (string, required)
- `phone`: Phone number (validated format)

#### `create-random-user`

Generates realistic fake user data automatically.

**Features:**

- Realistic name combinations from curated lists
- Diverse email domains and formats
- Authentic address generation with street numbers and zip codes
- Properly formatted phone numbers

### 📚 **Resources**

#### `users://all`

Returns complete list of all users in JSON format.

#### `users://{userId}/profile`

Returns detailed profile for a specific user by ID.

**Example:**

```
users://123/profile  # Get profile for user ID 123
```

### 💬 **Prompts**

#### `generate-fake-user`

AI-powered user generation with customizable styles.

**Parameters:**

- `name` (optional): Specific name to use
- `style`: Generation style
  - `professional`: Corporate email domains, formal addresses
  - `casual`: Common providers, simple formatting
  - `international`: Diverse names and address formats

## 🎭 Client Features

### 🤖 **Dual AI Integration**

1. **Direct Google SDK**: Native Google AI integration with function calling
2. **AI SDK**: Universal AI framework with tool integration

### ✅ **Advanced Validation**

- **Email Validation**: RFC-compliant email format checking
- **Phone Validation**: US phone number format with flexible formatting
- **Input Retry Logic**: Helpful error messages with examples
- **Type Safety**: Full TypeScript support with Zod schemas

### 🎮 **Interactive Features**

- **Progressive Tool Testing**: Automatic fallback strategies
- **Real-time Debugging**: Comprehensive logging and error diagnosis
- **User-Friendly Errors**: Clear, actionable error messages
- **Flexible Input Handling**: Support for various input formats

## 🔧 VS Code Integration

### **Adding MCP Server to VS Code**

1. **Open Command Palette** (`Ctrl+Shift+P`)
2. **Search**: "MCP: Add Server"
3. **Configure Server**:

   - **Name**: `mcp-trial-01`
   - **Command**: `npx tsx src/server.ts`
   - **Working Directory**: Your project root

4. **Verify Installation**: "MCP: Show Servers"

### **Using with AI Chat**

Once configured, your MCP server tools will be available in VS Code's AI chat interface, allowing seamless integration with your development workflow.

## 📚 API Reference

### **Server Tool Calls**

```typescript
// Create user manually
await mcp.callTool({
  name: "create-user",
  arguments: {
    name: "John Doe",
    email: "john@example.com",
    address: "123 Main St, City 12345",
    phone: "(555) 123-4567",
  },
});

// Create random user
await mcp.callTool({
  name: "create-random-user",
  arguments: {},
});
```

### **Resource Access**

```typescript
// Get all users
await mcp.readResource({ uri: "users://all" });

// Get specific user
await mcp.readResource({ uri: "users://123/profile" });
```

### **Prompt Usage**

```typescript
// Get AI generation prompt
await mcp.getPrompt({
  name: "generate-fake-user",
  arguments: {
    style: "professional",
  },
});
```

## 🛠️ Development

### **Project Structure**

```
mcp-trial-01/
├── src/
│   ├── server.ts          # MCP server implementation
│   ├── client.ts          # Interactive MCP client
│   └── data/
│       └── users.json     # User data storage
├── build/                 # Compiled JavaScript
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

### **Available Scripts**

```bash
npm run build              # Compile TypeScript
npm run server:dev         # Run server in development
npm run client:dev         # Run client in development
npm run server:inspect     # Run server with debugging
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the excellent MCP framework
- [Google AI](https://ai.google.dev/) for Gemini API integration
- [Vercel AI SDK](https://sdk.vercel.ai/) for universal AI framework support
- [Zod](https://zod.dev/) for robust runtime validation

---

<div align="center">

**Built with ❤️ using Model Context Protocol**

[🐛 Report Bug](https://github.com/mariemMoula/mcp-trial-01/issues) • [✨ Request Feature](https://github.com/mariemMoula/mcp-trial-01/issues) • [📚 Documentation](https://github.com/mariemMoula/mcp-trial-01/wiki)

</div>
