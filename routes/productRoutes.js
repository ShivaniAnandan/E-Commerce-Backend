import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts);
router.route('/:id').get(getProductById);
// Admin routes (both protected and admin-only)
router.route('/').post(protect, createProduct);
router.route('/:id').put(protect, updateProduct);
router.route('/:id').delete(protect, deleteProduct);

export default router;
