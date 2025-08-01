# 🔧 Developer Guide

Este documento contém informações específicas para desenvolvedores que trabalham no projeto YouTube Audio Downloader.

## 🚀 Quick Start

### 1. Setup Automático

```bash
chmod +x setup.sh
./setup.sh
```

### 2. Setup Manual

```bash
# Instalar dependências
npm install

# Configurar Husky
npm run prepare

# Criar arquivo de ambiente
cp .env.example .env

# Buildar o projeto
npm run build
```

## 📝 Comandos de Desenvolvimento

### 🔧 Build & Development

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm start            # Executa versão buildada
```

### 🧪 Testing

```bash
npm test             # Executa todos os testes
npm run test:watch   # Testes em watch mode
npm run test:coverage # Relatório de cobertura
```

### 🎨 Code Quality

```bash
npm run lint         # Verifica ESLint
npm run lint:fix     # Corrige problemas automáticos
npm run format       # Formata código com Prettier
npm run type-check   # Verifica tipos TypeScript
```

## 🏗️ Estrutura de Arquivos

```
src/
├── domain/              # 🎯 Lógica de negócio
│   ├── entities/        # Entidades principais
│   ├── valueObjects/    # Objetos de valor
│   ├── repositories/    # Interfaces dos repositórios
│   └── services/        # Serviços de domínio
├── application/         # 📋 Casos de uso
│   ├── useCases/        # Use cases da aplicação
│   └── dtos/           # Data Transfer Objects
├── infrastructure/      # 🔧 Implementações externas
│   ├── repositories/   # Implementações concretas
│   ├── services/       # Serviços externos
│   └── queue/          # Sistema de filas
├── presentation/        # 🌐 Camada de apresentação
│   ├── controllers/    # Controllers REST
│   ├── middlewares/    # Middlewares Express
│   └── websocket/      # Handlers WebSocket
└── test/               # 🧪 Configurações de teste
```

## 🔄 Git Workflow

### Branches

- `main` - Produção (protegida)
- `develop` - Desenvolvimento (protegida)
- `feature/nome-da-feature` - Novas funcionalidades
- `bugfix/nome-do-bug` - Correções
- `chore/nome-da-tarefa` - Tarefas de manutenção

### Conventional Commits

```bash
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: formatação de código
refactor: refatora código existente
test: adiciona ou modifica testes
chore: tarefas de manutenção
```

### Pull Request Process

1. Crie uma branch a partir de `develop`
2. Faça suas alterações seguindo as convenções
3. Execute os testes: `npm test`
4. Execute o linting: `npm run lint`
5. Faça commit com conventional commits
6. Abra PR para `develop`
7. Aguarde review e aprovação
8. Merge será feito automaticamente

## 🧪 Testing Guidelines

### Estrutura de Testes

```
src/
├── domain/
│   ├── entities/
│   │   ├── Download.ts
│   │   └── Download.test.ts    # Testes unitários
│   └── services/
│       ├── UrlValidator.ts
│       └── UrlValidator.test.ts
└── test/
    ├── setup.ts               # Setup global
    ├── helpers/               # Helpers de teste
    └── fixtures/              # Dados mock
```

### Tipos de Teste

- **Unit Tests**: Testam classes e funções isoladamente
- **Integration Tests**: Testam interação entre módulos
- **E2E Tests**: Testam fluxo completo da aplicação

### Coverage Requirements

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## 🔧 Configurações

### TypeScript

- Configurado para ES2022
- Strict mode habilitado
- Path mapping configurado (`@/domain/*`)
- Decorators habilitados para DI

### ESLint

- Baseado em `@typescript-eslint/recommended`
- Regras específicas para DDD
- Integração com Prettier
- Limite de complexidade: 10

### Prettier

- Single quotes
- Trailing commas
- 80 caracteres por linha
- 2 espaços de indentação

## 🚀 CI/CD Pipeline

### GitHub Actions

O pipeline é executado em:

- Push para `main` ou `develop`
- Pull Requests

### Stages

1. **Quality** - ESLint, Prettier, TypeScript
2. **Test** - Jest com coverage
3. **Build** - tsup build
4. **Security** - npm audit + CodeQL
5. **Release** - Semantic release (apenas main)

### Secrets Necessários

- `GITHUB_TOKEN` - Automático (para releases e GitHub API)

## 🔴 Redis & Queue

### Desenvolvimento Local

```bash
# Instalar Redis
brew install redis      # macOS
apt-get install redis   # Ubuntu

# Iniciar Redis
redis-server

# Verificar conexão
redis-cli ping
```

### Queue Configuration

- **Max Concurrent**: 5 downloads simultâneos
- **Job TTL**: 60 minutos
- **Retry**: 3 tentativas com backoff exponencial

## 🎵 Audio Processing

### FFmpeg

Requerido para conversão de áudio:

```bash
# Instalar FFmpeg
brew install ffmpeg      # macOS
apt-get install ffmpeg   # Ubuntu
```

### Formatos Suportados

- **Output**: MP3 (primary)
- **Quality**: Best available from YouTube
- **Bitrate**: Variable (VBR)

## 🐛 Debugging

### VS Code Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/app.ts",
      "runtimeArgs": ["--loader", "tsx/esm"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Environment Variables

```bash
DEBUG=true               # Habilita logs debug
LOG_LEVEL=debug         # Nível de log
NODE_ENV=development    # Ambiente
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [BullMQ Guide](https://docs.bullmq.io/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Jest Testing](https://jestjs.io/docs/getting-started)

## 🤝 Getting Help

- 📋 Issues: Use GitHub Issues para bugs e features
- 💬 Discussions: Use GitHub Discussions para dúvidas
- 📧 Email: Para questões privadas

---

**Happy Coding! 🚀**
