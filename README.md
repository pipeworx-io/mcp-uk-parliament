# mcp-uk-parliament

UK Parliament MCP — Members, Bills, Hansard APIs

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_members` | Search MPs and Lords by name / party / location / house. |
| `get_member` | Member detail by member id. |
| `search_bills` | Search bills by title / session / stage / sponsoring member. |
| `get_bill` | Bill detail. |
| `bill_stages` | All stages of a bill (introduction, readings, committee, royal assent). |
| `search_hansard` | Search debate contributions in Hansard. |
| `recent_divisions` | Recent recorded votes (divisions). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "uk-parliament": {
      "url": "https://gateway.pipeworx.io/uk-parliament/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Uk Parliament data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
