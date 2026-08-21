"""
Docker Sandboxed Code Execution Service.
Manages hardened, non-root, network-isolated container execution with strict resource limits.
"""

import io
import os
import tarfile
import time
import base64
import subprocess
import logging
from typing import Dict, List, Optional, Tuple

import docker
from docker.errors import DockerException, NotFound, APIError
from app.config import settings
from app.schemas.execution import SourceFile, ExecutionResponse

logger = logging.getLogger("codesync.docker")


class DockerExecutionService:
    def __init__(self):
        self.client: Optional[docker.DockerClient] = None
        self._initialize_docker_client()

    def _initialize_docker_client(self):
        """Connect to local Docker daemon via socket."""
        try:
            self.client = docker.from_env()
            self.client.ping()
            logger.info("Successfully connected to Docker daemon.")
        except Exception as e:
            logger.warning(f"Docker daemon not accessible: {e}. Subprocess fallback will be available.")
            self.client = None

    def is_docker_available(self) -> bool:
        """Check if Docker daemon is responsive."""
        if not self.client:
            self._initialize_docker_client()
        if not self.client:
            return False
        try:
            return bool(self.client.ping())
        except Exception:
            return False

    def _create_tar_archive(self, files: List[SourceFile], stdin_text: str = "") -> bytes:
        """
        Create an in-memory tar archive of source files with correct sandbox permissions.
        """
        tar_stream = io.BytesIO()
        with tarfile.open(fileobj=tar_stream, mode="w") as tar:
            for file in files:
                content_bytes = file.content.encode("utf-8")
                tar_info = tarfile.TarInfo(name=file.name)
                tar_info.size = len(content_bytes)
                tar_info.mtime = int(time.time())
                tar_info.mode = 0o644
                tar_info.uid = 10001
                tar_info.gid = 10001
                tar_info.uname = "sandbox"
                tar_info.gname = "sandbox"
                tar.addfile(tar_info, io.BytesIO(content_bytes))

            # If stdin is provided, bundle it as .stdin for clean piping
            if stdin_text:
                stdin_bytes = stdin_text.encode("utf-8")
                stdin_info = tarfile.TarInfo(name=".stdin")
                stdin_info.size = len(stdin_bytes)
                stdin_info.mtime = int(time.time())
                stdin_info.mode = 0o644
                stdin_info.uid = 10001
                stdin_info.gid = 10001
                tar.addfile(stdin_info, io.BytesIO(stdin_bytes))

        tar_stream.seek(0)
        return tar_stream.getvalue()

    def _get_runner_command_str(self, language: str, entry_file: str, has_stdin: bool) -> Tuple[str, str]:
        """
        Determine Docker image and execution command string for the language.
        """
        lang = language.lower().strip()
        stdin_pipe = " < .stdin" if has_stdin else ""

        if lang in ("python", "python3"):
            image = settings.RUNNER_IMAGES["python"]
            cmd_str = f"python3 {entry_file}{stdin_pipe}"

        elif lang in ("javascript", "node", "js"):
            image = settings.RUNNER_IMAGES["javascript"]
            cmd_str = f"node {entry_file}{stdin_pipe}"

        elif lang in ("cpp", "c++"):
            image = settings.RUNNER_IMAGES["cpp"]
            cmd_str = f"g++ {entry_file} -O2 -o main && ./main{stdin_pipe}"

        elif lang in ("java",):
            image = settings.RUNNER_IMAGES["java"]
            class_name = entry_file[:-5] if entry_file.endswith(".java") else entry_file
            cmd_str = f"javac {entry_file} && java {class_name}{stdin_pipe}"

        else:
            raise ValueError(f"Unsupported language runner: {language}")

        return image, cmd_str

    def execute(
        self,
        language: str,
        files: List[SourceFile],
        entry_file: Optional[str] = None,
        stdin: str = "",
        timeout_seconds: int = 5
    ) -> ExecutionResponse:
        """
        Execute source code within an isolated, sandboxed Docker container.
        Files are safely decoded into the writable /workspace tmpfs at startup.
        """
        start_time = time.perf_counter()

        # Determine main entry file
        if not entry_file:
            lang_info = {
                "python": "main.py",
                "python3": "main.py",
                "javascript": "main.js",
                "node": "main.js",
                "cpp": "main.cpp",
                "c++": "main.cpp",
                "java": "Main.java"
            }
            entry_file = lang_info.get(language.lower().strip(), files[0].name if files else "main.py")

        has_stdin = bool(stdin and stdin.strip())

        # Fallback to safe subprocess if Docker daemon is not running in host environment
        if not self.is_docker_available():
            logger.warning("Docker unavailable. Executing via local subprocess fallback.")
            return self._execute_subprocess_fallback(
                language=language,
                files=files,
                entry_file=entry_file,
                stdin=stdin,
                timeout_seconds=timeout_seconds
            )

        image_name, runner_cmd_str = self._get_runner_command_str(language, entry_file, has_stdin)
        tar_bytes = self._create_tar_archive(files, stdin)
        b64_payload = base64.b64encode(tar_bytes).decode("ascii")

        # Command safely unpacks the in-memory tarball directly into the /workspace tmpfs
        # This keeps the rootfs strictly read-only without triggering Docker API put_archive errors
        full_sh_command = (
            f"echo '{b64_payload}' | base64 -d | tar -xf - -C /workspace && "
            f"cd /workspace && {runner_cmd_str}"
        )

        container = None
        try:
            # 1. Create sandboxed container with strict security bounds
            container = self.client.containers.create(
                image=image_name,
                command=["sh", "-c", full_sh_command],
                user="10001:10001",                   # Non-root user sandbox
                network_mode="none",                   # No network access
                read_only=True,                        # Read-only root filesystem
                working_dir="/workspace",
                tmpfs={
                    "/workspace": "rw,exec,nosuid,size=64m,mode=1777", # Writable execution tmpfs
                    "/tmp": "rw,noexec,nosuid,size=64m,mode=1777"
                },
                mem_limit=settings.CONTAINER_MEMORY_LIMIT,
                memswap_limit=settings.CONTAINER_SWAP_LIMIT,
                nano_cpus=int(settings.CONTAINER_CPU_QUOTA * 1e9),
                pids_limit=settings.CONTAINER_PIDS_LIMIT,
                cap_drop=["ALL"],                      # Drop all Linux capabilities
                security_opt=["no-new-privileges:true"] # Prevent privilege escalation
            )

            # 2. Start container (payload unpacks into tmpfs on start)
            container.start()

            # 3. Wait for execution completion with strict timeout
            timed_out = False
            exit_code = 0

            try:
                result = container.wait(timeout=timeout_seconds)
                exit_code = result.get("StatusCode", 0)
            except Exception as e:
                # Timeout occurred or container hung
                timed_out = True
                exit_code = 124
                logger.info(f"Container execution timed out after {timeout_seconds}s: {e}")
                try:
                    container.kill()
                except Exception:
                    pass

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # 4. Extract logs
            stdout_logs = ""
            stderr_logs = ""
            if not timed_out:
                try:
                    stdout_logs = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
                    stderr_logs = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")
                except Exception as log_err:
                    stderr_logs = f"Log retrieval error: {log_err}"
            else:
                stderr_logs = f"Execution timed out after {timeout_seconds} seconds. Process killed."

            # 5. Apply output length truncation
            if len(stdout_logs) > settings.MAX_OUTPUT_LENGTH:
                stdout_logs = stdout_logs[:settings.MAX_OUTPUT_LENGTH] + "\n... [Output truncated: maximum size limit reached]"
            if len(stderr_logs) > settings.MAX_OUTPUT_LENGTH:
                stderr_logs = stderr_logs[:settings.MAX_OUTPUT_LENGTH] + "\n... [Stderr truncated: maximum size limit reached]"

            return ExecutionResponse(
                stdout=stdout_logs,
                stderr=stderr_logs,
                exit_code=exit_code,
                elapsed_ms=elapsed_ms,
                timed_out=timed_out,
                status="timeout" if timed_out else ("completed" if exit_code == 0 else "error")
            )

        except APIError as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Docker API error during execution: {e}")
            return ExecutionResponse(
                stdout="",
                stderr=f"Sandbox runner error: {str(e)}",
                exit_code=1,
                elapsed_ms=elapsed_ms,
                timed_out=False,
                status="error"
            )
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception as rem_err:
                    logger.debug(f"Container cleanup notice: {rem_err}")

    def _execute_subprocess_fallback(
        self,
        language: str,
        files: List[SourceFile],
        entry_file: str,
        stdin: str,
        timeout_seconds: int
    ) -> ExecutionResponse:
        """
        Fallback runner for environments where Docker daemon is absent or not shared.
        """
        start_time = time.perf_counter()
        lang = language.lower().strip()

        if lang in ("python", "python3"):
            cmd = ["python3", "-c", next((f.content for f in files if f.name == entry_file), files[0].content)]
        elif lang in ("javascript", "node", "js"):
            cmd = ["node", "-e", next((f.content for f in files if f.name == entry_file), files[0].content)]
        else:
            return ExecutionResponse(
                stdout="",
                stderr=f"Language '{language}' requires Docker runner images to compile and execute safely.",
                exit_code=1,
                elapsed_ms=round((time.perf_counter() - start_time) * 1000, 2),
                timed_out=False,
                status="error"
            )

        try:
            proc = subprocess.run(
                cmd,
                input=stdin,
                text=True,
                capture_output=True,
                timeout=timeout_seconds
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return ExecutionResponse(
                stdout=proc.stdout[:settings.MAX_OUTPUT_LENGTH],
                stderr=proc.stderr[:settings.MAX_OUTPUT_LENGTH],
                exit_code=proc.returncode,
                elapsed_ms=elapsed_ms,
                timed_out=False,
                status="completed" if proc.returncode == 0 else "error"
            )
        except subprocess.TimeoutExpired:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return ExecutionResponse(
                stdout="",
                stderr=f"Execution timed out after {timeout_seconds} seconds.",
                exit_code=124,
                elapsed_ms=elapsed_ms,
                timed_out=True,
                status="timeout"
            )
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return ExecutionResponse(
                stdout="",
                stderr=f"Execution error: {str(e)}",
                exit_code=1,
                elapsed_ms=elapsed_ms,
                timed_out=False,
                status="error"
            )


docker_service = DockerExecutionService()