import express from 'express';
import { register, login, refresh, logoutUser, getProfile, checkUsername, forgotPasswordController, resetPasswordController } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/check-username/:username', checkUsername);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password/:token', resetPasswordController);

// Protected routes
router.post('/logout', authenticateJWT, logoutUser);
router.get('/profile', authenticateJWT, getProfile);

export default router;
