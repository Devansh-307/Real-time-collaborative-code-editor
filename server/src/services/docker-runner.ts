import { spawn, execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { config } from '../config.js';
import { SUPPORTED_LANGUAGES } from './languages.js';
import { logger } from '../utils/logger.js';

export interface ExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  error?: string;
  mode?: 'docker-sandbox' | 'local-fallback';
}

export class DockerRunnerService {
  private static isDockerAvailable: boolean | null = null;

  /**
   * Checks whether the Docker daemon is accessible
   */
  public static checkDocker(): boolean {
    if (this.isDockerAvailable !== null) return this.isDockerAvailable;
    try {
      execSync('docker info', { stdio: 'ignore', timeout: 2000 });
      this.isDockerAvailable = true;
    } catch {
      this.isDockerAvailable = false;
      logger.warn('Docker daemon not detected. Using Local Execution Fallback mode.');
    }
    return this.isDockerAvailable;
  }

  /**
   * Executes code either in Docker Sandbox (preferred) or Local Fallback
   */
  public static async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    const langConfig = SUPPORTED_LANGUAGES[req.language.toLowerCase()];
    if (!langConfig) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${req.language}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        exitCode: 1,
        durationMs: 0,
        timedOut: false,
      };
    }

    const hasDocker = this.checkDocker();
    if (hasDocker) {
      return this.executeInDocker(req, langConfig);
    } else {
      return this.executeLocally(req, langConfig);
    }
  }

  /**
   * Sandboxed Docker Container Execution
   */
  private static async executeInDocker(
    req: ExecutionRequest,
    langConfig: (typeof SUPPORTED_LANGUAGES)[string]
  ): Promise<ExecutionResult> {
    const containerId = `exec-${uuidv4().substring(0, 8)}`;
    const startTime = Date.now();

    const codeBase64 = Buffer.from(req.code, 'utf-8').toString('base64');
    const stdinBase64 = Buffer.from(req.stdin || '', 'utf-8').toString('base64');

    const runnerScript = `
set -e
echo "${codeBase64}" | base64 -d > "${langConfig.filename}"
echo "${stdinBase64}" | base64 -d > /sandbox/stdin.txt
${langConfig.runCommand} < /sandbox/stdin.txt
`;

    const dockerArgs = [
      'run',
      '--rm',
      `--name=${containerId}`,
      '--network=none',
      `--memory=${config.execution.maxMemoryMb}m`,
      `--memory-swap=${config.execution.maxMemoryMb}m`,
      `--cpus=${config.execution.maxCpus}`,
      `--pids-limit=${config.execution.maxPids}`,
      '--tmpfs=/sandbox:rw,exec,nosuid,size=64m',
      '--user=1001:1001',
      '-w=/sandbox',
      config.runnerImage,
      'bash',
      '-c',
      runnerScript,
    ];

    logger.info(`[Docker Sandbox] Starting container [${containerId}] for [${langConfig.id}]`);

    return new Promise<ExecutionResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let isSettled = false;

      const child = spawn('docker', dockerArgs);

      const timer = setTimeout(() => {
        timedOut = true;
        logger.warn(`Execution container [${containerId}] timed out`);
        spawn('docker', ['kill', containerId]);
        child.kill('SIGKILL');
      }, config.execution.timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        if (stdout.length < config.execution.maxOutputLength) {
          stdout += chunk.toString('utf-8');
        }
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        if (stderr.length < config.execution.maxOutputLength) {
          stderr += chunk.toString('utf-8');
        }
      });

      child.on('error', (err) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: `Docker execution error: ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - startTime,
          timedOut: false,
          mode: 'docker-sandbox',
        });
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        if (timedOut) {
          stderr += `\n[Execution Timed Out: Limit ${config.execution.timeoutMs / 1000}s exceeded]`;
        }

        resolve({
          stdout,
          stderr,
          exitCode: timedOut ? 124 : code,
          durationMs: Date.now() - startTime,
          timedOut,
          mode: 'docker-sandbox',
        });
      });
    });
  }

  /**
   * Graceful Local Execution Fallback (Used when Docker is not installed/running)
   */
  private static async executeLocally(
    req: ExecutionRequest,
    langConfig: (typeof SUPPORTED_LANGUAGES)[string]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-exec-'));
    const filename = langConfig.filename;
    const sourceFilePath = path.join(tempDir, filename);

    fs.writeFileSync(sourceFilePath, req.code, 'utf-8');

    // Determine executable command inside the temp directory
    let cmd = '';
    const isWin = process.platform === 'win32';

    switch (langConfig.id) {
      case 'javascript':
        cmd = `node ${filename}`;
        break;
      case 'python':
        cmd = isWin ? `python ${filename}` : `python3 ${filename}`;
        break;
      case 'cpp':
        cmd = isWin
          ? `g++ -O2 ${filename} -o main.exe && main.exe`
          : `g++ -O2 ${filename} -o main.out && ./main.out`;
        break;
      case 'c':
        cmd = isWin
          ? `gcc -O2 ${filename} -o main.exe && main.exe`
          : `gcc -O2 ${filename} -o main.out && ./main.out`;
        break;
      case 'go':
        cmd = `go run ${filename}`;
        break;
      case 'rust':
        cmd = isWin
          ? `rustc -O ${filename} -o main.exe && main.exe`
          : `rustc -O ${filename} -o main.out && ./main.out`;
        break;
      default:
        cmd = `node ${filename}`;
    }

    logger.info(`[Local Fallback] Executing command [${cmd}] in: ${tempDir}`);

    return new Promise<ExecutionResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let isSettled = false;

      const shell = isWin ? 'cmd.exe' : '/bin/bash';
      const shellArgs = isWin ? ['/c', cmd] : ['-c', cmd];

      const child = spawn(shell, shellArgs, {
        cwd: tempDir,
      });

      // Write stdin if provided
      if (req.stdin) {
        child.stdin?.write(req.stdin);
      }
      child.stdin?.end();

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, config.execution.timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf-8');
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf-8');
      });

      const cleanup = () => {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup errors
        }
      };

      child.on('error', (err) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          stdout: '',
          stderr: `Local runner error: ${err.message}.`,
          exitCode: 1,
          durationMs: Date.now() - startTime,
          timedOut: false,
          mode: 'local-fallback',
        });
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        cleanup();

        if (timedOut) {
          stderr += `\n[Execution Timed Out: Limit ${config.execution.timeoutMs / 1000}s exceeded]`;
        }

        const fallbackNotice = `\n[ℹ️ Local Fallback Mode: Docker Desktop is not detected]`;

        resolve({
          stdout,
          stderr: stderr ? `${stderr}${fallbackNotice}` : '',
          exitCode: timedOut ? 124 : code,
          durationMs: Date.now() - startTime,
          timedOut,
          mode: 'local-fallback',
        });
      });
    });
  }
}
