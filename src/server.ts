import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
// here, we create the server
const server = new McpServer({
  name: "Meriame's MCP Trial 01",
  version: "1.0.0",
  description: "A trial of the MCP SDK",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});
// Here, we are defining the "create-user" tool, the name that the ai is going to see, and the second parameter is the description ,then te parameters we will pass in
server.tool(
  "create-user",
  "Create a new user in the database",
  {
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    phone: z.string(),
  },
  // here, we define the different annotations, which are optional, but if we want that the ai can see, it will provide hints to the ai to help it understand and know what it can and what it can't do
  {
    title: "Create a new user", //
    readOnlyHint: false, // this lets the ai know that this tool is not read only
    destructiveHint: false, // this lets the ai give extra steps of warning when using the tool
    idempotentHint: false,
    openWorldHint: true, //this lets the ai know if it access something external or not
  },
  // here, we pass what the function is going to do
  async (params) => {
    try {
      const id = await createUser(params);
      return {
        content: [{ type: "text", text: `User ${id} created successfully` }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Something went wrong, please try again",
          },
        ],
      };
    }
  }
);

server.tool(
  "create-random-user",
  "Create a random user with fake data",
  {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async () => {
    // Generate fake user data directly without AI dependency
    const firstNames = [
      "John",
      "Jane",
      "Mike",
      "Sarah",
      "David",
      "Emma",
      "Chris",
      "Lisa",
      "Alex",
      "Maria",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];
    const domains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "example.com",
    ];
    const streets = [
      "Main St",
      "Oak Ave",
      "Pine Rd",
      "Elm Dr",
      "Cedar Ln",
      "Park Way",
      "First St",
      "Second Ave",
    ];

    // Generate random data
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];

    const fakeUser = {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      address: `${Math.floor(Math.random() * 9999) + 1} ${street}`,
      phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(
        4,
        "0"
      )}`,
    };

    try {
      const id = await createUser(fakeUser);
      return {
        content: [
          {
            type: "text",
            text: `Random user ${id} created successfully: ${fakeUser.name}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Something went wrong creating the random user, please try again",
          },
        ],
      };
    }
  }
);

// prompts are useful to create complicated prompts from certain information , i give a name and it will return all of this prompt that can be run inside of the ai tool,
// name , description , params , function that takes the passed params
server.prompt(
  "generate-fake-user",
  "Create a fake user  based on a given name",
  {
    name: z.string(),
  },
  ({ name }, _extra) => {
    return {
      // the messages we want our ai to run
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a fake user based on the name ${name}, the user should have a realistic email, address and phone number.`,
          },
        },
      ],
    };
  }
);
// Here, we will add the resource to the server to fetch all users
server.resource(
  "users", // name of the resource
  "users://all", // uri that must match a certain protocol
  {
    description: "Get all users data from the database", // lets the ai know what it does
    title: "Users",
    mimeType: "application/json", // the type of data that the resource returns
  },
  async (uri) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users),
          mimeType: "application/json",
        },
      ],
    };
  }
);
// Here, we will add the resource to the server to fetch a user by their id
server.resource(
  "user-details",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  {
    description: "Get a user's details from teh database",
    title: "User Details",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((m) => m.default);
    const user = users.find((u) => u.id === parseInt(userId as string));

    if (user == null) {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({ error: "User not found" }),
            mimeType: "application/json",
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(user),
          mimeType: "application/json",
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));

  return id;
}

main();
