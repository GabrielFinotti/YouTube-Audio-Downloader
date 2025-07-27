# 🎵 YouTube Audio Downloader API

Uma API REST moderna e robusta para download de áudio do YouTube com gerenciamento de filas e WebSocket para progresso em tempo real.

[![Build Status](https://github.com/GabrielFinotti/YouTube-Audio-Downloader/workflows/CI/badge.svg)](https://github.com/GabrielFinotti/YouTube-Audio-Downloader/actions)
[![Coverage Status](https://codecov.io/gh/GabrielFinotti/YouTube-Audio-Downloader/branch/main/graph/badge.svg)](https://codecov.io/gh/GabrielFinotti/YouTube-Audio-Downloader)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)

## ✨ Características

- 🎯 **Download de Áudio de Alta Qualidade** - Suporte para múltiplos formatos (MP3, AAC, OGG)
- 🔄 **Gerenciamento de Filas** - Sistema de filas com BullMQ e Redis para processamento assíncrono
- ⚡ **WebSocket em Tempo Real** - Progresso de download em tempo real via Socket.IO
- �️ **Segurança Robusta** - Rate limiting, validação de entrada e tratamento de erros
- � **Monitoramento** - Logs estruturados com Pino e métricas de performance
- 🏗️ **Arquitetura Limpa** - Domain-Driven Design com TypeScript
- � **Configuração Flexível** - Configuração via variáveis de ambiente
- 🚀 **Performance Otimizada** - Compressão, cache e processamento eficiente

## 🏗️ Arquitetura

O projeto segue os princípios da **Arquitetura Limpa** e **Domain-Driven Design**:

```
src/
├── domain/                 # Regras de negócio e entidades
│   ├── entities/          # Entidades do domínio
│   ├── repositories/      # Interfaces dos repositórios
│   └── services/         # Interfaces dos serviços
├── application/           # Casos de uso e DTOs
│   ├── dtos/             # Data Transfer Objects
│   └── use-cases/        # Casos de uso da aplicação
└── infrastructure/       # Implementações técnicas
    ├── cache/            # Redis e BullMQ
    ├── http/             # Controllers, rotas e middleware
    ├── logging/          # Sistema de logs
    └── youtube/          # Implementação do serviço YouTube
```

## 🚀 Instalação e Execução

### Pré-requisitos

- **Node.js** 18+
- **Redis** (para filas e cache)
- **FFmpeg** (instalado automaticamente)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/GabrielFinotti/YouTube-Audio-Downloader.git
cd YouTube-Audio-Downloader

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Configuração

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Servidor
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000

# Logs
LOG_LEVEL=info
```

### Executar

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start

# Testes
npm test
npm run test:coverage
```

## 📡 API Endpoints

### Health Check

```
GET /api/health
```

Verifica o status da API.

### Downloads

#### Criar Download

```
POST /api/downloads
Content-Type: application/json
X-Socket-ID: <socket-id>

{
  "url": "https://youtube.com/watch?v=...",
  "quality": "highest",  // "highest" | "192" | "128" | "64"
  "format": "mp3"        // "mp3" | "aac" | "ogg"
}
```

#### Status do Job

```
GET /api/downloads/:jobId
```

#### Controle de Jobs

```
PUT /api/downloads/:jobId/pause    # Pausar
PUT /api/downloads/:jobId/resume   # Retomar
DELETE /api/downloads/:jobId       # Cancelar
```

#### Download do Arquivo

```
GET /api/downloads/:jobId/file
```

#### Estatísticas da Fila

```
GET /api/downloads/queue/stats
```

## 🔌 WebSocket Events

### Cliente → Servidor

```javascript
// Conectar ao job específico
socket.emit('join-download', jobId);

// Sair do job
socket.emit('leave-download', jobId);

// Ping/Pong para manter conexão
socket.emit('ping');
```

### Servidor → Cliente

```javascript
// Progresso do download
socket.on('download-progress', (data) => {
  console.log(`Progresso: ${data.progress}%`);
  console.log(`Velocidade: ${data.speed}`);
  console.log(`Tempo estimado: ${data.estimatedTime}`);
});

// Job iniciado
socket.on('download-started', (data) => {
  console.log(`Download iniciado: ${data.jobId}`);
});

// Job concluído
socket.on('download-completed', (data) => {
  console.log(`Download concluído: ${data.jobId}`);
});

// Job com erro
socket.on('download-failed', (data) => {
  console.log(`Erro: ${data.error}`);
});

// Resposta do ping
socket.on('pong');
```

## 🛡️ Rate Limiting

### Limites Aplicados

- **Geral**: 100 requests por 15 minutos por IP
- **Downloads**: 5 downloads por minuto por IP
- **Controle**: 30 operações por minuto por IP

### Headers de Rate Limit

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
```

## 📊 Monitoramento e Logs

### Logs Estruturados

A API utiliza **Pino** para logs estruturados em JSON:

```json
{
  "level": 30,
  "time": 1640995200000,
  "msg": "Download iniciado com sucesso",
  "jobId": "uuid-here",
  "url": "https://youtube.com/...",
  "socketId": "socket-id"
}
```

### Métricas Disponíveis

- Jobs na fila (waiting, active, completed, failed)
- Tempo de processamento
- Taxa de sucesso/falha
- Uso de memória e CPU

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Lint
npm run lint
npm run lint:fix
```

## 🚀 Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 3001

CMD ["node", "dist/app.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis
      - NODE_ENV=production
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🔧 Scripts Disponíveis

```json
{
  "dev": "tsx watch src/app.ts",
  "build": "tsup",
  "start": "node dist/app.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint src/**/*.ts",
  "lint:fix": "eslint src/**/*.ts --fix",
  "type-check": "tsc --noEmit",
  "clean": "rimraf dist"
}
```

## 🛠️ Tecnologias Utilizadas

### Core

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework web minimalista

### Arquitetura & Patterns

- **Domain-Driven Design** - Modelagem do domínio
- **Clean Architecture** - Separação de responsabilidades
- **SOLID Principles** - Princípios de design de software

### Infraestrutura

- **BullMQ** - Gerenciamento de filas
- **Redis** - Cache e persistência de filas
- **Socket.IO** - WebSocket em tempo real
- **Pino** - Logging estruturado

### Audio Processing

- **@distube/ytdl-core** - Download do YouTube
- **fluent-ffmpeg** - Processamento de áudio
- **node-ffmpeg-installer** - FFmpeg automático

### Segurança & Validação

- **Helmet** - Headers de segurança
- **express-rate-limit** - Rate limiting
- **Joi** - Validação de esquemas
- **CORS** - Configuração de CORS

### Desenvolvimento

- **Jest** - Framework de testes
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Husky** - Git hooks
- **tsup** - Bundler TypeScript

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções

- **Commits**: Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- **Code Style**: ESLint + Prettier
- **Tests**: Cobertura mínima de 80%
- **TypeScript**: Strict mode habilitado

## 📝 Changelog

### v0.1.0 (2025-01-26)

#### ✨ Features

- Sistema completo de download de áudio do YouTube
- API REST com TypeScript e Clean Architecture
- WebSocket para progresso em tempo real
- Sistema de filas com BullMQ e Redis
- Rate limiting e validação robusta
- Logs estruturados com Pino
- Suporte a múltiplos formatos de áudio
- Controle de jobs (pausar, retomar, cancelar)
- Métricas e monitoramento
- Testes unitários com Jest

#### 🛡️ Security

- Headers de segurança com Helmet
- Validação de entrada com Joi
- Rate limiting por IP
- Sanitização de nomes de arquivo
- CORS configurável

#### 🏗️ Architecture

- Domain-Driven Design
- Dependency Injection
- Repository Pattern
- Use Cases Pattern
- Clean Architecture layers

## � Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Gabriel Finotti**

- GitHub: [@GabrielFinotti](https://github.com/GabrielFinotti)
- LinkedIn: [Gabriel Finotti](https://linkedin.com/in/gabriel-finotti)

## 🙏 Agradecimentos

- [ytdl-core](https://github.com/distube/ytdl-core) pela biblioteca de download
- [BullMQ](https://github.com/taskforcesh/bullmq) pelo sistema de filas
- [Socket.IO](https://socket.io/) pela comunicação em tempo real
- Comunidade open source por todas as ferramentas incríveis

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
