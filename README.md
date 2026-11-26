# n8n-nodes-jobvetta

Official [n8n](https://n8n.io/) community node for the **[Jobvetta Jobs & Hiring Signals API](https://www.jobvetta.com/api)** — query **6.5M+ live job openings** gathered directly from **238,000+ official employer career sites** across **242 countries** inside your n8n workflows and AI Agents.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

- **API Documentation & Free Key**: [https://www.jobvetta.com/api](https://www.jobvetta.com/api) (`50` free requests/day)
- **RapidAPI Hub**: [https://rapidapi.com/samarora/api/jobvetta-jobs](https://rapidapi.com/samarora/api/jobvetta-jobs)
- **OpenAPI 3.1 Spec**: [https://www.jobvetta.com/openapi.json](https://www.jobvetta.com/openapi.json)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation:

1. In n8n, open **Settings → Community Nodes**.
2. Click **Install** and enter `n8n-nodes-jobvetta`.
3. Agree to the community nodes prompt and click **Install**.

For Docker / self-hosted CLI installs:

```bash
npm install n8n-nodes-jobvetta
```

## Supported Operations

`Jobvetta` works both as a standard workflow node and as an **n8n AI Agent Tool** (`usableAsTool: true`):

| Operation | Endpoint | Use Case |
| --- | --- | --- |
| **Search Jobs** | `GET /v1/jobs` | Filter 6.5M+ live employer jobs by keyword, ISO-2 country, city/state, company name, remote flag, and freshness (`1..30` days) |
| **Search Remote Jobs** | `GET /v1/jobs/remote` | Fetch verified remote-eligible roles worldwide or per country |
| **Get Recent Jobs (24h)** | `GET /v1/jobs/recent` | Stream openings posted in the last 24 hours into Slack, Discord, Telegram, HubSpot, or Clay |
| **Get Company Jobs** | `GET /v1/companies/{company}/jobs` | B2B outbound intent — list active openings at a specific target employer (e.g. `Stripe`, `Cisco Systems`, `Databricks`) |
| **Estimate Salary** | `GET /v1/jobs/salary-estimate` | Retrieve annualized `salary_p25`, `salary_median`, and `salary_p75` compensation benchmarks for any role + location |
| **Get Job Details** | `GET /v1/jobs/:id` | Retrieve the full job description and direct employer career-page application link |

## Credentials

Supports both authentication gateways out of the box:

1. **Jobvetta Direct (`api.jobvetta.com`)** — Create a free API key (`50` requests/UTC day) at [jobvetta.com/api](https://www.jobvetta.com/api).
2. **RapidAPI (`jobvetta-jobs.p.rapidapi.com`)** — Paste your `X-RapidAPI-Key` from [RapidAPI](https://rapidapi.com/samarora/api/jobvetta-jobs).

## Example Automations

- **B2B Outbound Hiring-Intent Trigger**: Schedule trigger (daily 8 AM) → **Jobvetta (`Get Company Jobs`, company: `Databricks`, query: `Security Engineer`)** → Enrich domain → Create lead in HubSpot / Clay / Apollo.
- **Slack / Discord Daily Job Digest**: Schedule trigger → **Jobvetta (`Get Recent Jobs (24h)`, query: `AI Engineer`, location: `United States`)** → Post formatted cards to Slack.
- **AI Recruiting & Career Copilot**: Connect **Jobvetta** directly to an **n8n AI Agent** node (`Tools` port) alongside OpenAI / Anthropic.

## License

[MIT](LICENSE)
