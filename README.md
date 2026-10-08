# DeepResearch AI | Agentic AI Web Research System

A production-grade, full-stack **Agentic AI Web Research System** built with dual specialized AI agents, live web browsing, real-time Server-Sent Events (SSE), and grounded citation synthesis.

---

## 1. Architecture Overview

The system strictly enforces the separation of responsibilities between two specialized agents:

```text
User Question
      ↓
React Frontend (Vite + Tailwind CSS)
      ↓
Express Backend API (Port 3000)
      ↓
Chat Orchestrator
      ↓
Agent 1: Research Agent (Autonomous Tool Loop)
   ├── web_search (Composite Search: DuckDuckGo + Gemini Grounding)
   └── open_page (SSRF-hardened Cheerio text extraction)
      ↓
Structured Research Output (Verified Sources + Key Claims + Conflicts)
      ↓
Agent 2: Answer Agent (No direct web access)
      ↓
Grounded Synthesis with Inline Citations [1], [2]
      ↓
Real-Time SSE Streaming to Frontend
```

### Specialized Agents

1. **Research Agent**:
   - Formulates precise web queries.
   - Evaluates search results and domain authority.
   - Reads full webpage content with SSRF defenses.
   - Extracts verbatim evidence and detects conflicts.
   - Outputs strict `StructuredResearch` JSON.

2. **Answer Agent**:
   - Consumes only user inquiry + verified research findings.
   - Produces clear, authoritative Markdown prose.
   - Assigns bracketed inline citations `[1]`, `[2]` linked to actual discovered URLs.
   - Preserves uncertainty and states when evidence is sparse.

---

## 2. Security & Hardening

- **SSRF Protection**: `open_page` verifies protocol (HTTP/HTTPS only) and performs DNS resolution to block access to loopbacks (`127.0.0.1`, `localhost`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.0.0/16`), and cloud metadata services.
- **Prompt Injection Defense**: Scraped webpage text is tagged as untrusted external content. Instructions inside web pages are isolated from agent operational directives.
- **Zero URL Hallucination**: The Answer Agent only cites verified URLs from the Research Agent's source pool.
- **Execution Limits**: Configurable caps on maximum tool calls (`MAX_RESEARCH_TOOL_CALLS`), searches (`MAX_SEARCH_CALLS`), and execution timeouts (`MAX_RESEARCH_TIME_MS`).

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Database**: MongoDB with Mongoose (with automatic fallback to high-speed in-memory document store when external Mongo URI is absent).
- **AI Models**: Google Gemini (`gemini-3.8-flash`) via modern `@google/genai` TypeScript SDK.
- **Streaming**: Server-Sent Events (`/api/chat/stream`).

---

## 4. Development & Running

### Environment Setup
Create a `.env` file based on `.env.example`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
MONGODB_URI="mongodb://localhost:27017/deepresearch" # optional
JWT_SECRET="your-jwt-secret"
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up --build
```