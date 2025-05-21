import Redis from 'ioredis';

// Default to local Redis if REDIS_URL is not defined
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Define cache expiration times (in seconds)
export const CACHE_TTL = {
  PROFILE: 3600,  // 1 hour for user profiles
  POSTS: 300,     // 5 minutes for posts (can be added later)
  FRIENDS: 600    // 10 minutes for friend lists (can be added later)
};

// Create a Redis client
let redis: Redis;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement)
  let globalWithRedis = global as typeof global & {
    _redisClient?: Redis;
  };

  if (!globalWithRedis._redisClient) {
    globalWithRedis._redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000, // 10 seconds
    });
    
    // Log Redis connection errors
    globalWithRedis._redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    // Log when Redis is connected
    globalWithRedis._redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  redis = globalWithRedis._redisClient;
} else {
  // In production mode, it's best to not use a global variable
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000, // 10 seconds
  });
  
  // Log Redis connection errors
  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  // Log when Redis is connected
  redis.on('connect', () => {
    console.log('Connected to Redis');
  });
}

// Export the Redis client for use across the app
export default redis;
