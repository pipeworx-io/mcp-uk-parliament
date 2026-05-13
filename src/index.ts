interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * UK Parliament MCP — Members, Bills, Hansard APIs
 *
 * Three separate official endpoints:
 *  - Members:  https://members-api.parliament.uk/api/
 *  - Bills:    https://bills-api.parliament.uk/api/v1/
 *  - Hansard:  https://hansard-api.parliament.uk/
 *
 * Auth: none on any of them.
 * Docs: https://developer.parliament.uk/
 */


const MEMBERS = 'https://members-api.parliament.uk/api';
const BILLS = 'https://bills-api.parliament.uk/api/v1';
const HANSARD = 'https://hansard-api.parliament.uk';

const HOUSES = '1 = Commons, 2 = Lords';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_members',
    description: 'Search MPs and Lords by name / party / location / house.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Search across name fields' },
        location: { type: 'string', description: 'Postcode or constituency name' },
        party: { type: 'string', description: 'Party name' },
        house: { type: 'number', description: HOUSES },
        is_current: { type: 'boolean', description: 'Only currently-sitting members (default true)' },
        take: { type: 'number', description: '1-20 (default 20)' },
        skip: { type: 'number', description: '0-based offset' },
      },
    },
  },
  {
    name: 'get_member',
    description: 'Member detail by member id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Parliament member id' },
        includes: { type: 'string', description: 'Comma-sep: Posts | Biography | Contact | Synopsis' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_bills',
    description: 'Search bills by title / session / stage / sponsoring member.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search bill title and short title' },
        session: { type: 'number', description: 'Session id (numeric)' },
        stage: { type: 'number', description: 'Stage id (1=intro, 2=first reading, etc.)' },
        member_id: { type: 'number', description: 'Sponsoring member id' },
        current_house: { type: 'number', description: HOUSES },
        sort: {
          type: 'string',
          description: 'TitleAscending | TitleDescending | DateUpdatedAscending | DateUpdatedDescending',
        },
        take: { type: 'number', description: '1-50 (default 20)' },
        skip: { type: 'number', description: '0-based offset' },
      },
    },
  },
  {
    name: 'get_bill',
    description: 'Bill detail.',
    inputSchema: {
      type: 'object',
      properties: { bill_id: { type: 'number' } },
      required: ['bill_id'],
    },
  },
  {
    name: 'bill_stages',
    description: 'All stages of a bill (introduction, readings, committee, royal assent).',
    inputSchema: {
      type: 'object',
      properties: { bill_id: { type: 'number' } },
      required: ['bill_id'],
    },
  },
  {
    name: 'search_hansard',
    description: 'Search debate contributions in Hansard.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text query' },
        house: { type: 'string', description: 'Commons | Lords' },
        date_from: { type: 'string', description: 'YYYY-MM-DD' },
        date_to: { type: 'string', description: 'YYYY-MM-DD' },
        member_id: { type: 'number', description: 'Filter by contribution member id' },
        take: { type: 'number', description: '1-20 (default 20)' },
        skip: { type: 'number', description: '0-based offset' },
      },
      required: ['query'],
    },
  },
  {
    name: 'recent_divisions',
    description: 'Recent recorded votes (divisions).',
    inputSchema: {
      type: 'object',
      properties: {
        house: { type: 'string', description: 'Commons | Lords' },
        date_from: { type: 'string', description: 'YYYY-MM-DD' },
        take: { type: 'number', description: '1-25 (default 25)' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_members': {
      const params = new URLSearchParams({
        take: String(Math.min(20, Math.max(1, (args.take as number) ?? 20))),
        skip: String(Math.max(0, (args.skip as number) ?? 0)),
      });
      if (args.name) params.set('Name', String(args.name));
      if (args.location) params.set('Location', String(args.location));
      if (args.party) params.set('Party', String(args.party));
      if (args.house !== undefined) params.set('House', String(args.house));
      params.set('IsCurrentMember', String(args.is_current !== false));
      return ukpGet(`${MEMBERS}/Members/Search?${params}`);
    }
    case 'get_member': {
      const id = reqNum(args, 'id', '4399');
      const includes = (args.includes as string | undefined)?.trim();
      const base = `${MEMBERS}/Members/${id}`;
      if (!includes) return ukpGet(base);
      const sub = includes.split(',').map((s) => s.trim()).filter(Boolean);
      const main = (await ukpGet(base)) as Record<string, unknown>;
      const extras: Record<string, unknown> = {};
      for (const k of sub) {
        try {
          extras[k] = await ukpGet(`${base}/${encodeURIComponent(k)}`);
        } catch (e) {
          extras[k] = { error: (e as Error).message };
        }
      }
      return { member: main, includes: extras };
    }
    case 'search_bills': {
      const params = new URLSearchParams({
        Sort: String(args.sort ?? 'DateUpdatedDescending'),
        Take: String(Math.min(50, Math.max(1, (args.take as number) ?? 20))),
        Skip: String(Math.max(0, (args.skip as number) ?? 0)),
      });
      if (args.query) params.set('SearchTerm', String(args.query));
      if (args.session !== undefined) params.set('Session', String(args.session));
      if (args.stage !== undefined) params.set('CurrentStage', String(args.stage));
      if (args.member_id !== undefined) params.set('MemberId', String(args.member_id));
      if (args.current_house !== undefined) params.set('CurrentHouse', String(args.current_house));
      return ukpGet(`${BILLS}/Bills?${params}`);
    }
    case 'get_bill':
      return ukpGet(`${BILLS}/Bills/${reqNum(args, 'bill_id', '2900')}`);
    case 'bill_stages':
      return ukpGet(`${BILLS}/Bills/${reqNum(args, 'bill_id', '2900')}/Stages`);
    case 'search_hansard': {
      const params = new URLSearchParams({
        searchTerm: reqStr(args, 'query', '"climate"'),
        take: String(Math.min(20, Math.max(1, (args.take as number) ?? 20))),
        skip: String(Math.max(0, (args.skip as number) ?? 0)),
      });
      if (args.house) params.set('house', String(args.house));
      if (args.date_from) params.set('startDate', String(args.date_from));
      if (args.date_to) params.set('endDate', String(args.date_to));
      if (args.member_id !== undefined) params.set('memberId', String(args.member_id));
      return ukpGet(`${HANSARD}/search/contributions/spoken?${params}`);
    }
    case 'recent_divisions': {
      const params = new URLSearchParams({
        take: String(Math.min(25, Math.max(1, (args.take as number) ?? 25))),
      });
      if (args.house) params.set('house', String(args.house));
      if (args.date_from) params.set('startDate', String(args.date_from));
      return ukpGet(`${HANSARD}/search/divisions?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ukpGet(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'pipeworx-mcp-uk-parliament/1.0 (+https://pipeworx.io)',
    },
  });
  if (res.status === 404) throw new Error('UK Parliament: not found');
  if (res.status === 429) throw new Error('UK Parliament: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`UK Parliament error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}
function reqNum(args: Record<string, unknown>, key: string, example: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`Required argument "${key}" must be a number. Example: ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
