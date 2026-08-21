import { Router, Request, Response } from 'express';
import { DockerRunnerService } from '../services/docker-runner.js';
import { SUPPORTED_LANGUAGES } from '../services/languages.js';
import { logger } from '../utils/logger.js';

export const executeRouter = Router();

// GET /api/languages - Returns all supported languages & default templates
executeRouter.get('/languages', (_req: Request, res: Response) => {
  res.json({
    success: true,
    languages: Object.values(SUPPORTED_LANGUAGES).map((l) => ({
      id: l.id,
      name: l.name,
      monacoLanguage: l.monacoLanguage,
      defaultCode: l.defaultCode,
    })),
  });
});

// POST /api/execute - Execute code inside isolated Docker container
executeRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const { language, code, stdin } = req.body;

    if (!language || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: "language" (string) and "code" (string).',
      });
      return;
    }

    logger.info(`Received execution request for language [${language}], code length: ${code.length} chars`);

    const result = await DockerRunnerService.execute({
      language,
      code,
      stdin,
    });

    res.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown execution error';
    logger.error(`Execution error: ${message}`);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});
