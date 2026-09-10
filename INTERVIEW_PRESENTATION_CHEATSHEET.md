# 🎯 CodeSync — Interview Presentation & Live Demo Cheat Sheet
> **Print or keep this open on your screen during your interview.** It is structured in the exact chronological order interviewers follow: Elevator Pitch -> Live Demo -> Architecture Deep Dive -> Technical Tradeoffs -> System Design Q&A.

---

## ⚡ 1. The 60-Second Elevator Pitch
*(When the interviewer asks: **"Tell me about this project"** or **"Walk me through your most complex project"**)*

> "I built **CodeSync**, a production-grade, real-time collaborative cloud IDE and sandboxed code execution platform.
> 
> The core engineering challenge I wanted to solve was twofold:
> 1. **Zero-Conflict Real-Time Collaboration**: Allowing multiple remote engineers to edit, format, and organize multi-file projects simultaneously without data races or lock contention.
> 2. **Secure Multi-Tenant Code Execution**: Allowing untrusted, user-submitted code in Python, Node.js, C++, and Java to run safely on the backend without putting the host server at risk.
> 
> To solve this, on the frontend, I integrated **Monaco Editor** with **Yjs CRDTs (Conflict-Free Replicated Data Types)** over full-duplex WebSockets, achieving sub-50ms synchronization latency with live colored cursor awareness.
> 
> On the backend, I built a microservices architecture with a **Python 3.12 FastAPI** orchestrator and hardened **Linux Docker sandboxes** that enforce non-root execution, cgroup memory and CPU limits, read-only filesystems, and strict network isolation. The entire topology is orchestrated with Docker Compose behind an **Nginx reverse proxy gateway**."

---

## 🎬 2. The 2-Minute Live Demo Script
*(If the interviewer says: **"Can you share your screen and demo it?"**)*

### Preparation before the interview:
1. Run `docker compose up --build` in your terminal.
2. Open two browser windows side-by-side:
   - **Window 1 (Left)**: Normal Chrome window at `http://localhost:8080` (Nickname: **Alice**).
   - **Window 2 (Right)**: Incognito or Edge window at `http://localhost:8080` (Nickname: **Bob**).

### What to do and say during the demo:

| Step | Action | What to Say |
| :--- | :--- | :--- |
| **1. Room Creation** | In Window 1, select **Python**, enter name **Alice**, click **Create Room**. | *"I'll create a new collaborative session. CodeSync generates an 8-character human-readable room code like ABCD-1234 and sets up the project workspace."* |
| **2. Multi-User Join** | In Window 2, paste the share link (or click Join Room and enter the code) as **Bob**. | *"Now Bob joins the room. Notice how Bob is instantly assigned a unique color avatar, and both users appear in the real-time Collaborators presence stack."* |
| **3. Live Cursors & Typing** | In Window 1, highlight code and type `print("Hello from Alice")`. | *"As Alice moves her cursor or highlights code, Bob sees her colored cursor tag and selection boxes move live with sub-50ms latency. Because this uses Yjs CRDTs under the hood, even if both engineers type simultaneously at the exact same anchor point, all keystrokes merge deterministically without overwriting each other."* |
| **4. Multi-File Sync** | In Window 1, click `+` (New File) and create `helper.py`. | *"The CRDT engine also synchronizes the entire file hierarchy. When Alice creates `helper.py`, it appears instantly in Bob's file explorer. If Bob clicks on it, Alice sees an indicator showing Bob is viewing `helper.py`."* |
| **5. Sandboxed Run** | Press `Ctrl + Enter` (or click **Run**). | *"When I click Run, the backend packages the workspace in memory, spins up an isolated, rootless Docker container, applies strict 256MB memory and 1 CPU cgroup bounds, runs the code, captures stdout and stderr, and tears down the container. The output is streamed back to the bottom terminal in under 400 milliseconds."* |
| **6. Templates & Presets** | Click `⚡ Templates` in the editor tab bar. | *"We also built live template injection, allowing engineers to load clean starters like Hello World or algorithms like Binary Search into their active file with one click."* |

