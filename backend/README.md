# Multi-Agent System with MCP Tools

A production-ready multi-agent system built with LangGraph, featuring MCP (Model Context Protocol) tool integration, human-in-the-loop approval workflows, and persistent state management.

---

## Quick Start

Get up and running in minutes:

### 1. Install Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies (for web UI)
cd agent-chat-ui
pnpm install
```

### 2. Configure Environment
Create a `.env` file:
```env
# Required
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your_mistral_key_here
LANGGRAPH_DB_URI=postgresql+asyncpg://user:password@localhost:5432/langgraph_db

# Recommended
LANGGRAPH_AES_KEY=your_32_byte_encryption_key_here
```

### 3. Run the Agent
```bash
# Start LangGraph development server
langgraph dev --allow-blocking
```

The `--allow-blocking` flag is required for:
- MCP server communication
- Human-in-the-loop interrupts
- CLI-style interactions

Access the interface at: **http://localhost:8000**

---

## System Architecture

```
                        User (CLI / Web UI)
                          |
                          v
┌──────────────────────────────────────────────────┐
│             SUPERVISOR AGENT (MAIN)              │
│  Model: Mistral / Gemini                         │
│  Middleware:                                     │
│   - Provider middleware (Mistral only)           │
│   - trim_messages (context window management)    │
│   - HumanInTheLoopMiddleware (ops_files only)    │
│  Checkpointer: AsyncPostgresSaver (external DB)  │
└───────────────┬──────────────────────────────────┘
                |
      ┌─────────┼───────────────────────────────┐
      |                                         |
      v                                         v
┌──────────────────────┐              ┌──────────────────────┐
│ web_research (tool)  │              │ ops_files (tool)     │
│ async wrapper tool   │              │ async wrapper tool   │
└────────────┬─────────┘              └────────────┬─────────┘
             |                                     |
             v                                     v
      ┌──────────────────┐                ┌──────────────────┐
      │  WEB SUBAGENT    │                │  OPS SUBAGENT    │
      │  Tools: web MCP  │                │  Tools: ops MCP  │
      │  No HITL         │                │  No HITL         │
      │  No checkpointing│                │  No checkpointing│
      └──────────────────┘                └──────────────────┘

            (All tools are provided via MCP stdio servers)
```

---

## 📋 Table of Contents

- [Features](#-features)
- [System Components](#-system-components)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Security](#-security)
- [Architecture Details](#-architecture-details)

---

## Features

- **Multi-Agent Architecture**: Supervisor agent orchestrating specialized subagents
- **MCP Tool Integration**: Extensible tool system via Model Context Protocol
- **Human-in-the-Loop**: Approval workflows for sensitive operations
- **Persistent State**: PostgreSQL-backed checkpointing for conversation history
- **Context Management**: Automatic message trimming to fit context windows
- **Web Interface**: Modern chat UI built with LangChain Agent Chat UI
- **CLI Support**: Interactive command-line interface for development
- **Encryption at Rest**: AES encryption for checkpoint data
- **Provider Agnostic**: Support for Mistral and Google Gemini models

---

## System Components

### Main Supervisor Agent

**Built in:** `build_agents()`

```python
supervisor = create_agent(...)
```

**Responsibilities:**
- Orchestrates tool usage (native MCP tools + wrapper tools)
- Enforces human approval for `ops_files` operations
- Stores state using external Postgres-backed checkpointer
- Trims message history to fit context limits

**Execution:**
```python
supervisor.astream(..., subgraphs=True)
```

---

### MCP Integration

Three MCP servers launched under `MultiServerMCPClient`:

```
tools/
 ├─ supervisor_tools_server.py  → Supervisor-native tools
 ├─ web_tools_server.py         → Web research tools
 └─ ops_tools_server.py         → File operations tools
