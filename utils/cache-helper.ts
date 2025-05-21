import redis from './redis';

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
