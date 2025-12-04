import { createClient } from 'redis';

const HOST = process.env.REDIS_HOST;
const PORT = process.env.REDIS_PORT;
const REDIS_URL = `redis://${HOST}:${PORT}`;

const client = createClient({
  url: REDIS_URL
});

client.on('error', (err) => console.error('❌ [Redis] Error del Cliente:', err));
export const connectRedis = async () => {
  try {
    await client.connect();
  } catch (error) {
    process.exit(1); 
  }
};

export default client;