```

**Sessions managed via AsyncExitStack:**
- `client.session("supervisor_tools")`
- `client.session("web_tools")`
- `client.session("ops_tools")`

**Tool Interceptor:**
```python
tool_interceptors=[force_text_only]
```
Forces all tool outputs into text-only payloads for provider compatibility.

---

### Available Tools

#### 1. Supervisor-Native MCP Tools
```python
supervisor_native_tools = await load_mcp_tools(sup_session)
```
Called directly by supervisor without subagent routing.

#### 2. `web_research` Tool
```python
@tool("web_research")
async def call_web_subagent(query: str) -> str: ...
```
- Invokes dedicated **web_subagent**
- Uses MCP tools from `web_tools_server.py`
- Includes provider middleware (Mistral compatibility)
- No human approval required
- No checkpointing (stateless)

#### 3. `ops_files` Tool
```python
@tool("ops_files")
async def call_ops_subagent(query: str) -> str: ...
```
- Invokes dedicated **ops_subagent**
- Uses MCP tools from `ops_tools_server.py`
- **Requires human approval** (HITL)
- Sandboxed workspace access
- No checkpointing (stateless)

---

## Installation

### Prerequisites
- Python 3.10+
- PostgreSQL database
- Virtual environment (recommended)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure LangGraph with encryption support**
   
   Update your `langgraph.json`:
   ```json
   {
     "dependencies": [".", "pycryptodome"],
     "graphs": {
       "agent": "./graph.py:make_graph"
     }
   }
   ```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# LLM Provider
LLM_PROVIDER=mistral  # or "google"
MISTRAL_API_KEY=your_mistral_key_here
# GOOGLE_API_KEY=your_google_key_here  # if using Google

# Database (Required)
LANGGRAPH_DB_URI=postgresql+asyncpg://user:password@localhost:5432/langgraph_db

# Encryption (Recommended)
LANGGRAPH_AES_KEY=your_32_byte_encryption_key_here

# Optional: LangGraph Studio/Cloud
# LANGGRAPH_API_KEY=your_langgraph_api_key
```

### Database Setup

1. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE langgraph_db;
   ```

2. **Tables are auto-created** on first run via:
   ```python
   await checkpointer.setup()
   ```

---

## Usage

### CLI Mode

Run the interactive CLI for development and testing:
```bash
python main.py
```

**Example interaction:**
```
User: What time is it in Riyadh? Then research the latest about MCP.

--- HUMAN APPROVAL REQUIRED ---
Tool: ops_files
Description: Write 'hello' to demo.txt
Choose: [a]pprove / [r]eject / [e]dit ? a

[Agent response streams here...]
```

---

## Security

### Encryption at Rest

The system uses **AES encryption** to protect checkpoint data stored in PostgreSQL.

#### What's Encrypted
- ✅ Checkpoint blobs (conversation state)
- ❌ Metadata fields (remain searchable)

#### Encryption Setup

1. **Generate encryption key:**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Set environment variable:**
   ```env
   LANGGRAPH_AES_KEY=<your-64-char-hex-key>
   ```
   
   Key length options:
   - 16 bytes (32 hex chars) = AES-128
   - 24 bytes (48 hex chars) = AES-192
   - 32 bytes (64 hex chars) = AES-256 ✅ **Recommended**

3. **Encryption is automatic** once `LANGGRAPH_AES_KEY` is set and `pycryptodome` is installed.

#### Advanced Encryption

For per-tenant keys, KMS integration, or custom field encryption, see [LangGraph Custom Encryption](https://langchain-ai.github.io/langgraph/cloud/reference/encryption/).

### Workspace Sandboxing

File operations are restricted to a workspace directory:
```python
BASE_DIR = Path(__file__).resolve().parent / "workspace"
```

All file paths are validated to prevent directory traversal attacks.

---

## 🏛️ Architecture Details

### External Database (Checkpointing)

**Implementation:**
```python
checkpointer = AsyncPostgresSaver.from_conn_string(DB_URI)
await checkpointer.setup()
```

**Configuration:**
- Connection string: `LANGGRAPH_DB_URI` environment variable
- Managed via `AsyncExitStack` for clean lifecycle
- Bootstrap on startup (idempotent `setup()` call)

**Benefits:**
- Multi-turn conversation persistence
- Interrupt → resume correctness with durable state
- Thread history across restarts

---

### Context Window Management

A `@before_model` middleware trims messages:

```python
@before_model
def trim_messages(state: AgentState, runtime: Runtime):
    ...