---

## 🏛️ 3. Architecture Breakdown
*(If the interviewer asks: **"Explain your high-level architecture"**)*

```
[ Web Browser Client ] (React 18 + Monaco + Yjs CRDT)
          │
          ▼ Port 8080
┌───────────────────────────────────────────────────────────┐
│               Nginx Reverse Proxy Gateway                 │
├─────────────────────┬───────────────────┬─────────────────┤
│  location /         │  location /api    │ location /collab│
│  (Client SPA: 5173) │  (FastAPI: 8000)  │ (Node.js: 1234) │
└──────────┬──────────┴─────────┬─────────┴────────┬────────┘
           │                    │                  │
           ▼                    ▼                  ▼
┌────────────────────┐ ┌────────────────┐ ┌────────────────┐
│ React 18 / Vite    │ │ FastAPI Python │ │ Node.js Yjs    │
│ Monaco Code Editor │ │ Sandboxed API  │ │ collab-server  │
│ y-monaco Binding   │ │ Pydantic Check │ │ WebSockets     │
└────────────────────┘ └────────┬───────┘ └────────────────┘
                                │ (Docker API /var/run/docker.sock)
                                ▼
                       ┌──────────────────┐
                       │ Micro-Container  │
                       │ Hardened Sandbox │
                       │ (Python/Node/C++)│
                       │ tmpfs /workspace │
                       └──────────────────┘
```

1. **Client Layer**: React 18, Tailwind CSS, Monaco Editor (VS Code core engine). Uses `y-monaco` to bind Monaco's `ITextModel` directly to Yjs CRDT data streams.
2. **Gateway Layer**: Nginx reverse proxy multiplexing HTTP REST APIs, persistent full-duplex WebSockets, and Vite static assets on a single public port (8080).
3. **Real-Time Layer**: Standalone Node.js server running `y-websocket`. Operates as a high-throughput, binary-encoded pub/sub relay without requiring expensive server-side transformation computation.
4. **Backend API Layer**: Python 3.12 FastAPI service handling room generation, payload validation via Pydantic, and container lifecycle orchestration.
5. **Sandbox Layer**: Isolated OCI Docker containers built from slim base images (Python 3.12, Node 22, GCC 14, OpenJDK 21).

---

## 🛡️ 4. The 8 Layers of Sandbox Security
*(If the interviewer asks: **"How do you ensure user code doesn't hack your server?"**)*

| Layer | Security Measure | Attack Neutralized |
| :--- | :--- | :--- |
| **1. Network** | `network_mode: "none"` | Blocks port scanning, DDoS attacks, cryptomining pools, and secret exfiltration. |
| **2. Identity** | Non-root `user: "10001:10001"` (`sandbox`) | Prevents container escapes from gaining root privileges on the host. |
| **3. Filesystem** | `read_only: True` rootfs | System files (`/bin`, `/usr`, `/lib`) cannot be altered or overwritten. |
| **4. Memory Storage** | `tmpfs: {"/workspace": "size=64m"}` | Code executes purely in RAM; zero traces persist to the host disk on termination. |
| **5. Cgroup RAM** | `mem_limit: "256m"` | Prevents out-of-memory (OOM) attacks that would crash the host machine. |
| **6. Cgroup PIDs** | `pids_limit: 64` | **Neutralizes fork bombs** (`:(){ :|:& };:`) by returning `EAGAIN` when process table limits are hit. |
| **7. Capabilities** | `cap_drop: ["ALL"]` + `no-new-privileges: true` | Drops all Linux kernel capabilities to eliminate setuid privilege escalation. |
| **8. Watchdog** | `container.wait(timeout=5)` + `container.kill()` | Enforces SIGKILL termination against infinite loops (`while True: pass`). |

---

## 💡 5. Top 5 "Tricky" Interview Questions & Bulletproof Answers

