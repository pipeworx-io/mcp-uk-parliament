# @pipeworx/uk-parliament

UK Parliament MCP — official Westminster APIs: Members, Bills, Hansard (debates). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search_members(name?, location?, party?, house?, is_current?, take?, skip?)` — MPs and Lords
- `get_member(id, includes?)` — member detail
- `search_bills(query?, session?, stage?, member_id?, current_house?, take?, skip?)` — bills
- `get_bill(bill_id)` — bill detail
- `bill_stages(bill_id)` — all stages of a bill
- `search_hansard(query, house?, date_from?, date_to?, member_id?, take?, skip?)` — debates / contributions
- `recent_divisions(house?, date_from?, take?)` — recent votes

## Data sources

- Members: `https://members-api.parliament.uk/api/`
- Bills: `https://bills-api.parliament.uk/api/v1/`
- Hansard: `https://hansard-api.parliament.uk/`

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
