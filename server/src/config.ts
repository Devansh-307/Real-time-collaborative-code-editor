import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  runnerImage: process.env.DOCKER_RUNNER_IMAGE || 'collab-runner:latest',
  execution: {
    timeoutMs: parseInt(process.env.MAX_EXECUTION_TIME_MS || '6000', 10),
    maxMemoryMb: parseInt(process.env.MAX_MEMORY_MB || '128', 10),
    maxCpus: parseFloat(process.env.MAX_CPUS || '0.5'),
    maxPids: parseInt(process.env.MAX_PIDS || '64', 10),
    maxOutputLength: 100000, // 100KB output truncation limit
  },
};
