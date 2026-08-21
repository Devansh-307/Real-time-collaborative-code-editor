# CodeSync - Real-Time Collaborative Online Code Editor

CodeSync is a production-minded, real-time collaborative code editor and sandboxed execution platform. It combines **Yjs CRDTs**, **Monaco Editor**, **FastAPI**, **Node.js WebSockets**, **Nginx Gateway**, and **hardened Docker container execution**.

---

## 🌟 Key Features

1. **Real-time Conflict-Free Collaboration**
   - Built on **Yjs CRDT** algorithms (avoiding last-write-wins collisions).
   - Room creation/joining via 8-character codes (e.g. `ABCD-1234`) and shareable instant-join URLs.
   - Live multi-user cursors, selection ranges, presence awareness, and custom color tags.
   - Synchronized file tree management (create, rename, delete files) across all participants.
   - Automatic local storage session recovery upon reconnection.

2. **Developer-Focused IDE Interface**
   - Embedded **Monaco Editor** with dark and light themes.
   - Collapsible File Explorer with language-specific icons and file viewer badges (`Ctrl+B`).
   - Tabbed Bottom Panel: Standard Output/Error, Standard Input (Stdin), Live Web Preview (`<iframe>`), and JSON Linting (`Ctrl+J`).
   - Quick code execution (`Ctrl+Enter` / `Cmd+Enter`).

3. **Multi-Language Support & Starter Templates**
   - **Python 3.12**: `python3 main.py`
   - **JavaScript (Node.js 22)**: `node main.js`
   - **C++ (GCC 14)**: `g++ main.cpp -O2 -o main && ./main`
   - **Java (OpenJDK 21)**: `javac Main.java && java Main`
   - **JSON**: Data preview and real-time syntax linting.
   - **HTML/CSS/JS**: Sandboxed interactive web iframe preview.

4. **Hardened Sandboxed Docker Execution**
   - Non-root container execution (`UID 10001`, user `sandbox`).
   - Read-only root filesystem with memory tmpfs (`/workspace` and `/tmp`).
   - Network isolation (`network_mode: none`).
   - Resource quotas: CPU (1.0 core), Memory (256MB), PIDs limit (64).
   - Strict execution timeout enforcement (default 5 seconds, max 15 seconds).
   - Source code size limit (100 KB max) and output truncation (64 KB max).
   - No host volume mounts. Zero frontend exposure of the Docker socket.

---

## 🏛️ System Architecture

```
                                  +-----------------------+
                                  |     Client Browser    |
                                  |   (React 18 + Monaco) |
                                  +-----------+-----------+
                                              |
                                              | Port 8080
                                              v
                              +---------------+---------------+
                              |         Nginx Gateway         |
                              +---------------+---------------+
                                     /        |        \
                       /api/*       /  /collaboration   \      /*
                                   /          |          \
                                  v           v           v
            +-----------------------+   +-----------+   +-------------------+
            |      FastAPI API      |   | Yjs Collab|   |  Vite SPA Client  |
            |     (Python 3.12)     |   |  Server   |   |   (Port 5173)     |
            +-----------+-----------+   | (Node.js) |   +-------------------+
                        |               +-----------+
                        | Docker Socket (/var/run/docker.sock)
                        v
       +---------------------------------+
       | Isolated Runner Sandbox Images  |
       |  - codesync-runner-python       |
       |  - codesync-runner-javascript   |
       |  - codesync-runner-cpp          |
       |  - codesync-runner-java         |
       +---------------------------------+
```

---

## 🚀 Quick Start with Docker Compose

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.20+)

### 1. Clone & Start Services
Run the following single command in the project root:

```bash
docker compose up --build
```

### 2. Access the Application
Open your web browser and navigate to:
- **Web IDE**: [http://localhost:8080](http://localhost:8080)
- **API Health Probe**: [http://localhost:8080/health](http://localhost:8080/health)
- **FastAPI Interactive Docs**: [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + Enter`** / **`Cmd + Enter`** | Run active project code in sandbox |
| **`Ctrl + B`** / **`Cmd + B`** | Toggle File Explorer side panel |
| **`Ctrl + J`** / **`Cmd + J`** | Toggle Terminal & Output bottom panel |
| **`Ctrl + S`** / **`Cmd + S`** | Acknowledge local sync (changes sync instantly via CRDT) |

---

## 🔒 Security & Production Hardening Disclaimer

> **IMPORTANT NOTICE**:
> Running arbitrary, user-submitted code is inherently high-risk. While CodeSync applies multiple defense-in-depth isolation layers (non-root UID, read-only rootfs, no-network, memory/CPU quotas, PID limits, and strict process timeouts), standard Docker container isolation relies on the shared host Linux kernel.
>
> For public multi-tenant production deployments, we strongly recommend implementing the following additional hardening measures:
> 1. **MicroVM / Sandboxed Runtimes**: Integrate [gVisor](https://gvisor.dev/) (`runsc`) or [Firecracker MicroVMs](https://firecracker-microvm.github.io/) as the OCI container runtime.
> 2. **Kernel Hardening**: Enforce custom **Seccomp** filters and **AppArmor/SELinux** profiles to restrict syscalls.
> 3. **Network Policies**: Use Kubernetes NetworkPolicies or cloud VPC isolation to forbid any metadata service access (`169.254.169.254`).
> 4. **Authentication & Rate Limiting**: Place an API gateway (e.g. Kong / Cloudflare) with user authentication, token quotas, and IP rate limiting in front of `/api/execute`.
> 5. **Audit Logging & Ephemeral Clusters**: Run execution workers in disposable worker nodes with dedicated logging and metric monitoring.

---

## 🛠️ Makefile Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start all services in the foreground |
| `make up` | Start all services in detached background mode |
| `make build` | Build all service and runner images |
| `make down` | Stop and remove all containers and networks |
| `make logs` | Tail real-time logs across all services |
| `make test` | Run backend API and validation unit test suite |
| `make clean` | Prune dangling Docker images and caches |

---

## 🧪 Testing Backend Validation

To execute the unit and integration tests for validation limits, room IDs, and endpoints:

```bash
docker compose exec -T api pytest -v tests/
```

Or locally within the `api/` directory:
```bash
cd api
pip install -r requirements.txt
pytest -v tests/
```
