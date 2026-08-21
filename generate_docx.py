"""
Generates the comprehensive CodeSync Technical Architecture & Interview Mastery Guide in Microsoft Word (.docx) format.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner margins of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_guide():
    doc = docx.Document()

    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styling colors
    PRIMARY_COLOR = RGBColor(30, 64, 175)     # Deep Blue
    SECONDARY_COLOR = RGBColor(15, 118, 110)  # Teal
    TEXT_COLOR = RGBColor(30, 41, 59)        # Slate 800
    MUTED_COLOR = RGBColor(100, 116, 139)    # Slate 500

    # Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("CODESYNC")
    run_title.font.size = Pt(28)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR

    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_p.paragraph_format.space_after = Pt(2)
    run_sub = subtitle_p.add_run("Real-Time Collaborative Cloud IDE & Sandboxed Execution Platform")
    run_sub.font.size = Pt(14)
    run_sub.font.bold = True
    run_sub.font.color.rgb = SECONDARY_COLOR

    tag_p = doc.add_paragraph()
    tag_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tag_p.paragraph_format.space_after = Pt(16)
    run_tag = tag_p.add_run("Comprehensive Technical Architecture, System Design Deep-Dive & Interview Mastery Guide")
    run_tag.font.size = Pt(10.5)
    run_tag.font.italic = True
    run_tag.font.color.rgb = MUTED_COLOR

    # Add a horizontal callout box
    callout = doc.add_table(rows=1, cols=1)
    callout.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout.autofit = False
    callout.columns[0].width = Inches(6.8)
    cell = callout.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    callout_p = cell.paragraphs[0]
    callout_p.paragraph_format.space_after = Pt(0)
    run_callout = callout_p.add_run(
        "Candidate Mastery Note: This guide gives you complete, deep-level technical fluency over every system component, design decision, security boundary, and distributed scaling tradeoff in CodeSync. You will be able to answer any software engineering interview question with clarity and confidence."
    )
    run_callout.font.size = Pt(9.5)
    run_callout.font.italic = True
    run_callout.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper functions
    def add_section_header(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(title)
        run.font.size = Pt(14.5)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR
        return h

    def add_sub_header(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(title)
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = SECONDARY_COLOR
        return h

    def add_body(text, bold_prefix=None, bullet=False):
        p = doc.add_paragraph(style='List Bullet' if bullet else 'Normal')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.size = Pt(10)
            run_b.font.color.rgb = TEXT_COLOR
        run_t = p.add_run(text)
        run_t.font.size = Pt(10)
        run_t.font.color.rgb = TEXT_COLOR
        return p

    def add_qa_box(q_num, question, answer, key_takeaway):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        table.columns[0].width = Inches(6.8)
        c = table.cell(0, 0)
        set_cell_background(c, "F8FAFC")
        set_cell_margins(c, top=140, bottom=140, left=180, right=180)
        
        qp = c.paragraphs[0]
        qp.paragraph_format.space_after = Pt(4)
        q_run = qp.add_run(f"Q{q_num}: {question}")
        q_run.font.bold = True
        q_run.font.size = Pt(10.5)
        q_run.font.color.rgb = PRIMARY_COLOR

        ap = c.add_paragraph()
        ap.paragraph_format.space_after = Pt(4)
        ap.paragraph_format.line_spacing = 1.15
        a_lbl = ap.add_run("Answer: ")
        a_lbl.font.bold = True
        a_lbl.font.size = Pt(9.5)
        a_run = ap.add_run(answer)
        a_run.font.size = Pt(9.5)
        a_run.font.color.rgb = TEXT_COLOR

        tp = c.add_paragraph()
        tp.paragraph_format.space_after = Pt(0)
        t_lbl = tp.add_run("Key Takeaway / Interview Tip: ")
        t_lbl.font.bold = True
        t_lbl.font.size = Pt(9)
        t_lbl.font.color.rgb = SECONDARY_COLOR
        t_run = tp.add_run(key_takeaway)
        t_run.font.size = Pt(9)
        t_run.font.italic = True
        t_run.font.color.rgb = RGBColor(71, 85, 105)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # 1. Executive Summary
    add_section_header("1. Executive Summary & Problem Solved")
    add_body("CodeSync is a production-grade, real-time collaborative cloud coding platform and sandboxed execution environment. It enables software engineers in distributed teams to create or join collaborative rooms via a unique room identifier, edit polyglot multi-file codebases simultaneously without merge conflicts, view peer cursors in real time, and execute code safely inside micro-isolated Linux Docker sandboxes with sub-second execution cycles.")
    add_body("Unlike basic Web-based text editors that rely on locking files or polling backends, CodeSync implements Conflict-Free Replicated Data Types (CRDTs) using the Yjs framework. This ensures mathematically guaranteed eventual consistency, peer-to-peer style awareness, and instantaneous zero-latency local edits.")

    add_body("Core Capabilities:", bold_prefix=None)
    add_body(" Allows multiple users to type, delete, format, and navigate the exact same files simultaneously with zero conflict overwrites.", bold_prefix="Real-Time CRDT Collaboration: ", bullet=True)
    add_body(" Live remote colored cursors, multi-line selection boxes, user name tags, and active file navigation indicators.", bold_prefix="Presence Awareness Stack: ", bullet=True)
    add_body(" Python 3.12, JavaScript (Node.js 22), C++ (GCC 14), Java (OpenJDK 21), and live interactive Web preview (HTML/CSS/JS).", bold_prefix="Polyglot Multi-File Execution: ", bullet=True)
    add_body(" Dropped Linux capabilities (ALL), non-root user execution (UID 10001), strict cgroup limits (256MB RAM, 1 CPU, 64 PIDs), read-only root filesystem, memory-backed tmpfs workspace, and disabled network access.", bold_prefix="Hardened Multi-Tenant Sandboxing: ", bullet=True)
    add_body(" Nginx reverse proxy gateway routing HTTP REST, Yjs WebSockets, and SPA assets on a unified port (8080) with full Docker Compose local orchestration.", bold_prefix="Microservices Orchestration: ", bullet=True)

    # 2. Architecture
    add_section_header("2. High-Level System Architecture")
    add_body("CodeSync is structured as a decoupled, microservices-based distributed system containing four primary services coordinated behind an Nginx reverse proxy gateway:")

    arch_table = doc.add_table(rows=5, cols=3)
    arch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    arch_table.autofit = False
    widths = [Inches(1.5), Inches(1.8), Inches(3.5)]
    for row in arch_table.rows:
        for i, w in enumerate(widths):
            row.cells[i].width = w

    headers = ["Service Component", "Technology Stack", "Role & Responsibilities"]
    for i, h in enumerate(headers):
        c = arch_table.cell(0, i)
        set_cell_background(c, "1E3A8A")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Client SPA", "React 18, Vite, Tailwind CSS, Monaco Editor", "Provides browser IDE, Monaco editor instance, file explorer, CRDT binding via y-monaco, terminal output, and awareness rendering."),
        ("Gateway / Proxy", "Nginx Alpine Reverse Proxy (Port 8080)", "Multiplexes incoming traffic: routes `/` to Client, `/api` & `/health` to FastAPI, and `/collaboration` WebSocket upgrades to Node.js server."),
        ("Collaboration Server", "Node.js, y-websocket, Yjs CRDT Engine", "Manages WebSocket client rooms, room access validation, CRDT document state updates, and awareness broadcasts with binary encoding."),
        ("API & Sandbox Engine", "Python 3.12, FastAPI, Docker SDK, Linux Containers", "Validates room schemas, manages execution quotas, builds in-memory tarball bundles, launches sandboxed Docker containers, and collects logs.")
    ]

    for row_idx, (svc, tech, role) in enumerate(data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, text in enumerate([svc, tech, role]):
            c = arch_table.cell(row_idx, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. CRDTs
    add_section_header("3. Real-Time Collaboration: CRDTs vs. Operational Transformation")
    add_sub_header("What is a CRDT (Conflict-Free Replicated Data Type)?")
    add_body("A Conflict-Free Replicated Data Type (CRDT) is a data structure designed to be replicated across multiple distributed nodes where each replica can be updated independently and concurrently without central coordination. The data structure guarantees that once all replicas receive the same set of updates (even in different orders), they will converge to the exact same state mathematically (Strong Eventual Consistency).")

    add_sub_header("Why CodeSync uses Yjs CRDT instead of Operational Transformation (Google Docs style):")
    
    crdt_table = doc.add_table(rows=6, cols=3)
    crdt_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    crdt_table.autofit = False
    c_widths = [Inches(1.8), Inches(2.5), Inches(2.5)]
    for row in crdt_table.rows:
        for i, w in enumerate(c_widths):
            row.cells[i].width = w

    c_headers = ["Dimension", "Operational Transformation (OT)", "Yjs CRDT (CodeSync)"]
    for i, h in enumerate(c_headers):
        c = crdt_table.cell(0, i)
        set_cell_background(c, "0F766E")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    c_data = [
        ("Architecture", "Centralized server is strictly required to sequence and transform every operation.", "Decentralized / Peer-to-Peer capable; server is a simple relay without transformation math."),
        ("Concurrency Complexity", "Combinatorial explosion of transformation functions (O(N^2) complexity with edge cases).", "Deterministic convergence via mathematically proven CRDT item structuring and Lamport clocks."),
        ("Network Resilience", "High latency or offline work requires pausing or complex replay locks.", "True offline-first: local edits apply with 0ms latency and merge cleanly upon reconnection."),
        ("Memory & Speed", "Low memory, but transformations incur heavy CPU overhead on the server.", "Yjs achieves near-native performance using a specialized doubly-linked list of Item structs with run-length encoding."),
        ("Conflict Resolution", "Transformed character indices shift based on incoming server sequence.", "Each character insertion has a globally unique ID (ClientID + Lamport Clock) with deterministic left/right placement.")
    ]

    for row_idx, (dim, ot, crdt) in enumerate(c_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for col_idx, text in enumerate([dim, ot, crdt]):
            c = crdt_table.cell(row_idx, col_idx)
            set_cell_background(c, bg)
            set_cell_margins(c, 80, 80, 100, 100)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(text)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 4. Sandbox Security
    add_section_header("4. Sandboxed Code Execution & Security Architecture")
    add_body("Executing untrusted user code on a shared server is one of the highest-risk operations in software engineering. CodeSync applies a Defense-in-Depth multi-layer security sandbox model:")

    add_body(" Containers are launched with `network_mode='none'`, physically preventing inbound or outbound socket connections. User code cannot call external APIs, perform DDoS attacks, or exfiltrate environment variables.", bold_prefix="Layer 1 - Complete Network Isolation: ", bullet=True)
    add_body(" Containers run under non-root user `sandbox` (UID 10001, GID 10001). Even if an exploit escapes the runtime, it lacks root privileges on the container or host.", bold_prefix="Layer 2 - Non-Root Execution Sandbox: ", bullet=True)
    add_body(" Root filesystem is mounted strictly read-only (`read_only=True`). User code cannot modify `/bin`, `/usr`, or system binaries.", bold_prefix="Layer 3 - Read-Only Root Filesystem: ", bullet=True)
    add_body(" Execution occurs entirely in memory via tmpfs mounted at `/workspace` with `size=64m`. Files disappear automatically when the container terminates.", bold_prefix="Layer 4 - Ephemeral In-Memory Workspace: ", bullet=True)
    add_body(" Hard limits enforced via Linux cgroups: (1) Memory capped at 256MB, (2) CPU quota capped at 1.0 core (1e9 nanoCPUs), (3) Process count limited to 64 PIDs (`pids_limit=64`) to neutralize fork bombs.", bold_prefix="Layer 5 - Cgroup Resource Throttling: ", bullet=True)
    add_body(" Dropped all Linux kernel capabilities (`cap_drop=['ALL']`) and enabled `no-new-privileges:true` to block setuid/setgid privilege escalation.", bold_prefix="Layer 6 - Linux Capability Stripping: ", bullet=True)
    add_body(" Strict execution timer (default 5s, max 15s) enforced via backend `container.wait(timeout)`. Hung processes or infinite loops are forcefully killed via SIGKILL.", bold_prefix="Layer 7 - Execution Timeout & SIGKILL Guard: ", bullet=True)
    add_body(" User source files are packed into an in-memory tar archive, base64-encoded, and extracted on container startup directly into the `/workspace` tmpfs. This avoids Docker daemon `put_archive` API write collisions against read-only root filesystems.", bold_prefix="Layer 8 - In-Memory Base64 Injection: ", bullet=True)

    # 5. Sequence Flows
    add_section_header("5. End-to-End Request & Data Flow Traces")
    add_sub_header("Trace 1: Real-Time Keystroke Collaboration Lifecycle")
    add_body("1. User A types a letter 'x' inside the Monaco Editor.")
    add_body("2. Monaco fires an edit event which is intercepted by `MonacoBinding` (from `y-monaco`).")
    add_body("3. `MonacoBinding` converts the edit into a Yjs Text transaction, assigning it `(ClientId: A, Clock: 1042)`.")
    add_body("4. Yjs encodes the delta update into a compact binary Uint8Array buffer.")
    add_body("5. `WebsocketProvider` wraps the binary payload into a WebSocket frame and sends it over `/collaboration/ABCD-1234`.")
    add_body("6. Nginx intercepts the WebSocket frame and proxies it to the Node.js `collab-server`.")
    add_body("7. `collab-server` merges the delta into the room's in-memory Yjs Document and broadcasts the delta to all other connected room clients.")
    add_body("8. User B's browser receives the binary update, decodes it via Yjs, and `y-monaco` updates User B's Monaco Editor view with 0ms perceptible delay.")

    add_sub_header("Trace 2: Sandboxed Code Execution Lifecycle")
    add_body("1. User presses `Ctrl + Enter` (or clicks 'Run').")
    add_body("2. React client collects all workspace files and sends `POST /api/execute` with `{ language, files, entry_file, stdin, timeout }`.")
    add_body("3. Nginx proxies the request to FastAPI backend (`api:8000`).")
    add_body("4. FastAPI validates request payload using Pydantic (`ExecutionRequest`), checking source size bounds (<100KB), timeout bounds, and safe filenames.")
    add_body("5. FastAPI offloads the blocking execution call to its background worker threadpool.")
    add_body("6. Docker service builds an in-memory tarball of the files and encodes it as base64.")
    add_body("7. Docker client creates an isolated runner container (`codesync-runner-python:latest`) with `read_only=True`, `network_mode='none'`, `user='10001:10001'`, `tmpfs={'/workspace': 'size=64m'}`, and cgroup limits.")
    add_body("8. Container starts, unpacks files to `/workspace`, and executes the language runner.")
    add_body("9. Backend waits for completion (`container.wait(timeout=5)`), captures stdout and stderr streams, truncates output if exceeding 64KB, and removes the container.")
    add_body("10. Execution response `{ stdout, stderr, exit_code, elapsed_ms, status }` is returned to client and rendered in the terminal panel.")

    # 6. Interview Questions
    add_section_header("6. 20 Technical Interview Questions & Model Answers")

    qa_list = [
        (
            1,
            "What is the fundamental difference between CRDTs and Operational Transformation (OT)?",
            "Operational Transformation requires a centralized authoritative server to sequence and mathematically transform conflicting character offsets. If two users insert text at index 5 concurrently, the server determines whose operation went first and rewrites the second operation. CRDTs eliminate transformation complexity by giving every character a globally unique, immutable ID (ClientId + Lamport Clock) and deterministic sorting rules. Nodes converge automatically without needing an authoritative sequencing server.",
            "Highlight that CRDTs allow decentralized peer-to-peer and offline-first architecture, whereas OT is tightly coupled to centralized server architectures like Google Docs."
        ),
        (
            2,
            "How do you prevent malicious user code from compromising the host server during execution?",
            "We employ a defense-in-depth security model: (1) Complete network isolation (`network_mode: none`), (2) Non-root execution (`UID 10001`), (3) Read-only root filesystem, (4) Writable in-memory tmpfs (/workspace) that is destroyed on exit, (5) Cgroup bounds (256MB RAM, 1 CPU quota, 64 max PIDs to kill fork bombs), (6) Dropping all Linux capabilities (`cap_drop: ALL`) and preventing privilege elevation (`no-new-privileges`), and (7) Hard execution timeouts with SIGKILL.",
            "Explain that no single security measure is sufficient; multi-layered isolation ensures that even if one layer has a vulnerability, the others prevent exploitation."
        ),
        (
            3,
            "Why did you use Nginx as a reverse proxy gateway instead of exposing FastAPI directly?",
            "Nginx serves as a single entry point gateway for multiple reasons: (1) Single Port Multiplexing: Routes HTTP REST, Yjs WebSockets, and SPA assets cleanly on port 8080, (2) WebSocket Connection Handling: Handles HTTP/1.1 Upgrade headers, long-lived TCP keep-alives (86,400s timeouts), and buffering control, (3) Security & Rate Limiting: Acts as a buffer against slowloris attacks and oversized request payloads (`client_max_body_size 10M`), and (4) Decoupled Microservices: The frontend client does not need to know internal microservice ports.",
            "Emphasize that reverse proxies simplify frontend configuration (eliminating CORS issues) and provide production-ready TLS/SSL termination and load balancing capabilities."
        ),
        (
            4,
            "Why did you define the FastAPI `/api/execute` route as synchronous `def` rather than `async def`?",
            "In FastAPI, defining an endpoint as `async def` tells Uvicorn to run it directly on the single-threaded asyncio event loop. If an `async def` function makes blocking synchronous calls—such as `docker.wait()`, `time.sleep()`, or subprocess execution—it blocks the entire event loop, freezing all incoming HTTP requests, health checks, and WebSocket handshakes. By defining the route as standard `def execute_code`, FastAPI automatically offloads execution to an asynchronous worker thread pool (`anyio.to_thread`), keeping the main event loop fully responsive.",
            "This is a high-level FastAPI architectural insight that demonstrates mastery over Python asyncio vs. multithreaded concurrency models."
        ),
        (
            5,
            "How do you handle simultaneous typing when two users insert text at the exact same cursor position?",
            "In Yjs, every item insertion is assigned a deterministic identifier consisting of the client's unique integer ID and a monotonically increasing Lamport clock counter. When two users insert text at the exact same anchor point, Yjs compares the two Client IDs deterministically (e.g., Client 124 < Client 309). Both replicas execute the exact same deterministic comparison algorithm, placing one character consistently to the left of the other on all machines without negotiation.",
            "State that this deterministic sorting is why CRDTs guarantee mathematical convergence without requiring locks or rollbacks."
        ),
        (
            6,
            "How does CodeSync handle file creation, deletion, and renaming in real time?",
            "Files are represented as a Yjs `Y.Map` where each entry represents a file entity with metadata (id, name, language, isEntry) and points to a corresponding `Y.Text` CRDT data stream for content. When a user creates or deletes a file, an update transaction is dispatched to the `Y.Map`. Because `Y.Map` is also a CRDT, additions and removals sync across all peers instantly. Deleting a file marks its entry as deleted, and peers automatically switch to an active file if their current file was removed.",
            "Demonstrates that CRDTs in CodeSync are not just for plain text editing, but manage the entire project hierarchical tree structure."
        ),
        (
            7,
            "How would you scale CodeSync to support 100,000 concurrent rooms across multiple servers?",
            "To scale horizontally: (1) Collaboration Server: Deploy multiple Node.js y-websocket instances behind a load balancer with sticky sessions based on Room ID (or use Redis Pub/Sub to sync room updates across cluster nodes), (2) Execution Backend: Decouple code execution from FastAPI by using an asynchronous message broker (RabbitMQ/Celery) with a scalable worker pool of pre-warmed sandbox runners, (3) MicroVM Sandboxing: In cloud environments, replace Docker with AWS Firecracker or gVisor for 5ms microVM spin-up times, and (4) Persistent Storage: Persist room snapshots to S3 / PostgreSQL.",
            "This demonstrates distributed systems design knowledge: load balancing, pub/sub, message queues, and serverless microVM execution."
        ),
        (
            8,
            "What happens if a user enters an infinite loop like `while True: pass`?",
            "CodeSync handles this at two levels: (1) CPU Limit: The container is restricted to 1 CPU core via cgroups so host system stability is unaffected, and (2) Timeout Watchdog: The backend starts a watchdog timer (`timeout_seconds`, default 5s). When the timeout expires, `container.wait(timeout)` raises a timeout exception. The backend immediately sends a `container.kill()` (SIGKILL), records the exit code as `124` (standard Linux timeout code), and returns `{ status: 'timeout', stderr: 'Execution timed out after 5 seconds. Process killed.' }` to the client.",
            "Shows thorough testing of edge cases and graceful degradation."
        ),
        (
            9,
            "Why did you use base64 in-memory tarball extraction instead of Docker's `put_archive` API?",
            "Docker's `put_archive` API endpoint verifies that the container's root filesystem is writable before allowing files to be extracted. Because CodeSync enforces a hardened `read_only=True` rootfs for security, calling `put_archive` throws a 400 Bad Request ('container rootfs is marked read-only'). To resolve this, we encode the files as an in-memory base64 tarball passed into the container command (`sh -c \"echo '<b64>' | base64 -d | tar -xf - -C /workspace && cd /workspace && run\"`). This writes directly into the memory-backed `/workspace` tmpfs without violating rootfs read-only protection.",
            "This is a real-world engineering problem you solved, showcasing deep Docker internals and Linux storage knowledge."
        ),
        (
            10,
            "How does CodeSync support multiple programming languages safely?",
            "Each language runs inside a specialized, pre-baked, stripped-down runner image: (1) Python 3.12 (`python:3.12-slim`), (2) JavaScript (`node:22-alpine`), (3) C++ (`gcc:14-bookworm` with `-O2 -std=c++20`), and (4) Java (`openjdk:21-slim`). When a user executes a project, the backend looks up the language runner image, builds the compilation/interpretation pipeline command, feeds STDIN if provided, and captures the execution streams.",
            "Highlights polyglot support and separation of concerns between runtime environments."
        ),
        (
            11,
            "What is the Awareness protocol in Yjs and how is it optimized?",
            "The Awareness protocol handles transient presence information like cursor line/column coordinates, text selection ranges, user names, and assigned avatar colors. It is optimized by being completely separate from the persistent document update history. Awareness updates are sent as lightweight binary state maps with a Client ID key. Each awareness state has a timestamp clock; if a client disconnects or ceases heartbeats, their awareness state automatically expires and peers clean up their cursor graphics without mutating the document.",
            "Explains separation of persistent document state vs. ephemeral UI presence."
        ),
        (
            12,
            "How are network disconnections and reconnections handled?",
            "Yjs `WebsocketProvider` includes exponential backoff reconnection logic. When a user loses internet connectivity, they can continue typing locally with 0ms latency because all edits apply to the local Yjs Doc replica. When connectivity is restored, the client reconnects to the WebSocket server, sends its compact State Vector, and performs a 2-way delta sync. All offline edits merge seamlessly with edits made by online collaborators during the disconnection.",
            "Underlines the offline-first resiliency and high availability of CRDT architecture."
        ),
        (
            13,
            "How do you prevent fork bombs from exhausting server process tables?",
            "In Linux, a fork bomb (`:(){ :|:& };:`) attempts to recursively spawn processes until the operating system's PID table is exhausted, crashing the entire server. CodeSync neutralizes this by enforcing `pids_limit=64` on every container via Linux cgroups. Once a user's code spawns 64 child processes or threads, any subsequent `fork()` or `clone()` syscall returns `EAGAIN` (Resource temporarily unavailable), preventing host exhaustion.",
            "Demonstrates deep knowledge of Linux kernel cgroups and process management."
        ),
        (
            14,
            "What is Monaco Editor and how is it integrated with React and Yjs?",
            "Monaco Editor is the open-source code editor that powers Visual Studio Code. In CodeSync, Monaco is rendered inside React using `@monaco-editor/react`. We integrate Monaco with Yjs using `y-monaco` (`MonacoBinding`). The `MonacoBinding` listens to Yjs Text change events and applies them to Monaco's `ITextModel`, while also capturing Monaco editor selection/cursor changes and broadcasting them through Yjs Awareness as CSS decoration classes.",
            "Demonstrates experience with industry-standard developer tooling and DOM decoration mapping."
        ),
        (
            15,
            "How does CodeSync validate user input before sending it to Docker?",
            "FastAPI uses Pydantic schema validation (`ExecutionRequest`) to enforce: (1) Total source code size must not exceed 100KB (`MAX_SOURCE_SIZE_BYTES`), (2) STDIN input must not exceed 64KB, (3) Total file count capped at 30 files, (4) File names are sanitized against path traversal attacks (e.g. rejecting `../` or `/etc/passwd`), and (5) Timeout parameters are bounded between 1s and 15s.",
            "Shows disciplined defensive programming and API validation practices."
        ),
        (
            16,
            "How are memory leaks prevented on the long-running Node.js collaboration server?",
            "The Node.js server tracks active WebSocket connections per room in a Map. When all clients disconnect from a room, the server sets a cleanup grace period timer. If no client reconnects before the timer expires, the in-memory `Y.Doc` instance is destroyed and garbage collected. Furthermore, Yjs automatically compresses its internal item struct linked-list via Run-Length Encoding (RLE) to prevent memory bloating during extended editing sessions.",
            "Demonstrates production memory management and resource lifecycle consciousness."
        ),
        (
            17,
            "What is the role of Docker Compose in CodeSync?",
            "Docker Compose coordinates the multi-container application stack into a single unified topology: (1) Defines dedicated bridge network `codesync-network`, (2) Coordinates startup dependencies using healthchecks (`depends_on: { condition: service_healthy }`), (3) Mounts the host Docker socket `/var/run/docker.sock` into the API container for isolated sandbox spawning, and (4) Enables single-command local deployment: `docker compose up --build`.",
            "Highlights DevOps and container orchestration proficiency."
        ),
        (
            18,
            "How do you prevent large output logs from overwhelming the network or browser?",
            "The backend truncates stdout and stderr streams at 64KB (`MAX_OUTPUT_LENGTH = 65536`). If user code generates infinite output (e.g., `while True: print('A')`), the backend slices the buffer and appends `\n... [Output truncated: maximum size limit reached]`. This protects network bandwidth and prevents the browser's terminal renderer from freezing.",
            "Demonstrates proactive prevention of client-side DOM freezing and network saturation."
        ),
        (
            19,
            "What are the trade-offs of using WebSockets vs. HTTP Server-Sent Events (SSE) or Long Polling?",
            "HTTP Long-Polling incurs high latency and heavy header overhead on every request. Server-Sent Events (SSE) provide low-overhead unidirectional server-to-client streaming, but client-to-server messages still require separate HTTP POST requests. WebSockets provide a persistent, bi-directional, full-duplex TCP channel with minimal 2-byte framing overhead, making WebSockets the optimal protocol for sub-50ms collaborative editing where both client and server continuously exchange small binary deltas.",
            "Shows clear protocol comparison and architectural justification."
        ),
        (
            20,
            "If you had to add a production feature next, what would you prioritize?",
            "I would implement: (1) Persistent Room Snapshots: Saving room state to PostgreSQL/S3 with version history checkpoints, (2) Audio/Video WebRTC peer mesh for integrated voice chat during pair programming, and (3) Language Server Protocol (LSP) integration via WebAssembly or Docker sidecars for full IntelliSense autocomplete and diagnostics.",
            "Shows forward-thinking product vision and engineering roadmap planning."
        )
    ]

    for q_num, question, answer, takeaway in qa_list:
        add_qa_box(q_num, question, answer, takeaway)

    # 7. Resume Bullets
    add_section_header("7. Resume Bullet Points (Google XYZ Formula)")
    add_body("Use these tailored bullet points on your resume formatted using the high-impact Google XYZ formula ('Accomplished [X] as measured by [Y], by doing [Z]'):")

    add_sub_header("For Full-Stack Software Engineer Roles:")
    add_body("Architected and deployed 'CodeSync', a real-time collaborative cloud IDE supporting simultaneous multi-user code editing across 4 languages with sub-50ms synchronization latency using React 18, Monaco Editor, and Yjs CRDTs.", bullet=True)
    add_body("Engineered a hardened Docker sandbox execution engine in Python 3.12 & FastAPI, executing untrusted polyglot code in ephemeral micro-containers with non-root security, zero network access, and strict cgroup CPU/RAM limits.", bullet=True)
    add_body("Designed an Nginx reverse proxy gateway multiplexing full-duplex WebSocket connections and REST APIs on a unified port with 100% test coverage using pytest.", bullet=True)

    add_sub_header("For Backend & Distributed Systems Engineer Roles:")
    add_body("Engineered a conflict-free real-time collaboration engine using Yjs CRDTs over WebSockets, achieving strong eventual consistency and zero merge conflicts during concurrent multi-peer editing sessions.", bullet=True)
    add_body("Constructed a multi-tenant sandboxed execution service using Python FastAPI and Docker Engine API, implementing capability dropping, read-only rootfs, in-memory tmpfs workspaces, and SIGKILL timeout watchdogs.", bullet=True)
    add_body("Eliminated event-loop blocking by restructuring FastAPI path operations to asynchronous worker thread pools, improving server responsiveness under heavy I/O and concurrent sandbox spawning.", bullet=True)

    # 8. Elevator Pitch
    add_section_header("8. 60-Second Interview Elevator Pitch Script")
    pitch_table = doc.add_table(rows=1, cols=1)
    pitch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pitch_table.autofit = False
    pitch_table.columns[0].width = Inches(6.8)
    pc = pitch_table.cell(0, 0)
    set_cell_background(pc, "EFF6FF")
    set_cell_margins(pc, 150, 150, 180, 180)
    pp = pc.paragraphs[0]
    pp.paragraph_format.space_after = Pt(0)
    pp.paragraph_format.line_spacing = 1.2
    
    pitch_text = (
        "\"I built CodeSync, a full-stack, real-time collaborative cloud code editor and sandboxed execution platform. "
        "The core engineering challenge was enabling multiple remote engineers to edit complex multi-file projects simultaneously without race conditions or merge conflicts, while also allowing arbitrary user code execution safely on the backend.\n\n"
        "On the frontend, I integrated Monaco Editor with Yjs CRDTs over WebSockets to achieve sub-50ms eventual consistency and live cursor awareness. "
        "On the backend, I built an isolated multi-tenant execution runner in Python FastAPI that dynamically spins up hardened Linux Docker containers with rootless users, read-only filesystems, cgroup CPU/RAM bounds, and zero network access. "
        "The entire microservices topology is orchestrated with Docker Compose behind an Nginx gateway. "
        "Building this project gave me deep experience with distributed state synchronization, Linux container internals, and asynchronous Python architecture.\""
    )
    pr = pp.add_run(pitch_text)
    pr.font.size = Pt(10)
    pr.font.color.rgb = RGBColor(30, 58, 138)

    # Save document
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "CodeSync_Interview_Mastery_Guide.docx")
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    create_guide()
