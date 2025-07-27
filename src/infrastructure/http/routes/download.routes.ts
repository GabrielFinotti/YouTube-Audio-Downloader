import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { DownloadController } from '@infrastructure/http/controllers/download.controller.js';
import { validateDownload } from '@infrastructure/http/middleware/validation.middleware.js';

const router = Router();
const downloadController = new DownloadController();

// Rate limiting específico para downloads
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 downloads por minuto por IP
  message: {
    success: false,
    message: 'Limite de downloads atingido. Tente novamente em 1 minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para controle de jobs
const controlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 operações de controle por minuto
  message: {
    success: false,
    message: 'Muitas operacoes. Tente novamente em alguns segundos.',
  },
});

/**
 * @route POST /api/downloads
 * @desc Inicia um novo download de áudio
 * @access Public
 */
router.post('/', downloadLimiter, validateDownload, (req, res) => {
  downloadController.createDownload(req, res);
});

/**
 * @route GET /api/downloads/:jobId
 * @desc Obtém o status de um job de download
 * @access Public
 */
router.get('/:jobId', controlLimiter, (req, res) => {
  downloadController.getJobStatus(req, res);
});

/**
 * @route PUT /api/downloads/:jobId/pause
 * @desc Pausa um download em andamento
 * @access Public
 */
router.put('/:jobId/pause', controlLimiter, (req, res) => {
  downloadController.pauseJob(req, res);
});

/**
 * @route PUT /api/downloads/:jobId/resume
 * @desc Retoma um download pausado
 * @access Public
 */
router.put('/:jobId/resume', controlLimiter, (req, res) => {
  downloadController.resumeJob(req, res);
});

/**
 * @route DELETE /api/downloads/:jobId
 * @desc Cancela um download
 * @access Public
 */
router.delete('/:jobId', controlLimiter, (req, res) => {
  downloadController.cancelJob(req, res);
});

/**
 * @route GET /api/downloads/:jobId/file
 * @desc Faz download do arquivo de áudio
 * @access Public
 */
router.get('/:jobId/file', (req, res) => {
  downloadController.downloadFile(req, res);
});

/**
 * @route GET /api/downloads/queue/stats
 * @desc Obtém estatísticas da fila de downloads
 * @access Public
 */
router.get('/queue/stats', (req, res) => {
  downloadController.getQueueStats(req, res);
});

export { router as downloadRoutes, downloadController };
