import { NextResponse } from 'next/server';
import { checkRedisStatus } from '@/utils/cache-helper';

export async function GET() {
  try {
    // Use the checkRedisStatus helper to get comprehensive Redis information
    const redisStatus = await checkRedisStatus();
      if (redisStatus.connected) {
      return NextResponse.json({
        success: true,
        redis: {
          connected: true,
          userProfilesInCache: redisStatus.cacheStats?.userProfiles || 0,
          keys: redisStatus.keys?.userProfiles || [],
          serverInfo: redisStatus.serverInfo,
          cacheStats: redisStatus.cacheStats || { total: 0 }
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        redis: {
          connected: false,
          status: redisStatus.status,
          error: redisStatus.error
        },
        message: 'Redis is not connected'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Redis status error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check Redis status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}