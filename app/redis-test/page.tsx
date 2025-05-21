'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedisStatusType {
  connected: boolean;
  userProfilesInCache: number;
  keys: string[];
  serverInfo: string;
}

export default function RedisTest() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestTime, setRequestTime] = useState<number>(0);
  const [isCached, setIsCached] = useState<boolean | null>(null);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [redisStatus, setRedisStatus] = useState<RedisStatusType | null>(null);

  // Load token from localStorage on component mount and check Redis status
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    
    // Check Redis status on page load
    checkRedisStatus();
  }, []);
  
  // Check Redis status
  const checkRedisStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/redis/status');
      const data = await response.json();
      
      if (data.success) {
        setRedisStatus(data.redis);
      } else {
        setError(data.message || 'Failed to check Redis status');
      }    } catch (err: unknown) {
      console.error('Error checking Redis status:', err);
      setError('Failed to connect to Redis server');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!token) {
      setError('No authentication token found. Please log in first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const endTime = performance.now();
      setRequestTime(endTime - startTime);
      
      const data = await response.json();
      setRequestCount(prev => prev + 1);
      
      if (data.success) {
        setProfileData(data.user);
        setIsCached(data.cached === true);
        // After a successful profile fetch, refresh Redis status
        checkRedisStatus();
      } else {
        setError(data.message || 'Failed to fetch profile');
      }    } catch (err: unknown) {
      console.error('Error fetching profile:', err);
      setError('Error fetching profile data');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!token) {
      setError('No authentication token found. Please log in first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/redis/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Cache cleared successfully!');
        // After clearing cache, refresh Redis status
        checkRedisStatus();
      } else {
        setError(data.message || 'Failed to clear cache');
      }    } catch (err: unknown) {
      console.error('Error clearing cache:', err);
      setError('Error clearing cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Redis Cache Test</h1>
      
      {/* Redis Status Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Redis Status</h2>
        {redisStatus ? (
          <div>
            <p>
              Connection Status: {' '}
              {redisStatus.connected ? (
                <span className="text-green-500 font-bold">Connected ✓</span>
              ) : (
                <span className="text-red-500 font-bold">Not Connected ✗</span>
              )}
            </p>
            <p>User Profiles in Cache: <span className="font-semibold">{redisStatus.userProfilesInCache}</span></p>
            {redisStatus.keys.length > 0 && (
              <div>
                <p className="mt-2 font-semibold">Cache Keys:</p>
                <ul className="list-disc list-inside">
                  {redisStatus.keys.map((key, index) => (
                    <li key={index} className="text-sm">{key}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Checking Redis connection...</p>
        )}
        <button 
          onClick={checkRedisStatus}
          disabled={loading}
          className="mt-3 bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Refresh Redis Status
        </button>
      </div>
      
      {!token && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>You need to log in first to test the Redis cache for user profiles.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={fetchProfile}
          disabled={loading || !token}
          className={`${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
        >
          {loading ? 'Loading...' : 'Fetch Profile'}
        </button>
        
        <button 
          onClick={clearCache}
          disabled={loading || !token}
          className={`${loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-700'} text-white font-bold py-2 px-4 rounded`}
        >
          Clear Cache
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
        <p>Requests made: <span className="font-bold">{requestCount}</span></p>
        <p>Last request time: <span className="font-bold">{requestTime.toFixed(2)} ms</span></p>
        <p>
          Cache status: 
          {isCached === null ? (
            <span className="text-gray-500"> No data yet</span>
          ) : isCached ? (
            <span className="text-green-500 font-bold"> HIT (Data from Redis)</span>
          ) : (
            <span className="text-blue-500 font-bold"> MISS (Data from Database)</span>
          )}
        </p>
      </div>
      
      {profileData && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">How to verify Redis caching:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click <strong>Fetch Profile</strong> to load your profile data (first request should be a MISS).</li>
          <li>Click it again - this time it should be a HIT and load much faster from Redis cache.</li>
          <li>Click <strong>Clear Cache</strong> to remove the cached data.</li>
          <li>Click <strong>Fetch Profile</strong> again - it should now be a MISS again and load from the database.</li>
        </ol>
      </div>
    </div>
  );
}