```

**Behavior:**
- **≤ 8 messages**: No changes
- **> 8 messages**:
  - Keeps **first message** (system/instructions)
  - Keeps **tail of ~8-9 recent messages**
  - Removes everything else using `RemoveMessage(id=REMOVE_ALL_MESSAGES)`

**Result:** Model sees system message + recent conversational tail, while checkpointer preserves full history.

---

### Human-in-the-Loop (HITL)

Approval enforced at supervisor level:

```python
HumanInTheLoopMiddleware(interrupt_on={"ops_files": True})
```

**Gating Rules:**
- ✅ `ops_files` tool requires approval
- ❌ `web_research` does not require approval
- ❌ Supervisor-native tools not gated

**CLI Flow:**

1. **Interrupt shown:**
   ```
   --- HUMAN APPROVAL REQUIRED ---
   <description>
   ```

2. **User decision:**
   ```
   Choose: [a]pprove / [r]eject / [e]dit ?
   ```

3. **Resume execution:**
   ```python
   Command(resume={interrupt_id: {"decisions": [...]}})
   ```

**Decision Types:**
- **Approve:** `{"type": "approve"}`
- **Reject:** `{"type": "reject", "message": "..."}`
- **Edit:** `{"type": "edit", "edited_action": {"name": "...", "args": {...}}}`

---

### Provider-Specific Handling

#### Mistral Compatibility

When `provider="mistral"`:

1. **Middleware conversion:**
   ```python
   @before_model
   def mistral_tool_content_to_string(...):
       # Converts ToolMessage list → string
       # Preserves tool_call_id
   ```

2. **Tool patching:**
   ```python
   patch_tools_text_only_for_mistral(tools)
   ```

3. **Applied to:**
   - Supervisor (via `provider_middleware(provider)`)
   - Web subagent (via `provider_middleware(provider)`)
   - Ops subagent (always uses `mistral_tool_content_to_string`)

---

### Execution Model

**Fully async architecture:**
- MCP sessions: async
- Agents: `ainvoke`, `astream`
- Tools: async LangChain tools
- CLI input: `asyncio.to_thread`

**Streaming includes:**
- Token streaming (`AIMessageChunk`)
- Tool call reporting
- Tool result reporting
- Interrupts (HITL)
- Subgraph streaming (`subgraphs=True`)

---

## Project Structure

```
.
├── main.py                    # Core agent setup and CLI
├── webapp.py                  # FastAPI server with lifespan
├── graph.py                   # LangGraph factory for deployment
├── utils.py                   # Helper functions
├── system_prompts.yaml        # Agent system prompts
├── .env                       # Environment configuration
├── langgraph.json            # LangGraph deployment config
├── app/
│   ├── runtime.py            # Global runtime state
│   └── state.py              # Application state dataclass
└── tools/
    ├── supervisor_tools_server.py
    ├── web_tools_server.py
    └── ops_tools_server.py
```

---

## Troubleshooting

### Common Issues

**"Supervisor not initialized" error:**
- Ensure FastAPI lifespan has run
- Check `runtime.SUPERVISOR` is set in `webapp.py`

**Database connection errors:**
- Verify `LANGGRAPH_DB_URI` is correctly set
- Ensure PostgreSQL is running
- Check database exists and user has permissions

**MCP tool errors:**
- Verify MCP server scripts are executable
- Check Python executable path in `build_agents()`
- Review MCP server logs for errors

**Encryption errors:**
- Ensure `pycryptodome` is installed
- Verify `LANGGRAPH_AES_KEY` length (16/24/32 bytes)
- Check key is hex-encoded for environment variables

---

## Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [LangChain Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui)
- [Encryption at Rest Guide](https://langchain-ai.github.io/langgraph/cloud/reference/encryption/)

---

## 📝 License

[TBD]

## 🤝 Contributing

[TBD]