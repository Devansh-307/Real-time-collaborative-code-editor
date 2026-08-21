export interface UserInfo {
  name: string;
  color: string;
  id: string;
}

export interface UserPresence {
  clientId: number;
  user: UserInfo;
  cursor?: {
    line: number;
    column: number;
  };
}

export interface LanguageOption {
  id: string;
  name: string;
  monacoLanguage: string;
  defaultCode: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  error?: string;
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout';
