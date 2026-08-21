import { useState, useCallback } from 'react';
import { SERVER_HTTP_URL } from '../utils/constants';
import { ExecutionResult, ExecutionStatus } from '../types';

export function useExecution() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const executeCode = useCallback(async (language: string, code: string, stdin?: string) => {
    setStatus('running');
    setResult(null);

    try {
      const response = await fetch(`${SERVER_HTTP_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, code, stdin }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.result) {
        const res: ExecutionResult = data.result;
        setResult(res);
        if (res.timedOut) {
          setStatus('timeout');
        } else if (res.exitCode !== 0) {
          setStatus('error');
        } else {
          setStatus('success');
        }
      } else {
        throw new Error(data.error || 'Failed to execute code');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown execution failure';
      setResult({
        stdout: '',
        stderr: `Failed to communicate with sandbox engine: ${msg}`,
        exitCode: 1,
        durationMs: 0,
        timedOut: false,
        error: msg,
      });
      setStatus('error');
    }
  }, []);

  const clearOutput = useCallback(() => {
    setResult(null);
    setStatus('idle');
  }, []);

  return {
    status,
    result,
    executeCode,
    clearOutput,
  };
}
