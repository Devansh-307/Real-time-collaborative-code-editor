# CODESYNC
## Real-Time Collaborative Cloud IDE & Sandboxed Execution Platform
### Comprehensive Technical Architecture, System Design Deep-Dive & Interview Mastery Guide

---

> **Candidate Mastery Note**: This guide provides complete, in-depth technical fluency over every architectural component, design decision, security sandbox mechanism, and distributed scaling tradeoff in CodeSync.

---

## 1. Executive Summary & Problem Solved

**CodeSync** is a production-grade, real-time collaborative cloud coding platform and sandboxed execution environment. It enables distributed software engineers to create or join collaborative rooms via a unique room identifier, edit polyglot multi-file codebases simultaneously without merge conflicts, view peer cursors in real time, and execute code safely inside micro-isolated Linux Docker sandboxes with sub-second execution cycles.

Unlike basic web text editors that rely on locking files or polling backends, CodeSync implements **Conflict-Free Replicated Data Types (CRDTs)** using the **Yjs** framework. This ensures mathematically guaranteed eventual consistency, peer-to-peer style awareness, and instantaneous zero-latency local edits.

### Core Capabilities
- **Real-Time CRDT Collaboration**: Multiple users can type, delete, format, and navigate the exact same files simultaneously with zero conflict overwrites.
- **Presence Awareness Stack**: Live remote colored cursors, multi-line selection boxes, user name tags, and active file navigation indicators.
- **Polyglot Multi-File Execution**: Python 3.12, JavaScript (Node.js 22), C++ (GCC 14), Java (OpenJDK 21), and live interactive Web preview (HTML/CSS/JS).
- **Hardened Multi-Tenant Sandboxing**: Dropped Linux capabilities (`ALL`), non-root user execution (`UID 10001`), strict cgroup limits (256MB RAM, 1 CPU, 64 PIDs), read-only root filesystem, memory-backed `tmpfs` workspace, and disabled network access.
- **Microservices Orchestration**: Nginx reverse proxy gateway routing HTTP REST, Yjs WebSockets, and SPA assets on a unified port (8080) with full Docker Compose local orchestration.

---

## 2. High-Level System Architecture

CodeSync is structured as a decoupled, microservices-based distributed system containing four primary services coordinated behind an Nginx reverse proxy gateway:

```
[ Web Browser / Client SPA ]
            │
            ▼ (Port 8080)
┌────────────────────────────────────────────────────────┐
│               Nginx Reverse Proxy Gateway              │
├───────────────────┬───────────────────┬────────────────┤
│  location /       │  location /api    │  location /collab
│  (Client SPA)     │  (FastAPI Engine) │  (Node.js Yjs) 
└─────────┬─────────┴─────────┬─────────┴────────┬───────┘
          │                   │                  │
          ▼                   ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐
│ React 18 + Vite  │ │ FastAPI Engine   │ │ Node.js Yjs  │
│ Monaco Editor    │ │ Python 3.12      │ │ collab-server│
│ y-monaco Binding │ │ Docker Daemon API│ │ WebSockets   │
└──────────────────┘ └────────┬─────────┘ └──────────────┘
                              │ (Spawns micro-containers)
                              ▼
                     ┌──────────────────┐
                     │ Hardened Sandbox │
                     │ Docker Container │
                     │ (Python/Node/C++)│
                     │ tmpfs /workspace │
                     └──────────────────┘
```

| Service Component | Technology Stack | Role & Responsibilities |
| :--- | :--- | :--- |
| **Client SPA** | React 18, Vite, Tailwind CSS, Monaco Editor | Provides browser IDE, Monaco editor instance, file explorer, CRDT binding via `y-monaco`, terminal output, and awareness rendering. |
| **Gateway / Proxy** | Nginx Alpine (Port 8080) | Multiplexes traffic: routes `/` to Client, `/api` & `/health` to FastAPI, and `/collaboration` WebSocket upgrades to Node.js server. |
| **Collaboration Server** | Node.js, `y-websocket`, Yjs CRDT Engine | Manages WebSocket client rooms, room access validation, CRDT document state updates, and awareness broadcasts with binary encoding. |
| **API & Sandbox Engine** | Python 3.12, FastAPI, Docker SDK | Validates room schemas, manages execution quotas, builds in-memory tarballs, launches sandboxed Docker containers, and collects logs. |

