import express from 'express';
import dotenv from 'dotenv';
import connectDB from './database/config.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
connectDB();  // Connect to MongoDB

const app = express();

// Use CORS to allow requests from specific origins
app.use(cors({
  origin: ['http://localhost:5173', 'https://jocular-gaufre-15d016.netlify.app'], // Allow only your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  credentials: true, // If you are using cookies or sessions
}));


app.use(express.json()); // To parse incoming JSON requests

// Use cookie-parser middleware
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Welcome to the E-Commerce API');
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
