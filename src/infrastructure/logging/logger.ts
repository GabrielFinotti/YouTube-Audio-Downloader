import pino, { Logger } from 'pino';
import { config } from 'dotenv';

config();

/**
 * Configuração para ambiente de desenvolvimento
 */
const developmentConfig = {
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss - dd/mm/yyyy',
      ignore: 'pid,hostname',
      messageFormat: '[{level}] {msg}',
      customColors: 'info:green,warn:yellow,error:red',
    },
  },
};

/**
 * Configuração para ambiente de produção
 */
const productionConfig = {
  level: 'info',
  timestamp: (): string => {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour12: false });
    const date = now.toLocaleDateString('pt-BR');

    return `"${time} - ${date}"`;
  },
  formatters: {
    level: (label: string): { level: string } => ({
      level: label.toUpperCase(),
    }),
  },
};

/**
 * Cria e configura a instância do logger
 */
const createLogger = (): Logger => {
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? productionConfig : developmentConfig;

  return pino(config);
};

const logger = createLogger();

export default logger;