---

## 3. Real-Time Collaboration: CRDTs vs. Operational Transformation

### What is a CRDT?
A **Conflict-Free Replicated Data Type (CRDT)** is a data structure designed to be replicated across multiple distributed nodes where each replica can be updated independently and concurrently without central coordination. The data structure guarantees that once all replicas receive the same set of updates (even in different orders), they will converge to the exact same state mathematically (**Strong Eventual Consistency**).

### CRDT (CodeSync) vs. Operational Transformation (Google Docs)

| Dimension | Operational Transformation (OT) | Yjs CRDT (CodeSync) |
| :--- | :--- | :--- |
| **Architecture** | Centralized server is strictly required to sequence and transform every operation. | Decentralized / Peer-to-Peer capable; server is a simple relay without transformation math. |
| **Concurrency Complexity** | Combinatorial explosion of transformation functions ($O(N^2)$ complexity with edge cases). | Deterministic convergence via mathematically proven CRDT item structuring and Lamport clocks. |
| **Network Resilience** | High latency or offline work requires pausing or complex replay locks. | True offline-first: local edits apply with 0ms latency and merge cleanly upon reconnection. |
| **Memory & Speed** | Low memory, but transformations incur heavy CPU overhead on the server. | Yjs achieves near-native performance using a specialized doubly-linked list of Item structs with run-length encoding. |
| **Conflict Resolution** | Transformed character indices shift based on incoming server sequence. | Each character insertion has a globally unique ID (ClientID + Lamport Clock) with deterministic left/right placement. |

---

## 4. Sandboxed Code Execution & Security Deep-Dive

Executing untrusted user code on a shared server is one of the highest-risk operations in software engineering. CodeSync applies a **Defense-in-Depth multi-layer security sandbox model**:

1. **Complete Network Isolation (`network_mode='none'`)**: Containers have no inbound or outbound socket access. Malicious user code cannot perform DDoS attacks, scan internal ports, or exfiltrate secrets.
2. **Non-Root Execution (`user='10001:10001'`)**: Containers execute under an unprivileged user `sandbox`. Even if a runtime exploit occurs, it lacks root permissions on the host.
3. **Read-Only Root Filesystem (`read_only=True`)**: System directories (`/bin`, `/usr`, `/lib`) are strictly immutable.
4. **Ephemeral In-Memory Workspace (`tmpfs` `/workspace`)**: Execution files live entirely in RAM (64MB tmpfs) and vanish the moment the container terminates.
5. **Cgroup Resource Bounds**:
   - Memory capped at `256MB`
   - CPU quota capped at `1.0 core` (`1e9` nanoCPUs)
   - Process limit capped at `64 PIDs` (`pids_limit=64`) to **neutralize fork bombs**
6. **Capability Stripping (`cap_drop=['ALL']`)**: Strips all Linux capabilities and enforces `no-new-privileges:true` to block privilege escalation.
7. **Execution Timeout Watchdog (SIGKILL)**: The backend forcefully terminates and purges hung processes after the timeout threshold (default 5s, max 15s).
8. **In-Memory Base64 Injection**: Source files are packed into an in-memory tar archive, base64-encoded, and extracted on container startup directly into the `/workspace` tmpfs. This avoids Docker daemon `put_archive` API write collisions against read-only root filesystems.

---

## 5. End-to-End Request & Data Flow Traces

### Trace 1: Real-Time Keystroke Collaboration Lifecycle
1. User A types a letter `'x'` inside Monaco Editor.
2. Monaco fires an edit event intercepted by `MonacoBinding` (`y-monaco`).
3. `MonacoBinding` converts the edit into a Yjs Text transaction, assigning it `(ClientId: A, Clock: 1042)`.
4. Yjs encodes the delta update into a compact binary `Uint8Array` buffer.
5. `WebsocketProvider` wraps the binary payload into a WebSocket frame and sends it over `/collaboration/ABCD-1234`.
6. Nginx intercepts the WebSocket frame and proxies it to the Node.js `collab-server`.
7. `collab-server` merges the delta into the room's in-memory Yjs Document and broadcasts the delta to all other connected room clients.
8. User B's browser receives the binary update, decodes it via Yjs, and `y-monaco` updates User B's Monaco Editor view with 0ms perceptible delay.

