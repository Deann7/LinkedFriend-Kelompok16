import redis, { CACHE_TTL } from './redis';
import { NextResponse } from 'next/server';

/**
 * Cache keys for different types of data
 */
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_POSTS: (userId: string) => `user:posts:${userId}`,
  USER_FRIENDS: (userId: string) => `user:friends:${userId}`,
  POST: (postId: string) => `post:${postId}`,
  FEED: (userId: string) => `feed:${userId}`
};

/**
 * Generic function to cache data in Redis
 * @param key - The Redis key
 * @param data - The data to cache
 * @param ttl - Time to live in seconds
 */
export async function cacheData<T>(key: string, data: T, ttl: number = CACHE_TTL.PROFILE): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
    console.log(`Data cached at ${key} for ${ttl} seconds`);
  } catch (error) {
    console.error(`Failed to cache data at ${key}:`, error);
  }
}

/**
 * Generic function to get cached data from Redis
 * @param key - The Redis key
 * @returns The cached data or null if not found
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      console.log(`Cache hit for ${key}`);
      return JSON.parse(cachedData) as T;
    }
    console.log(`Cache miss for ${key}`);
    return null;
  } catch (error) {
    console.error(`Failed to get cached data from ${key}:`, error);
    return null;
  }
}

/**
 * Wraps a response with cache headers for NextResponse
 * @param data - The data to return
 * @param isCached - Whether the data was from cache
 * @returns NextResponse object with appropriate cache headers
 */
export function wrapResponseWithCacheInfo<T>(data: T, isCached: boolean): NextResponse {
  return NextResponse.json(
    { ...data, cached: isCached },
    {
      headers: {
        'X-Cache-Status': isCached ? 'HIT' : 'MISS',
        'X-Cache-Source': isCached ? 'redis' : 'database',
        'Cache-Control': isCached ? 'max-age=3600' : 'no-cache'
      }
    }
  );
}

/**
 * Invalidates cache for a specific user
 * @param userId - The user ID whose cache should be invalidated
 */
export async function invalidateUserCache(userId: string) {
  try {
    // Create a pattern to match all keys related to this user
    const userKeyPattern = `user:*:${userId}`;
    
    // Use SCAN to find all matching keys
    let cursor = '0';
    do {
      // The SCAN command returns a cursor and a list of keys matching the pattern
      const [newCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        userKeyPattern,
        'COUNT',
        100
      );
      
      cursor = newCursor;
      
      // If there are matching keys, delete them
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} cache entries for user ${userId}`);
      }
    } while (cursor !== '0'); // Continue until the cursor is 0
    
    // Also explicitly delete the profile cache which is most commonly used
    await redis.del(`user:profile:${userId}`);
    
    return true;
  } catch (error) {
    console.error('Failed to invalidate user cache:', error);
    // Don't throw the error, just log it and return false
    // This is a non-critical operation and shouldn't break the app flow
    return false;
  }
}

/**
 * Invalidates cache for a specific post
 * @param postId - The post ID whose cache should be invalidated
 */
export async function invalidatePostCache(postId: string) {
  try {
    await redis.del(`post:${postId}`);
    return true;
  } catch (error) {
    console.error('Failed to invalidate post cache:', error);
    return false;
  }
}

/**
 * Invalidates feed cache for a user
 * @param userId - The user ID whose feed cache should be invalidated
 */
export async function invalidateUserFeedCache(userId: string) {
  try {
    await redis.del(`feed:${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to invalidate feed cache:', error);
    return false;
  }
}

/**
 * Checks if Redis is connected and operational
 * @returns Redis status information
 */
export async function checkRedisStatus() {
  try {
    // Use PING command to check connection
    const pingResponse = await redis.ping();
    
    // Get Redis info for diagnostics
    const info = await redis.info();
    
    // Get cache statistics
    const userProfileKeys = await redis.keys('user:profile:*');
    const userFriendsKeys = await redis.keys('user:friends:*');
    const postKeys = await redis.keys('post:*');
    const feedKeys = await redis.keys('feed:*');
    
    return {
      connected: pingResponse === 'PONG',
      status: 'operational',
      serverInfo: info,
      cacheStats: {
        userProfiles: userProfileKeys.length,
        userFriends: userFriendsKeys.length,
        posts: postKeys.length,
        feeds: feedKeys.length,
        total: userProfileKeys.length + userFriendsKeys.length + postKeys.length + feedKeys.length
      },
      keys: {
        userProfiles: userProfileKeys,
        userFriends: userFriendsKeys,
        posts: postKeys,
        feeds: feedKeys
      }
    };
  } catch (error) {
    console.error('Redis status check failed:', error);
    return {
      connected: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
