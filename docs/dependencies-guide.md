# 📦 Guia Completo de Dependências

## YouTube Audio Downloader - Documentação de Dependências

Este documento especifica todas as dependências do projeto, seus propósitos e como utilizá-las corretamente.

---

## 🚀 Dependências de Produção

### 🌐 **Servidor Web e Middleware**

#### **Express.js** (`express@^4.19.2`)

**Propósito**: Framework web minimalista para Node.js

**Uso no projeto**:

```typescript
import express from 'express';

const app = express();

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/download', downloadController);
```

**Funcionalidades utilizadas**:

- Servidor HTTP
- Middleware para JSON/URL-encoded
- Sistema de rotas
- Tratamento de requisições/respostas

---

#### **CORS** (`cors@^2.8.5`)

**Propósito**: Middleware para Cross-Origin Resource Sharing

**Uso no projeto**:

```typescript
import cors from 'cors';

// Configuração básica (desenvolvimento)
app.use(cors({ origin: '*' }));

// Configuração avançada (produção)
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Por que usar**: Permite que aplicações frontend consumam a API de diferentes domínios.

---

#### **Compression** (`compression@^1.7.4`)

**Propósito**: Middleware para compressão gzip/deflate

**Uso no projeto**:

```typescript
import compression from 'compression';

// Configuração básica
app.use(compression());

// Configuração avançada
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6, // Nível de compressão (1-9)
    threshold: 1024, // Só comprime se > 1KB
  })
);
```

**Benefícios**: Reduz o tamanho das respostas HTTP em até 70%.

---

#### **Helmet** (`helmet@^8.0.0`)

**Propósito**: Middleware de segurança para headers HTTP

**Uso no projeto**:

```typescript
import helmet from 'helmet';

// Configuração básica
app.use(helmet());

// Configuração customizada
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

**Headers configurados**: CSP, HSTS, X-Frame-Options, X-XSS-Protection, etc.

---

#### **Express Rate Limit** (`express-rate-limit@^7.4.1`)

**Propósito**: Middleware para rate limiting

**Uso no projeto**:

```typescript
import rateLimit from 'express-rate-limit';

// Rate limit geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit específico para downloads
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 downloads por minuto
  skipSuccessfulRequests: true,
});

app.use('/api/', generalLimiter);
app.use('/api/download', downloadLimiter);
```

---

### 🎵 **YouTube e Processamento de Áudio**

#### **@distube/ytdl-core** (`@distube/ytdl-core@^4.14.4`)

**Propósito**: Download de vídeos/áudio do YouTube

**Uso no projeto**:

```typescript
import ytdl from '@distube/ytdl-core';

// Obter informações do vídeo
const getVideoInfo = async (url: string) => {
  try {
    const info = await ytdl.getInfo(url);
    return {
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0].url,
      formats: info.formats.filter(format => format.hasAudio),
    };
  } catch (error) {
    throw new Error('URL inválida ou vídeo não disponível');
  }
};

// Download de áudio
const downloadAudio = async (
  url: string,
  quality: 'highest' | 'lowest' = 'highest'
) => {
  const info = await ytdl.getInfo(url);
  const audioFormat = ytdl.chooseFormat(info.formats, {
    quality: `${quality}audio`,
    filter: 'audioonly',
  });

  return ytdl(url, { format: audioFormat });
};
```

**Funcionalidades**:

- Extração de metadados
- Download de streams de áudio
- Seleção de qualidade
- Suporte a diferentes formatos

---

#### **Fluent FFmpeg** (`fluent-ffmpeg@^2.1.3`)

**Propósito**: Wrapper Node.js para FFmpeg

**Uso no projeto**:

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

// Conversão para MP3
const convertToMp3 = (
  inputStream: NodeJS.ReadableStream,
  outputPath: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .audioCodec('libmp3lame')
      .audioBitrate(320)
      .audioFrequency(44100)
      .format('mp3')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
};

