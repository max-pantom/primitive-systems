import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp-server';

await createMcpServer().connect(new StdioServerTransport());
