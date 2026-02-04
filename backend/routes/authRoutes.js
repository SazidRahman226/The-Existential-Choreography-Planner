import express from 'express';
import { register, login, refresh, logoutUser, getProfile, checkUsername } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/check-username/:username', checkUsername);

// Protected routes
router.post('/logout', authenticateJWT, logoutUser);
router.get('/profile', authenticateJWT, getProfile);

export default router;