### Trace 2: Sandboxed Code Execution Lifecycle
1. User presses `Ctrl + Enter` (or clicks 'Run').
2. React client collects all workspace files and sends `POST /api/execute` with `{ language, files, entry_file, stdin, timeout }`.
3. Nginx proxies the request to FastAPI backend (`api:8000`).
4. FastAPI validates request payload using Pydantic (`ExecutionRequest`), checking source size bounds (<100KB), timeout bounds, and safe filenames.
5. FastAPI offloads the blocking execution call to its background worker threadpool.
6. Docker service builds an in-memory tarball of the files and encodes it as base64.
7. Docker client creates an isolated runner container (`codesync-runner-python:latest`) with `read_only=True`, `network_mode='none'`, `user='10001:10001'`, `tmpfs={'/workspace': 'size=64m'}`, and cgroup limits.
8. Container starts, unpacks files to `/workspace`, and executes the language runner.
9. Backend waits for completion (`container.wait(timeout=5)`), captures stdout and stderr streams, truncates output if exceeding 64KB, and removes the container.
10. Execution response `{ stdout, stderr, exit_code, elapsed_ms, status }` is returned to client and rendered in the terminal panel.

---

## 6. Top 20 Technical Interview Questions & Model Answers

### Q1: What is the fundamental difference between CRDTs and Operational Transformation (OT)?
> **Answer**: Operational Transformation requires a centralized authoritative server to sequence and mathematically transform conflicting character offsets. If two users insert text at index 5 concurrently, the server determines whose operation went first and rewrites the second operation. CRDTs eliminate transformation complexity by giving every character a globally unique, immutable ID (ClientId + Lamport Clock) and deterministic sorting rules. Nodes converge automatically without needing an authoritative sequencing server.  
> **Key Takeaway**: Highlight that CRDTs allow decentralized peer-to-peer and offline-first architecture, whereas OT is tightly coupled to centralized server architectures like Google Docs.

### Q2: How do you prevent malicious user code from compromising the host server during execution?
> **Answer**: We employ a defense-in-depth security model: (1) Complete network isolation (`network_mode: none`), (2) Non-root execution (`UID 10001`), (3) Read-only root filesystem, (4) Writable in-memory tmpfs (/workspace) that is destroyed on exit, (5) Cgroup bounds (256MB RAM, 1 CPU quota, 64 max PIDs to kill fork bombs), (6) Dropping all Linux capabilities (`cap_drop: ALL`) and preventing privilege elevation (`no-new-privileges`), and (7) Hard execution timeouts with SIGKILL.  
> **Key Takeaway**: Explain that no single security measure is sufficient; multi-layered isolation ensures that even if one layer has a vulnerability, the others prevent exploitation.

### Q3: Why did you use Nginx as a reverse proxy gateway instead of exposing FastAPI directly?
> **Answer**: Nginx serves as a single entry point gateway for multiple reasons: (1) Single Port Multiplexing: Routes HTTP REST, Yjs WebSockets, and SPA assets cleanly on port 8080, (2) WebSocket Connection Handling: Handles HTTP/1.1 Upgrade headers, long-lived TCP keep-alives (86,400s timeouts), and buffering control, (3) Security & Rate Limiting: Acts as a buffer against slowloris attacks and oversized request payloads (`client_max_body_size 10M`), and (4) Decoupled Microservices: The frontend client does not need to know internal microservice ports.  
> **Key Takeaway**: Emphasize that reverse proxies simplify frontend configuration (eliminating CORS issues) and provide production-ready TLS/SSL termination and load balancing capabilities.

### Q4: Why did you define the FastAPI `/api/execute` route as synchronous `def` rather than `async def`?
> **Answer**: In FastAPI, defining an endpoint as `async def` tells Uvicorn to run it directly on the single-threaded asyncio event loop. If an `async def` function makes blocking synchronous calls—such as `docker.wait()`, `time.sleep()`, or subprocess execution—it blocks the entire event loop, freezing all incoming HTTP requests, health checks, and WebSocket handshakes. By defining the route as standard `def execute_code`, FastAPI automatically offloads execution to an asynchronous worker thread pool (`anyio.to_thread`), keeping the main event loop fully responsive.  
> **Key Takeaway**: This is a high-level FastAPI architectural insight that demonstrates mastery over Python asyncio vs. multithreaded concurrency models.

