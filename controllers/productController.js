import Product from '../models/productModel.js';

// @desc Fetch all products (For Users and Admin)
// @route GET /api/products
// @access Public
export const getProducts = async (req, res) => {
  const products = await Product.find({});
  res.json(products); // Any user (including admin) can view all products
};

// @desc Fetch single product by ID (For Users and Admin)
// @route GET /api/products/:id
// @access Public
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product); // Any user (including admin) can view a product's details
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// (Optional Additions for Admin below)

// @desc Create a new product (For Admin only)
// @route POST /api/products
// @access Admin
export const createProduct = async (req, res) => {
  const { title, price, description, category, image, rating, countInStock } = req.body;
  const product = new Product({ title, price, description, category, image, rating, countInStock });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct); // Only admin can create new products
};

// @desc Update product (For Admin only)
// @route PUT /api/products/:id
// @access Admin
export const updateProduct = async (req, res) => {
  const { title, price, description, category, image, rating, countInStock } = req.body;
  
  const product = await Product.findById(req.params.id);

  if (product) {
    product.title = title;
    product.price = price;
    product.description = description;
    product.category = category;
    product.image = image;
    product.rating = rating;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct); // Only admin can update product details
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc Delete a product (For Admin only)
// @route DELETE /api/products/:id
// @access Admin
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' }); // Only admin can delete products
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};
