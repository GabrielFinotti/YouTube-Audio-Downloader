import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import logger from '@infrastructure/logging/logger';

config();

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

const startServer = async (): Promise<void> => {
  try {
    app.listen(process.env.PORT, () => {
      logger.info(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
  }
};

startServer();
