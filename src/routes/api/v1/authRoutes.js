// filepath: c:\laragon\www\API_GaleriGambar\src\routes\api\v1\authRoutes.js
const { Router } = require('express');
const authController = require('../../../controllers/authController');
const { protect } = require('../../../middlewares/auth');

const router = Router();

// Rute publik
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rute terproteksi
router.get('/me', protect, authController.getMe);

module.exports = router;