// Conversão com progress
const convertWithProgress = (
  inputPath: string,
  outputPath: string,
  onProgress: (progress: number) => void
) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .format('mp3')
      .on('progress', progress => {
        onProgress(progress.percent || 0);
      })
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
};
```

---

#### **Node FFmpeg Installer** (`node-ffmpeg-installer@^1.1.2`)

**Propósito**: Instala FFmpeg automaticamente

**Uso no projeto**:

```typescript
import ffmpegInstaller from 'node-ffmpeg-installer';
import ffmpeg from 'fluent-ffmpeg';

// Configurar path do FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Verificar se FFmpeg está disponível
const checkFFmpeg = () => {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) reject(err);
      else resolve(formats);
    });
  });
};
```

---

### 🔄 **Sistema de Filas e Cache**

#### **BullMQ** (`bullmq@^5.28.2`)

**Propósito**: Sistema de filas baseado em Redis

**Uso no projeto**:

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';

// Configuração da conexão Redis
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Criar fila de downloads
const downloadQueue = new Queue('download-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100, // Manter apenas 100 jobs completos
    removeOnFail: 50, // Manter apenas 50 jobs falhados
    attempts: 3, // 3 tentativas
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Worker para processar downloads
const downloadWorker = new Worker(
  'download-queue',
  async job => {
    const { url, socketId, quality } = job.data;

    // Atualizar progresso
    job.updateProgress(10);

    // Processar download
    const result = await processDownload(url, quality, progress => {
      job.updateProgress(progress);
    });

    return result;
  },
  { connection: redisConnection }
);

// Eventos da fila
const queueEvents = new QueueEvents('download-queue', {
  connection: redisConnection,
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} concluído:`, returnvalue);
});
```

---

#### **IORedis** (`ioredis@^5.4.1`)

**Propósito**: Cliente Redis robusto para Node.js

**Uso no projeto**:

```typescript
import Redis from 'ioredis';

// Configuração básica
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Cache de metadados de vídeos
const cacheVideoInfo = async (videoId: string, info: any) => {
  await redis.setex(`video:${videoId}`, 3600, JSON.stringify(info)); // 1 hora
};

const getCachedVideoInfo = async (videoId: string) => {
  const cached = await redis.get(`video:${videoId}`);
  return cached ? JSON.parse(cached) : null;
};

// Tracking de downloads ativos
const trackActiveDownload = async (jobId: string, data: any) => {
  await redis.hset('active-downloads', jobId, JSON.stringify(data));
};

const removeActiveDownload = async (jobId: string) => {
  await redis.hdel('active-downloads', jobId);
};
```

---

### 🔌 **WebSocket e Tempo Real**

#### **Socket.IO** (`socket.io@^4.8.1`)

**Propósito**: WebSocket para comunicação em tempo real

**Uso no projeto**:

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Gerenciamento de conexões
io.on('connection', socket => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Jointar em room específico
  socket.on('join-download', downloadId => {
    socket.join(`download-${downloadId}`);
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Emitir progresso de download
const emitDownloadProgress = (downloadId: string, progress: number) => {
  io.to(`download-${downloadId}`).emit('download-progress', {
    downloadId,
    progress,
    timestamp: new Date().toISOString(),
  });
};

// Emitir conclusão de download
const emitDownloadComplete = (downloadId: string, result: any) => {
  io.to(`download-${downloadId}`).emit('download-complete', {
    downloadId,
    result,
    timestamp: new Date().toISOString(),
  });
};
```

---

### 🛠️ **Utilitários e Validação**

#### **Joi** (`joi@^17.13.3`)

**Propósito**: Validação de schemas e dados

**Uso no projeto**:

```typescript
import Joi from 'joi';

// Schema para validação de download
const downloadSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/)
    .required()
    .messages({
      'string.pattern.base': 'URL deve ser do YouTube',
      'string.uri': 'URL inválida',
    }),

  quality: Joi.string()
    .valid('highest', 'lowest', '128kbps', '192kbps', '320kbps')
    .default('highest'),

  format: Joi.string().valid('mp3', 'wav', 'flac').default('mp3'),
});

// Middleware de validação
const validateDownload = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = downloadSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  req.body = value;
  next();
};
```