### Q1: "Why did you choose CRDTs over Operational Transformation (like Google Docs)?"
> **Answer**:  
> "Operational Transformation (OT) requires a central server to sequence and mathematically rewrite concurrent operations. If two users type at index 5, the server must calculate an $O(N^2)$ transformation matrix to adjust offsets. This makes OT tightly coupled to a single server and fragile under high network latency.  
> In contrast, **Yjs CRDTs assign every character an immutable, globally unique ID (ClientId + Lamport Clock)**. Replicas merge updates deterministically using mathematical convergence properties (commutativity, associativity, idempotency). This enables true offline-first editing with zero local latency, and the server acts as a lightweight binary relay rather than doing heavy math."

### Q2: "In FastAPI, why did you use standard `def execute_code` instead of `async def`?"
> **Answer**:  
> "In FastAPI, `async def` runs directly on the single-threaded asyncio event loop. If an `async def` function makes a blocking synchronous call—such as `container.wait()` or subprocess execution—it blocks the entire event loop, freezing all incoming HTTP requests, health checks, and WebSocket handshakes.  
> By defining `def execute_code` (without `async`), FastAPI automatically delegates the execution to its external **asynchronous worker thread pool** (`anyio.to_thread`), keeping the main event loop 100% non-blocking and responsive."

### Q3: "How do you handle writing files into a container whose root filesystem is read-only?"
> **Answer**:  
> "Docker's standard `put_archive` API checks if the rootfs is writable before extraction, throwing a `400 Bad Request: container rootfs is read-only`.  
> To solve this without sacrificing security, we pack the user's workspace files into an **in-memory tarball, base64-encode it, and pass it directly to the container startup command**. Inside the container, `sh` pipes the base64 payload into `tar -xf - -C /workspace`. Because `/workspace` is mounted as an in-memory `tmpfs`, extraction succeeds while the rest of the root filesystem remains strictly read-only."

### Q4: "How would you scale this to 100,000 concurrent rooms in production?"
> **Answer**:  
> "We would scale horizontally across three tiers:
> 1. **WebSocket Collaboration Layer**: Deploy multiple Node.js y-websocket instances behind a Layer 7 load balancer with sticky sessions on Room ID, using **Redis Pub/Sub** to synchronize rooms across cluster instances.
> 2. **Execution Worker Pool**: Decouple the execution endpoint from FastAPI using an asynchronous message broker like **RabbitMQ or Celery**, routing execution jobs to a pool of pre-warmed sandbox worker nodes.
> 3. **MicroVM Sandboxing**: In enterprise production, replace standard Docker with **AWS Firecracker MicroVMs or Google gVisor (`runsc`)**, providing hardware-level kernel isolation with 5ms spin-up times."

### Q5: "What was the most challenging bug you encountered and how did you resolve it?"
> **Answer**:  
> "The most interesting issue occurred when testing the editor from mobile devices on a local Wi-Fi IP address. Modern mobile browsers (Chrome on Android and Safari on iOS) disable the Web Share API (`navigator.share`) on insecure HTTP IP addresses.  
> Furthermore, hardcoded `localhost` references in client scripts caused phones to send requests to themselves rather than the host PC. I refactored the frontend to dynamically derive API and WebSocket URLs from `window.location.origin` and `window.location.host`, and replaced the browser share dependency with direct, one-click WhatsApp, Telegram, and Email URI handlers. This made the app 100% accessible and responsive across any device on the network."

---

## 🌟 6. Key Buzzwords & Concepts to Mention
Drop these naturally to signal senior engineering depth:
- **Eventual Consistency & CRDTs** (vs. Strong Consistency / Locks)
- **Lamport Timestamps & Vector Clocks**
- **Linux Cgroups v2 & PID Limiting** (Resource throttling & fork-bomb prevention)
- **Linux Kernel Capabilities** (`cap_drop: ALL`, `no-new-privileges`)
- **Tmpfs In-Memory Filesystems** (Ephemeral workspace isolation)
- **Threadpool Offloading in FastAPI** (`anyio.to_thread` vs Event Loop Starvation)
- **HTTP/1.1 WebSocket Upgrade Multiplexing** in Nginx
- **Zero-Trust Multi-Tenancy**
