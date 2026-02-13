import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Set DNS servers to Cloudflare (1.1.1.1) to resolve potential SRV record issues
    dns.setServers(['1.1.1.1', '1.0.0.1']);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
