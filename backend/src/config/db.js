import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studiq');
    console.log(`[Database] MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failure: ${error.message}`);
    // Do not crash the server in local dev sync fallback mode, but log it clearly
  }
};

export default connectDB;
