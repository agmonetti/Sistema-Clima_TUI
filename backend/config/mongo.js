import mongoose from 'mongoose';


const HOST = process.env.MONGO_HOST;
const PORT = process.env.MONGO_PORT;
const USER = process.env.MONGO_USER;
const PASS = process.env.MONGO_PASSWORD;
const DB_NAME = 'clima_db';

const URI = `mongodb://${USER}:${PASS}@${HOST}:${PORT}/${DB_NAME}?authSource=admin`;
export const connectMongo = async () => {
  try {
    await mongoose.connect(URI);
  } catch (error) {
    process.exit(1);
  }
};