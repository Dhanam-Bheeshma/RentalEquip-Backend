require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:3000', // Local development
    'https://rentalequip-backend.onrender.com', // Your deployed backend
    'https://rentalequip-frontend-ui.netlify.app', // Your deployed frontend
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });

    try {
        await user.save();
        res.json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering user.', error });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token, userId: user._id });
});

// Add product endpoint
app.post('/add-product', async (req, res) => {
    const { name, category, pricePerDay, image } = req.body;
    const newProduct = new Product({ name, category, pricePerDay, image });

    try {
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error adding product', error });
    }
});

// Get products endpoint
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
});

// Update product endpoint
app.put('/products/:id', async (req, res) => {
    const { name, category, pricePerDay, image } = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name, category, pricePerDay, image },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error });
    }
});

// Delete product endpoint
app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting product', error });
    }
});

// Checkout Route
app.post('/checkout', async (req, res) => {
    const { userId, products } = req.body;

    if (!userId || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'userId and a non-empty products array are required' });
    }

    try {
        const newCart = new Cart({ userId, products });
        await newCart.save();
        res.status(201).json({ message: 'Cart saved successfully!', cart: newCart });
    } catch (error) {
        console.error('Error saving cart:', error);
        res.status(500).json({ message: 'Error saving cart', error: error.message });
    }
});

// Get User Cart
app.get('/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const cartItems = await Cart.find({ userId }); // Fetch all cart entries for the user
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user cart', error });
    }
});



// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
