const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // User identifier
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            pricePerDay: { type: Number, required: true },
            quantity: { type: Number, default: 1 }, // Default quantity
        },
    ],
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
