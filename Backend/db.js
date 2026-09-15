// Import mongoose
// Mongoose ki help se hum Node.js ko MongoDB se connect karenge
const mongoose = require("mongoose");


// MongoDB ka connection URL
// localhost      → MongoDB tumhare own laptop/PC par running hai
// 27017          → MongoDB ka default port
// inotebook      → Database ka naam
const mongoURI = "mongodb://localhost:27017/inotebook";


// Function to connect our application to MongoDB
// async use kiya hai because MongoDB connection asynchronous operation hai
const connectToMongo = async () => {

    try {

        // Connect to MongoDB using the connection URL
        // await wait karta hai jab tak connection establish nahi ho jata
        await mongoose.connect(mongoURI);

        // Ye message terminal mein tab dikhega
        // jab MongoDB connection successfully ho jayega
        console.log("Connected to Mongo Successfully");

    } catch (error) {

        // Agar MongoDB connection mein koi problem aaye
        // toh error terminal mein print hoga
        console.log("MongoDB connection error:", error);

    }
};


// Function ko export kar rahe hain
// Taaki index.js mein ise import karke call kar sakein
module.exports = connectToMongo;