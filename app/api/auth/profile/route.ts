import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import redis, { CACHE_TTL } from '@/utils/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'linkedfriend-secret-key';

export async function GET(request: NextRequest) {
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
    const cacheKey = `user:profile:${userId}`;
    
    // Try to get user profile from Redis cache
    const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
      console.log('Profile cache hit');
      return NextResponse.json(
        { success: true, user: JSON.parse(cachedUser), cached: true },
        { 
          headers: {
            'X-Cache-Status': 'HIT',
            'X-Cache-Source': 'redis',
            'Cache-Control': 'max-age=3600'
          }
        }
      );
    }
    
    console.log('Profile cache miss - fetching from database');

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    // Find user by id
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Return user data (excluding password)
    const userToReturn = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      jobTitle: user.jobTitle
    };
      // Store user profile in Redis cache
    await redis.set(cacheKey, JSON.stringify(userToReturn), 'EX', CACHE_TTL.PROFILE);

    return NextResponse.json(
      { success: true, user: userToReturn, cached: false },
      { 
        headers: {
          'X-Cache-Status': 'MISS',
          'X-Cache-Source': 'database',
          'Cache-Control': 'no-cache'
        }
      }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch profile' }, { status: 500 });
  }
}
