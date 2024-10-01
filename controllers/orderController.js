import Order from '../models/orderModel.js';
import sendEmail from '../utils/sendEmail.js'; // Import the sendEmail function
import Stripe from 'stripe';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc Create Stripe Payment Intent and Place Order
// @route POST /api/orders/create-payment-intent
// @access Private (Logged-in users only)
// export const createPaymentIntent = async (req, res) => {
//   const { orderItems, totalPrice } = req.body;

//   // Check if there are order items
//   if (orderItems && orderItems.length === 0) {
//     res.status(400).json({ message: 'No order items' });
//     return;
//   }

//   try {
//     // Calculate total amount in smallest currency unit (e.g., cents for USD)
//     const amount = totalPrice * 100; // Convert dollars to cents

//     // Create a payment intent with Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     res.status(200).json({
//       clientSecret: paymentIntent.client_secret, // Send client secret to frontend
//       paymentIntentId: paymentIntent.id
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
//   }
// };

export const createPaymentIntent = async (req, res) => {
  const { userId, orderItems } = req.body;

  // Check if there are order items
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items provided' });
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total amount
    const totalPrice = orderItems.reduce((total, item) => total + item.price * item.qty, 0);

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItems.map(item => ({
        price_data: {
          currency: 'inr', // Use INR
          product_data: {
            name: item.name, // Assuming item has a title
          },
          unit_amount: Math.round(item.price * item.qty * 100), // Convert to paise
        },
        quantity: item.qty,
      })),
      mode: 'payment',
      success_url: `${process.env.DOMAIN}/paymentsuccess`,
      cancel_url: `${process.env.DOMAIN}/paymentfailure`,
    });

    // Create an order (optional)
    const order = new Order({
      user: userId,
      orderItems,
      totalPrice,
      paymentStatus: 'pending',
      paymentIntentId: session.id,
    });

    // Save the order in the database
    await order.save();

    // Send confirmation email to the user
    const subject = 'Order Confirmation - Your Order Has Been Placed';
    const htmlContent = `
      <h2>Thank you for your order!</h2>
      <p>Your order ID: <strong>${order._id}</strong></p>
      <p>Total Price: <strong>${totalPrice} INR</strong></p>
      <p>We will notify you once your order is shipped.</p>
    `;
    await sendEmail(user.email, subject, htmlContent);

    // Send the session ID for redirecting to Stripe
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    // Handle Stripe errors or other possible errors
    if (error.raw && error.raw.message) {
      return res.status(400).json({ message: error.raw.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc Confirm Payment and Create New Order
// @route POST /api/orders/confirm
// @access Private (Logged-in users only)
// export const confirmOrder = async (req, res) => {
//   const { paymentIntentId, orderItems, totalPrice } = req.body;

//   try {
//     // Fetch the payment intent from Stripe
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     // Check if the payment was successful
//     if (paymentIntent.status === 'succeeded') {
//       // Deduct stock for each product
//       for (let item of orderItems) {
//         const product = await Product.findById(item.productId);

//         if (!product) {
//           res.status(404).json({ message: `Product ${item.title} not found` });
//           return;
//         }
//         if (product.countInStock < item.qty) {
//           res.status(400).json({ message: `Product ${item.title} is out of stock` });
//           return;
//         }

//         // Deduct product stock
//         product.countInStock -= item.qty;
//         await product.save();
//       }

//       // Create the new order
//       const order = new Order({
//         user: req.user._id, // User placing the order
//         orderItems,
//         totalPrice,
//         isPaid: true, // Mark order as paid
//         paidAt: Date.now(),
//       });

//       const createdOrder = await order.save();

//       // Send a confirmation email to the user
//       const subject = 'Order Confirmation - Your Order Has Been Placed';
//       const htmlContent = `
//         <h2>Thank you for your order!</h2>
//         <p>Your order ID: <strong>${createdOrder._id}</strong></p>
//         <p>Total Price: <strong>$${createdOrder.totalPrice}</strong></p>
//         <p>We will notify you once your order is shipped.</p>
//       `;

//       await sendEmail(req.user.email, subject, htmlContent);

//       // Return the created order to the user
//       res.status(201).json(createdOrder);
//     } else {
//       res.status(400).json({ message: 'Payment not confirmed or failed' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to confirm payment or place order', error: error.message });
//   }
// };
export const confirmOrder = async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  try {
    // Fetch the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if the payment was successful
    if (paymentIntent.status === 'succeeded') {
      // Find the order by ID
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Mark order as paid
      order.isPaid = true;
      order.paidAt = Date.now();
      await order.save();

      // Send a confirmation email to the user
      const subject = 'Payment Confirmation - Your Order Has Been Paid';
      const htmlContent = `
        <h2>Your payment was successful!</h2>
        <p>Your order ID: <strong>${order._id}</strong></p>
        <p>Total Price: <strong>${order.totalPrice} INR</strong></p>
        <p>Thank you for your purchase!</p>
      `;
      await sendEmail(order.user.email, subject, htmlContent);

      // Return the updated order
      res.status(200).json(order);
    } else {
      res.status(400).json({ message: 'Payment not confirmed or failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm payment or retrieve order', error: error.message });
  }
};


// @desc Create new order (For Users)
// @route POST /api/orders
// @access Private (Logged-in users only)
// export const addOrderItems = async (req, res) => {
//   const { orderItems, totalPrice } = req.body;

//   if (orderItems && orderItems.length === 0) {
//     res.status(400);
//     throw new Error('No order items'); // Error if order is empty
//   } else {
//     const order = new Order({
//       user: req.user._id, // User placing the order
//       orderItems,
//       totalPrice,
//     });

//     const createdOrder = await order.save();

//     // Calculate expected delivery date (e.g., 5 days from the order date)
//     const expectedDeliveryDate = new Date();
//     expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5);

//     // Email content for order confirmation
//     const subject = 'Order Confirmation - Your Order Has Been Placed';
//     const htmlContent = `
//       <h2>Thank you for your order!</h2>
//       <p>Your order ID: <strong>${createdOrder._id}</strong></p>
//       <p>Expected Delivery Date: <strong>${expectedDeliveryDate.toDateString()}</strong></p>
//       <p>Total Price: <strong>$${createdOrder.totalPrice}</strong></p>
//       <p>We will notify you once your order is shipped.</p>
//       <p>Thanks for shopping with us!</p>
//     `;

//     // Send confirmation email after the order is created
//     try {
//       await sendEmail(req.user.email, subject, htmlContent);
//       res.status(201).json(createdOrder); // Return the created order to the user
//     } catch (error) {
//       res.status(500).json({ message: 'Order created but failed to send confirmation email' });
//     }
//   }
// };


// @desc Get user orders (For Users)
// @route GET /api/orders/myorders
// @access Private (Logged-in users only)
export const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }); // Fetch orders for the logged-in user
    res.json(orders); // Return the user's orders
  };
  
  // (Optional Additions for Admin below)
  
  // @desc Get all orders (For Admin only)
  // @route GET /api/orders
  // @access Admin
  export const getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name'); // Admin can view all orders with user info
    res.json(orders); // Return all orders to the admin
  };
  
  // @desc Update order to delivered (For Admin only)
  // @route PUT /api/orders/:id/deliver
  // @access Admin
  export const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findById(req.params.id);
  
    if (order) {
      order.isDelivered = true; // Mark the order as delivered
      order.deliveredAt = Date.now();
  
      const updatedOrder = await order.save();
      res.json(updatedOrder); // Return the updated order to the admin
    } else {
      res.status(404);
      throw new Error('Order not found'); // Error if order is not found
    }
  };