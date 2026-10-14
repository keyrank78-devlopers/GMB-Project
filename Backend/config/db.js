const mongoose = require("mongoose");
const User = require("../models/User");

const repairAccountIndexes = async () => {
    const indexes = await User.collection.indexes();
    const emailIndex = indexes.find((index) => index.name === "email_1");
    if (emailIndex && emailIndex.sparse !== true) {
        await User.collection.dropIndex("email_1");
    }
    await User.syncIndexes();
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        await repairAccountIndexes();
        console.log("✅ MongoDB database connected successfully.");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };