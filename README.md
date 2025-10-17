# Setting Up the Server in VS Code

To run the server in VS Code, follow these steps:

1. Open VS Code and press `Ctrl+Shift+P` to open the command palette.
2. Type "MCP: Add Server" and select the command to add the MCP server.
3. Provide the necessary information to configure the server, including the command to run (`npm run server:dev`) and the MCP server name.
4. The MCP server will be added to VS Code, and you can access it by opening the command palette and selecting "MCP: Show Servers" to view the list of available servers.

# Running the Server

To run the server, open a terminal and run the following command:
npm run server:inspect

# Running the client

To run the client, open a terminal and run the following command:
npm run client:dev

This will start the client and provide you with a list of choices.

# Server Configuration

The server is represented by the `server.ts` file. To alter the server, make sure to restart it to apply the changes. The `watch` property in the server configuration can be set to automatically restart the server when changes are detected.

# Data Folder

The `data` folder contains the data in JSON format that will be used to fetch or alter from the server.

# API Key

To use the server, make sure to add the API key in the `.env` file.

server name to obtain the mcp.json file
after configuring your vscode you can use this with your ai chatbot

to run this server run in your terminal : npm run server:inspect 

