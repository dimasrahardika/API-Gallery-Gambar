const { Router } = require('express');
const imageController = require('../../../controllers/imageController');
const upload = require('../../../middlewares/upload');
const { protect, restrictTo } = require('../../../middlewares/auth');

const router = Router();

// Rute publik - hanya untuk mendapatkan gambar
router.get('/', imageController.getAllImages);
router.get('/:id', imageController.getImageById);

// Rute yang terproteksi - memerlukan autentikasi
router.post('/', protect, upload.single('image'), imageController.uploadImage);
router.delete('/:id', protect, imageController.deleteImage);

module.exports = router;