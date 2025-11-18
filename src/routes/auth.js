import express from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import handleValidationErrors from '../middleware/validation.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, authController.register);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, validateProfileUpdate, handleValidationErrors, authController.updateProfile);

export default router;