### Q5: How do you handle simultaneous typing when two users insert text at the exact same cursor position?
> **Answer**: In Yjs, every item insertion is assigned a deterministic identifier consisting of the client's unique integer ID and a monotonically increasing Lamport clock counter. When two users insert text at the exact same anchor point, Yjs compares the two Client IDs deterministically (e.g., Client 124 < Client 309). Both replicas execute the exact same deterministic comparison algorithm, placing one character consistently to the left of the other on all machines without negotiation.  
> **Key Takeaway**: State that this deterministic sorting is why CRDTs guarantee mathematical convergence without requiring locks or rollbacks.

### Q6: How does CodeSync handle file creation, deletion, and renaming in real time?
> **Answer**: Files are represented as a Yjs `Y.Map` where each entry represents a file entity with metadata (id, name, language, isEntry) and points to a corresponding `Y.Text` CRDT data stream for content. When a user creates or deletes a file, an update transaction is dispatched to the `Y.Map`. Because `Y.Map` is also a CRDT, additions and removals sync across all peers instantly. Deleting a file marks its entry as deleted, and peers automatically switch to an active file if their current file was removed.  
> **Key Takeaway**: Demonstrates that CRDTs in CodeSync are not just for plain text editing, but manage the entire project hierarchical tree structure.

### Q7: How would you scale CodeSync to support 100,000 concurrent rooms across multiple servers?
> **Answer**: To scale horizontally: (1) Collaboration Server: Deploy multiple Node.js y-websocket instances behind a load balancer with sticky sessions based on Room ID (or use Redis Pub/Sub to sync room updates across cluster nodes), (2) Execution Backend: Decouple code execution from FastAPI by using an asynchronous message broker (RabbitMQ/Celery) with a scalable worker pool of pre-warmed sandbox runners, (3) MicroVM Sandboxing: In cloud environments, replace Docker with AWS Firecracker or gVisor for 5ms microVM spin-up times, and (4) Persistent Storage: Persist room snapshots to S3 / PostgreSQL.  
> **Key Takeaway**: Demonstrates distributed systems design knowledge: load balancing, pub/sub, message queues, and serverless microVM execution.

### Q8: What happens if a user enters an infinite loop like `while True: pass`?
> **Answer**: CodeSync handles this at two levels: (1) CPU Limit: The container is restricted to 1 CPU core via cgroups so host system stability is unaffected, and (2) Timeout Watchdog: The backend starts a watchdog timer (`timeout_seconds`, default 5s). When the timeout expires, `container.wait(timeout)` raises a timeout exception. The backend immediately sends a `container.kill()` (SIGKILL), records the exit code as `124` (standard Linux timeout code), and returns `{ status: 'timeout', stderr: 'Execution timed out after 5 seconds. Process killed.' }` to the client.  
> **Key Takeaway**: Shows thorough testing of edge cases and graceful degradation.

### Q9: Why did you use base64 in-memory tarball extraction instead of Docker's `put_archive` API?
> **Answer**: Docker's `put_archive` API endpoint verifies that the container's root filesystem is writable before allowing files to be extracted. Because CodeSync enforces a hardened `read_only=True` rootfs for security, calling `put_archive` throws a 400 Bad Request ('container rootfs is marked read-only'). To resolve this, we encode the files as an in-memory base64 tarball passed into the container command (`sh -c "echo '<b64>' | base64 -d | tar -xf - -C /workspace && cd /workspace && run"`). This writes directly into the memory-backed `/workspace` tmpfs without violating rootfs read-only protection.  
> **Key Takeaway**: This is a real-world engineering problem you solved, showcasing deep Docker internals and Linux storage knowledge.

