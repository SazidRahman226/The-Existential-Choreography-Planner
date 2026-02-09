import express from 'express';
import { register, login, refresh, logoutUser, getProfile, updateProfile, checkUsername, forgotPasswordController, resetPasswordController, getAllUsers, updateUserRole, updateUserStatus } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/check-username/:username', checkUsername);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password/:token', resetPasswordController);

import upload from '../middleware/upload.js';

// ... (existing imports)

// Protected routes
router.post('/logout', authenticateJWT, logoutUser);
router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, upload.single('avatar'), updateProfile);

// Admin Routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);
router.put('/users/:id/role', authenticateJWT, isAdmin, updateUserRole);
router.put('/users/:id/status', authenticateJWT, isAdmin, updateUserStatus);

export default router;
