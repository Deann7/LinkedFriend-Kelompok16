'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  location: string;
  jobTitle: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user profile (in a real app, you would make an API call)
    // For now, we'll simulate by parsing the JWT token
    try {
      // This is just a simple example to extract user data from token
      // In a real app, you would make an API call to get the user profile
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      
      if (tokenData && tokenData.userId) {
        // Fetch user data from API
        fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then(data => {
          setUser(data.user);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          localStorage.removeItem('token');
          router.push('/login');
        });
      } else {
        // Invalid token
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p>Please wait while we load your profile</p>
        </div>
      </div>
    );
  }

  // Fallback in case user is null but isLoading is false
  if (!user) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p>Unable to load profile. Please <Link href="/login" className="text-blue-600">login</Link> again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">LinkedFriend</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Welcome back, {user.firstName}!</h2>
              <p className="text-gray-600 mt-1">This is your professional dashboard</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
              
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                  <p className="mt-1 text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Job Title</h4>
                  <p className="mt-1 text-gray-900">{user.jobTitle || 'Not specified'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p className="mt-1 text-gray-900">{user.location || 'Not specified'}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