---

#### **UUID** (`uuid@^10.0.0`)

**Propósito**: Geração de identificadores únicos

**Uso no projeto**:

```typescript
import { v4 as uuidv4, v1 as uuidv1 } from 'uuid';

// ID para jobs de download
const createDownloadJob = async (url: string) => {
  const jobId = uuidv4();
  const downloadId = uuidv4();

  return {
    jobId,
    downloadId,
    url,
    createdAt: new Date().toISOString(),
  };
};

// ID para sessões de usuário
const createUserSession = () => {
  return {
    sessionId: uuidv1(), // v1 inclui timestamp
    userId: uuidv4(),
  };
};
```

---

#### **Sanitize Filename** (`sanitize-filename@^1.6.3`)

**Propósito**: Sanitização de nomes de arquivos

**Uso no projeto**:

```typescript
import sanitize from 'sanitize-filename';

// Sanitizar títulos de vídeos para nomes de arquivo
const createSafeFilename = (videoTitle: string, extension: string = 'mp3') => {
  const sanitized = sanitize(videoTitle, {
    replacement: '_', // Substituir caracteres inválidos por _
  });

  // Limitar tamanho do nome
  const maxLength = 200;
  const truncated =
    sanitized.length > maxLength
      ? sanitized.substring(0, maxLength)
      : sanitized;

  return `${truncated}.${extension}`;
};

// Exemplo de uso
const filename = createSafeFilename(
  'Música: "Título" com / caracteres especiais!'
);
// Resultado: "Música_ _Título_ com _ caracteres especiais!.mp3"
```

---

#### **Dotenv** (`dotenv@^16.4.7`)

**Propósito**: Carregamento de variáveis de ambiente

**Uso no projeto**:

```typescript
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env
config();

// Configuração com validação
const envConfig = {
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  MAX_DOWNLOAD_SIZE: parseInt(process.env.MAX_DOWNLOAD_SIZE || '104857600'), // 100MB
  DOWNLOAD_DIR: process.env.DOWNLOAD_DIR || './downloads',
};

// Validação de variáveis obrigatórias
const requiredEnvVars = ['REDIS_HOST'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`
  );
}
```

---

### 📝 **Logging**

#### **Pino** (`pino@^9.6.0`)

**Propósito**: Logger de alta performance

**Uso no projeto**:

```typescript
import pino from 'pino';

// Configuração do logger (já implementado em logger.ts)
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => ({ level: label.toUpperCase() }),
  },
});

// Uso em diferentes contextos
logger.info({ port: 3000 }, 'Servidor iniciado');
logger.warn({ attempt: 2 }, 'Tentativa de reconexão');
logger.error({ error: err.message }, 'Erro no download');

// Logger contextual
const downloadLogger = logger.child({ module: 'download' });
downloadLogger.info({ videoId: 'abc123' }, 'Iniciando download');
```

#### **Pino Pretty** (`pino-pretty@^13.0.0`)

**Propósito**: Formatação bonita para logs de desenvolvimento

Configurado automaticamente no transport do pino para ambiente de desenvolvimento.

---

## 🔧 Dependências de Desenvolvimento

### **TypeScript e Build**

#### **TypeScript** (`typescript@^5.7.2`)

**Propósito**: Superset JavaScript com tipagem estática

**Configuração**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@application/*": ["application/*"]
    }
  }
}
```

---

#### **TSup** (`tsup@^8.3.5`)

**Propósito**: Bundler TypeScript rápido baseado em esbuild

