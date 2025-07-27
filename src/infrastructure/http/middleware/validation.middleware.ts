import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '@infrastructure/logging/index.js';

// Schema para validação de download
const downloadSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/)
    .required()
    .messages({
      'string.pattern.base':
        'URL deve ser do YouTube (youtube.com ou youtu.be)',
      'string.uri': 'URL inválida',
      'any.required': 'URL é obrigatória',
    }),

  quality: Joi.string()
    .valid('highest', 'lowest', '128kbps', '192kbps', '320kbps')
    .default('highest')
    .messages({
      'any.only':
        'Qualidade deve ser: highest, lowest, 128kbps, 192kbps ou 320kbps',
    }),

  format: Joi.string().valid('mp3', 'wav', 'flac').default('mp3').messages({
    'any.only': 'Formato deve ser: mp3, wav ou flac',
  }),

  priority: Joi.number().integer().min(1).max(3).default(2).messages({
    'number.min': 'Prioridade deve ser entre 1 e 3',
    'number.max': 'Prioridade deve ser entre 1 e 3',
  }),
});

// Schema para validação de UUID
const uuidSchema = Joi.string()
  .guid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'ID do job deve ser um UUID válido',
    'any.required': 'ID do job é obrigatório',
  });

export const validateDownload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = downloadSchema.validate(req.body, {
    abortEarly: false, // Retornar todos os erros
    stripUnknown: true, // Remover campos desconhecidos
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    logger.warn(
      {
        validationErrors,
        body: req.body,
        ip: req.ip,
      },
      'Erro de validação no download'
    );

    res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: validationErrors,
    });
    return;
  }

  // Aplicar valores validados
  req.body = value;
  next();
};

export const validateJobId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = uuidSchema.validate(req.params.jobId);

  if (error) {
    logger.warn(
      {
        jobId: req.params.jobId,
        error: error.message,
        ip: req.ip,
      },
      'ID de job inválido'
    );

    res.status(400).json({
      success: false,
      message: 'ID do job inválido',
      error: error.message,
    });
    return;
  }

  next();
};

export const validateSocketId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const socketId = req.headers['x-socket-id'] as string;

  if (
    !socketId ||
    typeof socketId !== 'string' ||
    socketId.trim().length === 0
  ) {
    logger.warn(
      {
        socketId,
        headers: req.headers,
        ip: req.ip,
      },
      'Socket ID ausente ou inválido'
    );

    res.status(400).json({
      success: false,
      message: 'Header X-Socket-ID é obrigatório',
    });
    return;
  }

  next();
};

// Middleware global para capturar erros de validação
export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Se for erro de JSON malformado
  if (error instanceof SyntaxError && 'body' in error) {
    logger.warn(
      {
        error: error.message,
        body: req.body,
        ip: req.ip,
      },
      'JSON malformado recebido'
    );

    res.status(400).json({
      success: false,
      message: 'JSON inválido no corpo da requisição',
    });
    return;
  }

  // Se for erro de validação do Joi
  if (error.isJoi) {
    const validationErrors = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: validationErrors,
    });
    return;
  }

  next(error);
};
