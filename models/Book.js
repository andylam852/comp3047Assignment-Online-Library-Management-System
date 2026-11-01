const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    location: { type: String },
    isHighlighted: { type: Boolean, default: false },
    year: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);