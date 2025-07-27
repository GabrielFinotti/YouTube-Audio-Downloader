import { Redis } from 'ioredis';
import { config } from 'dotenv';

config();

const redis = new Redis(process.env.REDIS_URL as string);

export default redis;
