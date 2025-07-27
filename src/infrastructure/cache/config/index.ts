import { Redis } from 'ioredis';
import { config } from 'dotenv';

config();

const redisConfig = {
  maxRetriesPerRequest: null, // Necessário para BullMQ
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
};

const redis = new Redis(process.env.REDIS_URL as string, redisConfig);

export default redis;
