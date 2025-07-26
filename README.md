# 🎵 YouTube Audio Downloader API

[![Build Status](https://github.com/GabrielFinotti/YouTube-Audio-Downloader/workflows/CI/badge.svg)](https://github.com/GabrielFinotti/YouTube-Audio-Downloader/actions)
[![Coverage Status](https://codecov.io/gh/GabrielFinotti/YouTube-Audio-Downloader/branch/main/graph/badge.svg)](https://codecov.io/gh/GabrielFinotti/YouTube-Audio-Downloader)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

API REST moderna para download de áudio do YouTube com sistema de filas, WebSocket em tempo real e arquitetura DDD.

## ✨ Características

- 🚀 **Alta Performance**: Processamento de até 5 downloads simultâneos
- 📡 **Tempo Real**: Progresso via WebSocket com Socket.io
- 🏗️ **Arquitetura DDD**: Domain-Driven Design para escalabilidade
- 📦 **Queue System**: BullMQ + Redis para gerenciamento robusto
- 🎯 **TypeScript**: Tipagem estática e desenvolvimento seguro
- 🧪 **Testes**: Jest com cobertura completa
- 🔒 **Segurança**: Rate limiting, validação e sanitização
- 🎵 **Qualidade**: MP3 320kbps para máxima fidelidade

## 🛠️ Stack Tecnológica

- **Runtime**: Node.js 18+ com TypeScript
- **Framework**: Express.js
- **Build**: tsup + tsx para desenvolvimento rápido
- **Queue**: BullMQ + Redis
- **WebSocket**: Socket.io
- **Testes**: Jest + Supertest
- **Audio**: ytdl-core + FFmpeg
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## 🚀 Instalação

### Pré-requisitos

- Node.js 18.0.0 ou superior
- Redis 6.0 ou superior
- FFmpeg instalado no sistema

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/GabrielFinotti/YouTube-Audio-Downloader.git
cd YouTube-Audio-Downloader

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute o Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Inicie o desenvolvimento
npm run dev
```

## 📚 Documentação

Para informações detalhadas sobre o projeto, consulte nossa documentação:

- **[Guia de Dependências](./docs/dependencies-guide.md)** - Todas as dependências e como utilizá-las
- **[Sistema de Logging](./docs/logger-usage.md)** - Configuração e uso do logger

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Executar produção
npm start

# Testes
npm test
npm run test:watch
npm run test:coverage

# Linting e formatação
npm run lint
npm run lint:fix
npm run format

# Verificação de tipos
npm run type-check
```

## 🌐 API Endpoints

### Adicionar Download à Fila

```http
POST /api/downloads
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Resposta:**

```json
{
  "id": "uuid-v4",
  "status": "queued",
  "position": 3
}
```

### Verificar Status do Download

```http
GET /api/downloads/:id
```

**Resposta:**

```json
{
  "id": "uuid-v4",
  "status": "processing",
  "progress": 45,
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": "3:32",
    "thumbnail": "https://..."
  }
}
```

### Baixar Arquivo

```http
GET /api/downloads/:id/file
```

### Confirmar Download (Remove do Servidor)

```http
DELETE /api/downloads/:id
```

## 🔌 WebSocket Events

### Cliente → Servidor

```javascript
// Conectar ao namespace de downloads
const socket = io('/downloads');

// Monitorar progresso específico
socket.emit('subscribe', { downloadId: 'uuid-v4' });
```

### Servidor → Cliente

```javascript
// Progresso do download
socket.on('progress', data => {
  console.log(`${data.id}: ${data.progress}%`);
});

// Download concluído
socket.on('completed', data => {
  console.log(`Download pronto: ${data.id}`);
});

// Erro no download
socket.on('error', data => {
  console.error(`Erro: ${data.message}`);
});
```

## 🏗️ Arquitetura

```text
src/
├── domain/              # Entidades e regras de negócio
│   ├── entities/
│   ├── value-objects/
│   └── services/
├── application/         # Casos de uso
│   ├── use-cases/
│   ├── dtos/
│   └── mappers/
├── infrastructure/     # Implementações externas
│   ├── repositories/
│   ├── queue/
│   └── external/
└── interface/          # Controllers e WebSocket
    ├── http/
    ├── websocket/
    └── middleware/
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

### Estrutura de Testes

- **Unit Tests**: Testes de domínio e casos de uso
- **Integration Tests**: Testes de API e banco de dados
- **E2E Tests**: Testes completos de fluxo

## 🔧 Configuração

### Variáveis de Ambiente

| Variável            | Descrição             | Padrão        |
| ------------------- | --------------------- | ------------- |
| `NODE_ENV`          | Ambiente de execução  | `development` |
| `PORT`              | Porta do servidor     | `3000`        |
| `REDIS_HOST`        | Host do Redis         | `localhost`   |
| `REDIS_PORT`        | Porta do Redis        | `6379`        |
| `QUEUE_CONCURRENCY` | Downloads simultâneos | `5`           |
| `AUDIO_QUALITY`     | Qualidade do áudio    | `320`         |

### Redis

```bash
# Via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Via Docker Compose
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 📊 Monitoramento

### Health Check

```http
GET /health
```

### Métricas da Fila

```http
GET /api/queue/stats
```

### Logs

```bash
# Logs estruturados com Pino
npm start | pnpm dlx pino-pretty
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Commits Convencionais

Este projeto segue o padrão de [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Gabriel Finotti

- GitHub: [@GabrielFinotti](https://github.com/GabrielFinotti)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
