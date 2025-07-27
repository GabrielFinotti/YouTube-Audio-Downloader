# Guia de Uso do Logger Simplificado

## Configuração Implementada

O logger foi configurado de forma simples com apenas dois ambientes:

### **Development (NODE_ENV != 'production')**

- Logs coloridos com pino-pretty
- Timestamp formato brasileiro: `HH:MM:ss - dd/mm/yyyy`
- Níveis suportados: INFO (azul), WARN (amarelo), ERROR (vermelho)

### **Production (NODE_ENV = 'production')**

- Logs estruturados em JSON
- Timestamp formato brasileiro: `HH:MM:ss - dd/mm/yyyy`
- Metadata adicional: service, hostname, pid

## Uso Básico

```typescript
import { logger } from './infrastructure/logging';

// Logs básicos - apenas 3 níveis suportados
logger.info('Informação importante');
logger.warn('Aviso sobre algo');
logger.error('Erro ocorreu');
```

## Exemplos de Saída

### Development

```text
[18:30:04 - 26/07/2025] INFO: [30] 🚀 Server is running on port 3000
[18:30:04 - 26/07/2025] WARN: [40] This is a warning message
[18:30:04 - 26/07/2025] ERROR: [50] This is an error message
```

### Production

```json
{"level":"INFO","15:31:03 - 26/07/2025","pid":11252,"hostname":"Finotti_Dev","msg":"🚀 Server is running on port 3000"}
{"level":"WARN","15:31:03 - 26/07/2025","pid":11252,"hostname":"Finotti_Dev","msg":"This is a warning message"}
{"level":"ERROR","15:31:03 - 26/07/2025","pid":11252,"hostname":"Finotti_Dev","msg":"This is an error message"}
```

## Configuração via Variáveis de Ambiente

```env
NODE_ENV=production|development
PORT=3000
```

## Características

- ✅ **Simples**: Apenas 3 níveis de log
- ✅ **Timestamp BR**: Formato brasileiro padrão
- ✅ **Colorido**: Cores distintas para desenvolvimento
- ✅ **JSON**: Estruturado para produção
- ✅ **Leve**: Configuração mínima sem complexidade
