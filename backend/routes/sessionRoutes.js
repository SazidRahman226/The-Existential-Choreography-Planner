import express from 'express';
import { getSessions, createSession, updateSession, deleteSession } from '../controllers/sessionController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getSessions);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
