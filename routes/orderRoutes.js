import express from 'express';
import { confirmOrder, createPaymentIntent, getMyOrders, getOrders, updateOrderToDelivered } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/create-payment-intent').post(createPaymentIntent);
router.route('/confirm').post(confirmOrder)
// Admin routes (both protected and admin-only)
router.route('/').get(protect, getOrders);
router.route('/:id/deliver').post(protect, updateOrderToDelivered);
export default router;
