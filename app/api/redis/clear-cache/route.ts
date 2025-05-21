import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserCache, CACHE_KEYS } from '@/utils/cache-helper';
import redis from '@/utils/redis';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'linkedfriend-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    
    // Get specific cache type from query param (if any)
    const url = new URL(request.url);
    const cacheType = url.searchParams.get('type');
    
    let result = 0;
    
    // Clear specific cache type or all user caches
    if (cacheType === 'profile') {
      const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
      result = await redis.del(cacheKey);
      console.log(`Profile cache cleared for user ${userId}`);
    } else if (cacheType === 'friends') {
      const cacheKey = CACHE_KEYS.USER_FRIENDS(userId);
      result = await redis.del(cacheKey);
      console.log(`Friends cache cleared for user ${userId}`);
    } else if (cacheType === 'posts') {
      const cacheKey = CACHE_KEYS.USER_POSTS(userId);
      result = await redis.del(cacheKey);
      console.log(`Posts cache cleared for user ${userId}`);
    } else if (cacheType === 'feed') {
      const cacheKey = CACHE_KEYS.FEED(userId);
      result = await redis.del(cacheKey);
      console.log(`Feed cache cleared for user ${userId}`);
    } else {
      // Clear all caches related to this user
      await invalidateUserCache(userId);
      result = 1; // At least one key was likely removed
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully', 
      keysRemoved: result,
      cacheType: cacheType || 'all'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}