**Configuração**:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  sourcemap: true,
  minify: true,
  external: ['fluent-ffmpeg'],
});
```

---

#### **TSX** (`tsx@^4.19.2`)

**Propósito**: Execução TypeScript com hot reload

**Uso**:

```bash
# package.json scripts
"dev": "tsx watch src/index.ts"
```

---

#### **TSConfig Paths** (`tsconfig-paths@^4.2.0`)

**Propósito**: Suporte a path mapping em runtime

**Configuração**:

```typescript
// No início do arquivo principal
import 'tsconfig-paths/register';
```

---

### **Testes**

#### **Jest** (`jest@^29.7.0`)

**Propósito**: Framework de testes

**Exemplo de teste**:

```typescript
// tests/download.test.ts
import { DownloadService } from '@application/download-service';

describe('DownloadService', () => {
  let downloadService: DownloadService;

  beforeEach(() => {
    downloadService = new DownloadService();
  });

  test('deve validar URL do YouTube', async () => {
    const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await downloadService.validateUrl(validUrl);

    expect(result.isValid).toBe(true);
  });

  test('deve rejeitar URL inválida', async () => {
    const invalidUrl = 'https://example.com';
    const result = await downloadService.validateUrl(invalidUrl);

    expect(result.isValid).toBe(false);
  });
});
```

---

#### **Supertest** (`supertest@^7.0.0`)

**Propósito**: Testes de APIs HTTP

**Exemplo**:

```typescript
// tests/api.test.ts
import request from 'supertest';
import { app } from '../src/app';

describe('API Endpoints', () => {
  test('GET /api/health deve retornar status ok', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  test('POST /api/download deve validar URL', async () => {
    const response = await request(app)
      .post('/api/download')
      .send({ url: 'invalid-url' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
```

---

### **Linting e Formatação**

#### **ESLint** (`eslint@^9.17.0`)

**Propósito**: Linter para JavaScript/TypeScript

**Configuração**:

```javascript
// eslint.config.js
export default [
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
];
```

---

#### **Prettier** (`prettier@^3.4.2`)

**Propósito**: Formatador de código

**Configuração**:

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

### **Git e Commits**

#### **Husky** (`husky@^9.1.7`)

**Propósito**: Git hooks

**Configuração**:

```bash
# .husky/pre-commit
npm run lint
npm run type-check
npm test
```

#### **Commitlint** (`@commitlint/cli@^19.6.0`)

**Propósito**: Validação de mensagens de commit

**Configuração**:

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
      ],
    ],
  },
};
```

---

## 📋 Scripts do Package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts", // Desenvolvimento
    "build": "tsup", // Build produção
    "start": "node dist/index.js", // Executar produção
    "test": "jest", // Testes
    "test:watch": "jest --watch", // Testes em watch
    "test:coverage": "jest --coverage", // Cobertura de testes
    "lint": "eslint src/**/*.ts", // Verificar código
    "lint:fix": "eslint src/**/*.ts --fix", // Corrigir código
    "format": "prettier --write src/**/*.ts", // Formatar código
    "type-check": "tsc --noEmit", // Verificar tipos
    "clean": "rimraf dist", // Limpar build
    "prepare": "husky" // Configurar git hooks
  }
}
```

---

## 🎯 Resumo de Uso por Categoria

### **🏗️ Infraestrutura Base**

- Express + middlewares (CORS, Helmet, Compression)
- Rate limiting para proteção
- Logging estruturado com Pino

### **🎵 Processamento de Mídia**

- ytdl-core para extração do YouTube
- FFmpeg para conversão de áudio
- Sanitização de nomes de arquivos

### **⚡ Performance e Escalabilidade**

- BullMQ para sistema de filas
- Redis para cache e persistência
- Socket.IO para tempo real

### **🔒 Segurança e Validação**

- Joi para validação de dados
- Helmet para headers de segurança
- Rate limiting para proteção DDoS

### **🧪 Qualidade de Código**

- TypeScript para tipagem
- Jest para testes
- ESLint + Prettier para padronização
- Husky + Commitlint para git hooks

Esta documentação serve como referência completa para entender e utilizar todas as dependências do projeto de forma eficiente e segura.