### Q10: How does CodeSync support multiple programming languages safely?
> **Answer**: Each language runs inside a specialized, pre-baked, stripped-down runner image: (1) Python 3.12 (`python:3.12-slim`), (2) JavaScript (`node:22-alpine`), (3) C++ (`gcc:14-bookworm` with `-O2 -std=c++20`), and (4) Java (`openjdk:21-slim`). When a user executes a project, the backend looks up the language runner image, builds the compilation/interpretation pipeline command, feeds STDIN if provided, and captures the execution streams.  
> **Key Takeaway**: Highlights polyglot support and separation of concerns between runtime environments.

### Q11: What is the Awareness protocol in Yjs and how is it optimized?
> **Answer**: The Awareness protocol handles transient presence information like cursor line/column coordinates, text selection ranges, user names, and assigned avatar colors. It is optimized by being completely separate from the persistent document update history. Awareness updates are sent as lightweight binary state maps with a Client ID key. Each awareness state has a timestamp clock; if a client disconnects or ceases heartbeats, their awareness state automatically expires and peers clean up their cursor graphics without mutating the document.  
> **Key Takeaway**: Explains separation of persistent document state vs. ephemeral UI presence.

### Q12: How are network disconnections and reconnections handled?
> **Answer**: Yjs `WebsocketProvider` includes exponential backoff reconnection logic. When a user loses internet connectivity, they can continue typing locally with 0ms latency because all edits apply to the local Yjs Doc replica. When connectivity is restored, the client reconnects to the WebSocket server, sends its compact State Vector, and performs a 2-way delta sync. All offline edits merge seamlessly with edits made by online collaborators during the disconnection.  
> **Key Takeaway**: Underlines the offline-first resiliency and high availability of CRDT architecture.

### Q13: How do you prevent fork bombs from exhausting server process tables?
> **Answer**: In Linux, a fork bomb (`:(){ :|:& };:`) attempts to recursively spawn processes until the operating system's PID table is exhausted, crashing the entire server. CodeSync neutralizes this by enforcing `pids_limit=64` on every container via Linux cgroups. Once a user's code spawns 64 child processes or threads, any subsequent `fork()` or `clone()` syscall returns `EAGAIN` (Resource temporarily unavailable), preventing host exhaustion.  
> **Key Takeaway**: Demonstrates deep knowledge of Linux kernel cgroups and process management.

### Q14: What is Monaco Editor and how is it integrated with React and Yjs?
> **Answer**: Monaco Editor is the open-source code editor that powers Visual Studio Code. In CodeSync, Monaco is rendered inside React using `@monaco-editor/react`. We integrate Monaco with Yjs using `y-monaco` (`MonacoBinding`). The `MonacoBinding` listens to Yjs Text change events and applies them to Monaco's `ITextModel`, while also capturing Monaco editor selection/cursor changes and broadcasting them through Yjs Awareness as CSS decoration classes.  
> **Key Takeaway**: Demonstrates experience with industry-standard developer tooling and DOM decoration mapping.

### Q15: How does CodeSync validate user input before sending it to Docker?
> **Answer**: FastAPI uses Pydantic schema validation (`ExecutionRequest`) to enforce: (1) Total source code size must not exceed 100KB (`MAX_SOURCE_SIZE_BYTES`), (2) STDIN input must not exceed 64KB, (3) Total file count capped at 30 files, (4) File names are sanitized against path traversal attacks (e.g. rejecting `../` or `/etc/passwd`), and (5) Timeout parameters are bounded between 1s and 15s.  
> **Key Takeaway**: Shows disciplined defensive programming and API validation practices.

### Q16: How are memory leaks prevented on the long-running Node.js collaboration server?
> **Answer**: The Node.js server tracks active WebSocket connections per room in a Map. When all clients disconnect from a room, the server sets a cleanup grace period timer. If no client reconnects before the timer expires, the in-memory `Y.Doc` instance is destroyed and garbage collected. Furthermore, Yjs automatically compresses its internal item struct linked-list via Run-Length Encoding (RLE) to prevent memory bloating during extended editing sessions.  
> **Key Takeaway**: Demonstrates production memory management and resource lifecycle consciousness.

### Q17: What is the role of Docker Compose in CodeSync?
> **Answer**: Docker Compose coordinates the multi-container application stack into a single unified topology: (1) Defines dedicated bridge network `codesync-network`, (2) Coordinates startup dependencies using healthchecks (`depends_on: { condition: service_healthy }`), (3) Mounts the host Docker socket `/var/run/docker.sock` into the API container for isolated sandbox spawning, and (4) Enables single-command local deployment: `docker compose up --build`.  
> **Key Takeaway**: Highlights DevOps and container orchestration proficiency.

