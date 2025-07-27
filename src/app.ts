import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

import {
  downloadRoutes,
  downloadController,
} from '@infrastructure/http/routes/download.routes.js';
import { validationErrorHandler } from '@infrastructure/http/middleware/validation.middleware.js';
import logger from '@infrastructure/logging/index.js';

// Carregar variáveis de ambiente
config();

const app = express();
const server = createServer(app);

// Configuração do Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Configurar Socket.IO no controller
downloadController.setSocketIO(io);

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Socket-ID'],
  })
);

// Compressão
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  })
);

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);

// Middlewares de parsing
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Middleware de log de requisições
app.use((req, _res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    'Nova requisicao HTTP'
  );
  next();
});

// Rotas da API
app.use('/api/downloads', downloadRoutes);

// Rota de health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'YouTube Audio Downloader API',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Middleware de erro de validação
app.use(validationErrorHandler);

// Middleware global de tratamento de erros
app.use((error: Error, req: Request, res: Response) => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    'Erro nao tratado na aplicacao'
  );

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack,
    }),
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota nao encontrada',
    path: req.originalUrl,
  });
});

// Configuração do Socket.IO
io.on('connection', socket => {
  logger.info({ socketId: socket.id }, 'Cliente conectado via WebSocket');

  socket.on('join-download', (jobId: string) => {
    socket.join(`download-${jobId}`);
    logger.info(
      { socketId: socket.id, jobId },
      'Cliente entrou no canal de download'
    );
  });

  socket.on('leave-download', (jobId: string) => {
    socket.leave(`download-${jobId}`);
    logger.info(
      { socketId: socket.id, jobId },
      'Cliente saiu do canal de download'
    );
  });

  socket.on('disconnect', reason => {
    logger.info({ socketId: socket.id, reason }, 'Cliente desconectado');
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Configurações do servidor
const PORT = parseInt(process.env.PORT || '3000');

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Iniciando shutdown graceful');

  server.close(() => {
    logger.info('Servidor HTTP fechado');
  });

  io.close(() => {
    logger.info('Servidor WebSocket fechado');
  });

  process.exit(0);
};

// Handlers para sinais de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handler para erros não capturados
process.on('uncaughtException', error => {
  logger.fatal(
    { error: error.message, stack: error.stack },
    'Excecao nao capturada'
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Promise rejeitada nao tratada');
  process.exit(1);
});

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    },
    'Servidor iniciado com sucesso'
  );

  logger.info('YouTube Audio Downloader API esta rodando com sucesso');
});
