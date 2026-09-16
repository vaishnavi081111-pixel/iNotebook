const mongoose = require("mongoose");

// MongoDB connection URL
// Local development → .env mein MONGO_URI
// Render production → Render Environment Variables mein MONGO_URI
const mongoURI = process.env.MONGO_URI;

// Function to connect our application to MongoDB
const connectToMongo = async () => {
    try {

        // Check whether MongoDB URI is configured
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        // Connect to MongoDB
        await mongoose.connect(mongoURI);

        console.log("Connected to Mongo Successfully");

    } catch (error) {

        console.log("MongoDB connection error:", error);

    }
};

module.exports = connectToMongo;