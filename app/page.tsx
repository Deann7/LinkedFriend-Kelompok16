import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">LinkedFriend</h1>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-600">
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight md:text-6xl">
                Welcome to <span className="text-blue-600">LinkedFriend</span>
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Connect with friends, colleagues, and opportunities. Build your professional network with LinkedFriend.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Join Now
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="rounded-lg shadow-xl overflow-hidden">
                <Image
                  className="w-full h-auto"
                  src="/vercel.svg"
                  alt="LinkedFriend network illustration"
                  width={500}
                  height={300}
                  priority
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Join LinkedFriend?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="rounded-md bg-blue-50 p-3 mb-4 inline-block">
                  <Image
                    src="/file.svg"
                    alt="Connection icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Connect</h4>
                <p className="text-gray-600">
                  Build your professional network and connect with colleagues, friends, and industry experts.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="rounded-md bg-blue-50 p-3 mb-4 inline-block">
                  <Image
                    src="/window.svg"
                    alt="Opportunity icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Discover</h4>
                <p className="text-gray-600">
                  Discover job opportunities and stay updated with the latest industry trends.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="rounded-md bg-blue-50 p-3 mb-4 inline-block">
                  <Image
                    src="/globe.svg"
                    alt="Growth icon"
                    width={24}
                    height={24}
                  />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Grow</h4>
                <p className="text-gray-600">
                  Develop your skills, share knowledge, and grow your professional reputation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} LinkedFriend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