### Q18: How do you prevent large output logs from overwhelming the network or browser?
> **Answer**: The backend truncates stdout and stderr streams at 64KB (`MAX_OUTPUT_LENGTH = 65536`). If user code generates infinite output (e.g., `while True: print('A')`), the backend slices the buffer and appends `\n... [Output truncated: maximum size limit reached]`. This protects network bandwidth and prevents the browser's terminal renderer from freezing.  
> **Key Takeaway**: Demonstrates proactive prevention of client-side DOM freezing and network saturation.

### Q19: What are the trade-offs of using WebSockets vs. HTTP Server-Sent Events (SSE) or Long Polling?
> **Answer**: HTTP Long-Polling incurs high latency and heavy header overhead on every request. Server-Sent Events (SSE) provide low-overhead unidirectional server-to-client streaming, but client-to-server messages still require separate HTTP POST requests. WebSockets provide a persistent, bi-directional, full-duplex TCP channel with minimal 2-byte framing overhead, making WebSockets the optimal protocol for sub-50ms collaborative editing where both client and server continuously exchange small binary deltas.  
> **Key Takeaway**: Shows clear protocol comparison and architectural justification.

### Q20: If you had to add a production feature next, what would you prioritize?
> **Answer**: I would implement: (1) Persistent Room Snapshots: Saving room state to PostgreSQL/S3 with version history checkpoints, (2) Audio/Video WebRTC peer mesh for integrated voice chat during pair programming, and (3) Language Server Protocol (LSP) integration via WebAssembly or Docker sidecars for full IntelliSense autocomplete and diagnostics.  
> **Key Takeaway**: Shows forward-thinking product vision and engineering roadmap planning.

---

## 7. Resume Bullet Points (Google XYZ Formula)

### For Full-Stack Software Engineer Roles:
- **Architected and deployed "CodeSync"**, a real-time collaborative cloud IDE supporting simultaneous multi-user code editing across 4 languages with sub-50ms synchronization latency using React 18, Monaco Editor, and Yjs CRDTs.
- **Engineered a hardened Docker sandbox execution engine** in Python 3.12 & FastAPI, executing untrusted polyglot code in ephemeral micro-containers with non-root security, zero network access, and strict cgroup CPU/RAM limits.
- **Designed an Nginx reverse proxy gateway** multiplexing full-duplex WebSocket connections and REST APIs on a unified port with 100% test coverage using pytest.

### For Backend & Distributed Systems Engineer Roles:
- **Engineered a conflict-free real-time collaboration engine** using Yjs CRDTs over WebSockets, achieving strong eventual consistency and zero merge conflicts during concurrent multi-peer editing sessions.
- **Constructed a multi-tenant sandboxed execution service** using Python FastAPI and Docker Engine API, implementing capability dropping, read-only rootfs, in-memory tmpfs workspaces, and SIGKILL timeout watchdogs.
- **Eliminated event-loop blocking** by restructuring FastAPI path operations to asynchronous worker thread pools, improving server responsiveness under heavy I/O and concurrent sandbox spawning.

---

## 8. 60-Second Interview Elevator Pitch Script

> *"I built CodeSync, a full-stack, real-time collaborative cloud code editor and sandboxed execution platform. The core engineering challenge was enabling multiple remote engineers to edit complex multi-file projects simultaneously without race conditions or merge conflicts, while also allowing arbitrary user code execution safely on the backend.*
> 
> *On the frontend, I integrated Monaco Editor with Yjs CRDTs over WebSockets to achieve sub-50ms eventual consistency and live cursor awareness. On the backend, I built an isolated multi-tenant execution runner in Python FastAPI that dynamically spins up hardened Linux Docker containers with rootless users, read-only filesystems, cgroup CPU/RAM bounds, and zero network access. The entire microservices topology is orchestrated with Docker Compose behind an Nginx gateway.*
> 
> *Building this project gave me deep experience with distributed state synchronization, Linux container internals, and asynchronous Python architecture."*
