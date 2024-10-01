import express from 'express';
import {deleteUser, forgetPassword, getUsers, login, register, resetPassword, updateUserToAdmin } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword)
// Admin routes (both protected and admin-only)
router.get('/', protect, getUsers);
router.delete('/:id', protect, deleteUser);
router.delete('/:id/admin', protect, updateUserToAdmin);
export default router;
