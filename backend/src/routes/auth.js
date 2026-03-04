const { Router } = require('express');
const { register, login, getMe, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.post('/logout',          logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               authenticate, getMe);

module.exports = router;
