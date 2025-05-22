"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  location: string;
  jobTitle: string;
  status?: string; // Added optional status property
}

interface Friend extends UserProfile {
  status?: string; // 'friend', 'pending', 'received'
  requestId?: string; // Added for network connections with pending/received requests
  mutualFriends?: number; // Number of mutual friends (for network connections)
}

interface FriendRequest {
  _id: string;
  sender: UserProfile;
  recipient: UserProfile;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Notification {
  id: string;
  type: "friend_request" | "request_accepted" | "system";
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

// Tambahkan property image dan imageFile pada state editModal
type EditModalState = {
  open: boolean;
  postId?: string;
  content?: string;
  image?: string;
  imageFile?: File | null;
};

interface Comment {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    _id: string;
    image: string;
  };
  content: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Friends related states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Friend requests related states
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );

  // Notifications related states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Network related states
  const [networkConnections, setNetworkConnections] = useState<Friend[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [networkMessage, setNetworkMessage] = useState<string | null>(null);
  // Posts related states
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>({ open: false });
  // Sorting related states
  const [sortBy, setSortBy] = useState<"date" | "likes">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  // Comments related states
  const [newComments, setNewComments] = useState<{ [postId: string]: string }>({});
  const [allComments, setAllComments] = useState<{ [postId: string]: Comment[] }>({});
  const [showAllComments, setShowAllComments] = useState<{ [postId: string]: boolean }>({});

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user profile (in a real app, you would make an API call)
    // For now, we'll simulate by parsing the JWT token
    try {
      // This is just a simple example to extract user data from token
      // In a real app, you would make an API call to get the user profile
      const tokenData = JSON.parse(atob(token.split(".")[1]));

      if (tokenData && tokenData.userId) {
        // Fetch user data from API
        fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
          })
          .then((data) => {
            setUser(data.user);
            setIsLoading(false);
            // After loading profile, fetch notifications
            fetchNotifications();
          })
          .catch((err) => {
            console.error("Error fetching profile:", err);
            localStorage.removeItem("token");
            router.push("/login");
          });
      } else {
        // Invalid token
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);
  // Effect to fetch friends when tab changes
  useEffect(() => {
    if (activeTab === "friends" && user) {
      fetchFriends();
    }
    if (activeTab === "find-friends" && user) {
      fetchSuggestions();
    }
    if (activeTab === "friend-requests" && user) {
      fetchFriendRequests();
    }
    if (activeTab === "network" && user) {
      fetchNetworkConnections();
    }
    if (activeTab === "feed" && user) {
      fetchFeedPosts();
    }
  }, [activeTab, user]);

  // Effect to re-fetch posts when sorting options change
  useEffect(() => {
    if (activeTab === "feed" && user) {
      fetchFeedPosts();
    }
  }, [sortBy, sortOrder]);

  // Effect to fetch search results when search term changes
  useEffect(() => {
    if (activeTab === "feed" && posts.length > 0) {
      posts.forEach((post) => {
        if (!allComments[post._id]) {
          fetchComments(post._id);
        }
      });
    }
  }, [posts, activeTab]);

  // Effect to handle clicks outside of notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchFriends = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoadingFriends(true);
    try {
      const response = await fetch("/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch friends");

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
      addNotification({
        id: Date.now().toString(),
        type: "system",
        message: "Failed to load friends. Please try again later.",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const fetchSuggestions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/friends/suggestions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const fetchFriendRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoadingRequests(true);
    try {
      const response = await fetch("/api/friends/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch friend requests");

      const data = await response.json();
      setSentRequests(data.sentRequests || []);
      setReceivedRequests(data.receivedRequests || []);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to search users");

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSendingRequestTo(userId);
    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (!response.ok) throw new Error("Failed to send friend request");

      const data = await response.json();

      // Add the sent request to the list
      setSentRequests((prev) => [...prev, data.request]);

      // Update the UI to show pending status for this user
      setSearchResults((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, status: "pending" } : user
        )
      );

      setSuggestions((prev) =>
        prev.filter((suggestion) => suggestion._id !== userId)
      );

      // Add notification
      addNotification({
        id: Date.now().toString(),
        type: "system",
        message: `Friend request sent to ${data.request.recipient.firstName} ${data.request.recipient.lastName}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleFriendRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setProcessingRequestId(requestId);
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} friend request`);

      const data = await response.json();

      // Update received requests list
      setReceivedRequests((prev) =>
        prev.filter((req) => req._id !== requestId)
      );

      // If accepted, add to friends list
      if (action === "accept") {
        const request = receivedRequests.find((req) => req._id === requestId);
        if (request) {
          setFriends((prev) => [
            ...prev,
            {
              ...request.sender,
              status: "friend",
            },
          ]);

          // Add notification
          addNotification({
            id: Date.now().toString(),
            type: "request_accepted",
            message: `You are now friends with ${request.sender.firstName} ${request.sender.lastName}`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(
        data.notifications?.filter((n: Notification) => !n.isRead).length || 0
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Add a notification locally (used for system events)
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Update UI immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Update UI immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const fetchNetworkConnections = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLoadingNetwork(true);
    setNetworkMessage(null);

    try {
      const response = await fetch("/api/friends/network", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch network connections");

      const data = await response.json();

      if (data.connections.length === 0 && data.message) {
        setNetworkMessage(data.message);
      }

      setNetworkConnections(data.connections || []);
    } catch (error) {
      console.error("Error fetching network connections:", error);
      setNetworkMessage("Failed to load your network. Please try again later.");
    } finally {
      setIsLoadingNetwork(false);
    }
  };
  // Fetch feed posts (1st-3rd degree network)
  const fetchFeedPosts = async () => {
    if (!user) return;
    setIsLoadingPosts(true);
    try {
      // Fetch mutual network user IDs from API (assume /api/friends/network returns all 1st-3rd degree user IDs)
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/network", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const ids = [user._id, ...data.connections.map((u: any) => u._id)];

      // Fetch posts from those user IDs with sorting parameters
      const queryParams = new URLSearchParams();

      // Add IDs to query params
      ids.forEach((id) => queryParams.append("ids", id));

      // Add sorting parameters
      queryParams.append("sortBy", sortBy);
      queryParams.append("order", sortOrder);

      const postsRes = await fetch(`/api/posts?${queryParams.toString()}`);
      const postsData = await postsRes.json();
      setPosts(postsData);
    } catch (e) {
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImageFile) return;
    let imageUrl = "";
    try {
      if (newPostImageFile) {
        const formData = new FormData();
        formData.append("file", newPostImageFile);
        const res = await fetch("/api/posts/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Gagal upload gambar");
        const data = await res.json();
        imageUrl = data.url;
      }
    } catch (err: any) {
      alert("Gagal upload gambar: " + err.message);
      return;
    }
    const token = localStorage.getItem("token");
    await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        imageUrl
          ? { content: newPostContent, image: imageUrl }
          : { content: newPostContent }
      ),
    });
    setNewPostContent("");
    setNewPostImageFile(null);
    fetchFeedPosts();
  };

  // Like/unlike post
  const handleLikePost = async (postId: string, liked: boolean) => {
    // Optimistic update: update UI langsung
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id !== postId) return post;
        let newLikes = post.likes || [];
        if (liked) {
          // Unlike
          newLikes = newLikes.filter((id: string) => id !== user!._id);
        } else {
          // Like
          newLikes = [...newLikes, user!._id];
        }
        return { ...post, likes: newLikes };
      })
    );
    // Sync ke server
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ like: !liked }),
    });
    if (!res.ok) {
      // Rollback jika gagal
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id !== postId) return post;
          let newLikes = post.likes || [];
          if (!liked) {
            // Like gagal, hapus like
            newLikes = newLikes.filter((id: string) => id !== user!._id);
          } else {
            // Unlike gagal, tambahkan like kembali
            newLikes = [...newLikes, user!._id];
          }
          return { ...post, likes: newLikes };
        })
      );
      alert("Gagal update like. Silakan coba lagi.");
    }
  };

  // Edit post
  const handleEditPost = async (
    postId: string,
    content: string,
    imageFile?: File | null
  ) => {
    let imageUrl = undefined;
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/posts/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Gagal upload gambar");
        const data = await res.json();
        imageUrl = data.url;
      }
    } catch (err: any) {
      alert("Gagal upload gambar: " + err.message);
      return;
    }
    const token = localStorage.getItem("token");
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        imageUrl ? { content, image: imageUrl } : { content }
      ),
    });
    fetchFeedPosts();
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem("token");
    await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFeedPosts();
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
          <p>
            Unable to load profile. Please{" "}
            <Link href="/login" className="text-blue-600">
              login
            </Link>{" "}
            again.
          </p>
        </div>
      </div>
    );
  }

  async function fetchComments(postId: string) {
    const res = await fetch(`/api/comments/${postId}`);
    const data = await res.json();
    setAllComments((prev) => ({ ...prev, [postId]: data }));
  }

  async function postComment(postId: string, userId: string) {
    const content = newComments[postId];
    if (!content) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, userId, content }),
    });

    if (res.ok) {
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Notification Bar */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">LinkedFriend</h1>
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-blue-600 hover:text-blue-500"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-500">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.isRead ? "bg-blue-50" : ""
                          }`}
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                        >
                          <div className="flex items-start">
                            {/* Icon based on notification type */}
                            <div className="flex-shrink-0 mr-3">
                              {notification.type === "friend_request" && (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                    />
                                  </svg>
                                </div>
                              )}
                              {notification.type === "request_accepted" && (
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                              {notification.type === "system" && (
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-800">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  notification.createdAt
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-gray-700">
              {user?.firstName} {user?.lastName}
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
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "profile"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("friends")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "friends"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Friends
                </button>
                <button
                  onClick={() => setActiveTab("find-friends")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "find-friends"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Find Friends
                </button>
                <button
                  onClick={() => setActiveTab("friend-requests")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "friend-requests"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Requests
                  {receivedRequests.length > 0 && (
                    <span className="ml-1 px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                      {receivedRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("network")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "network"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Network
                </button>
                <button
                  onClick={() => setActiveTab("feed")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "feed"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Feed
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Welcome back, {user?.firstName}!
                    </h2>
                    <p className="text-gray-600 mt-1">
                      This is your professional dashboard
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Your Profile
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500">
                          Full Name
                        </h4>
                        <p className="mt-1 text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500">
                          Email
                        </h4>
                        <p className="mt-1 text-gray-900">{user?.email}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500">
                          Job Title
                        </h4>
                        <p className="mt-1 text-gray-900">
                          {user?.jobTitle || "Not specified"}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500">
                          Location
                        </h4>
                        <p className="mt-1 text-gray-900">
                          {user?.location || "Not specified"}
                        </p>
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
              )}
              {/* Friends Tab */}
              {activeTab === "friends" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Your Friends
                  </h3>

                  {isLoadingFriends ? (
                    <div className="text-center py-10">
                      <p>Loading your friends...</p>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        You haven't added any friends yet.
                      </p>
                      <button
                        onClick={() => setActiveTab("find-friends")}
                        className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Find Friends
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {friends.map((friend) => (
                        <div
                          key={friend._id}
                          className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                        >
                          <div className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                                <span className="text-blue-800 font-semibold text-lg">
                                  {friend.firstName.charAt(0)}
                                  {friend.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {friend.firstName} {friend.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {friend.jobTitle || "No title specified"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                {friend.location || "No location specified"}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {friend.email}
                              </p>
                            </div>
                            <div className="mt-4">
                              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                View Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Find Friends Tab */}
              {activeTab === "find-friends" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Find Friends
                  </h3>

                  {/* Search Box */}
                  <div className="flex mb-6">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                      placeholder="Search users by name, job title, or location"
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={searchUsers}
                      disabled={isSearching}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchTerm && (
                    <div className="mb-8">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Search Results
                      </h4>
                      {isSearching ? (
                        <div className="text-center py-6">
                          <p>Searching...</p>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">
                            No users found matching "{searchTerm}"
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {searchResults.map((user) => (
                            <div
                              key={user._id}
                              className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                            >
                              <div className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
                                    <span className="text-gray-800 font-semibold text-lg">
                                      {user.firstName.charAt(0)}
                                      {user.lastName.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-medium text-gray-900">
                                      {user.firstName} {user.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {user.jobTitle || "No title specified"}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-sm text-gray-500">
                                    {user.location || "No location specified"}
                                  </p>
                                </div>
                                <div className="mt-4">
                                  {user.status === "pending" ? (
                                    <button
                                      disabled
                                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-gray-50 cursor-not-allowed"
                                    >
                                      Request Sent
                                    </button>
                                  ) : user.status === "friend" ? (
                                    <button
                                      disabled
                                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 cursor-not-allowed"
                                    >
                                      Already Friends
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        sendFriendRequest(user._id)
                                      }
                                      disabled={sendingRequestTo === user._id}
                                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                      {sendingRequestTo === user._id
                                        ? "Sending..."
                                        : "Send Friend Request"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Friend Suggestions */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">
                      People You May Know
                    </h4>
                    {isLoadingSuggestions ? (
                      <div className="text-center py-6">
                        <p>Loading suggestions...</p>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          No suggestions available right now
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {suggestions.map((suggestion) => (
                          <div
                            key={suggestion._id}
                            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                          >
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
                                  <span className="text-gray-800 font-semibold text-lg">
                                    {suggestion.firstName.charAt(0)}
                                    {suggestion.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {suggestion.firstName} {suggestion.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {suggestion.jobTitle ||
                                      "No title specified"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                  {suggestion.location ||
                                    "No location specified"}
                                </p>
                              </div>
                              <div className="mt-4">
                                <button
                                  onClick={() =>
                                    sendFriendRequest(suggestion._id)
                                  }
                                  disabled={sendingRequestTo === suggestion._id}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  {sendingRequestTo === suggestion._id
                                    ? "Sending..."
                                    : "Send Friend Request"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Friend Requests Tab */}
              {activeTab === "friend-requests" && (
                <div>
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Friend Requests
                    </h3>

                    {isLoadingRequests ? (
                      <div className="text-center py-6">
                        <p>Loading requests...</p>
                      </div>
                    ) : receivedRequests.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          You have no pending friend requests
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {receivedRequests.map((request) => (
                          <div
                            key={request._id}
                            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                          >
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                                  <span className="text-blue-800 font-semibold text-lg">
                                    {request.sender.firstName.charAt(0)}
                                    {request.sender.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {request.sender.firstName}{" "}
                                    {request.sender.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {request.sender.jobTitle ||
                                      "No title specified"}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Sent{" "}
                                    {new Date(
                                      request.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleFriendRequest(request._id, "accept")
                                  }
                                  disabled={processingRequestId === request._id}
                                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    handleFriendRequest(request._id, "reject")
                                  }
                                  disabled={processingRequestId === request._id}
                                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Sent Requests
                    </h3>

                    {isLoadingRequests ? (
                      <div className="text-center py-6">
                        <p>Loading sent requests...</p>
                      </div>
                    ) : sentRequests.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          You haven't sent any friend requests
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sentRequests.map((request) => (
                          <div
                            key={request._id}
                            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                          >
                            <div className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
                                  <span className="text-gray-800 font-semibold text-lg">
                                    {request.recipient.firstName.charAt(0)}
                                    {request.recipient.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {request.recipient.firstName}{" "}
                                    {request.recipient.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {request.recipient.jobTitle ||
                                      "No title specified"}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Sent{" "}
                                    {new Date(
                                      request.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <div className="px-4 py-2 bg-gray-100 text-center rounded-md text-gray-700 text-sm">
                                  Request Pending
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Network Tab */}
              {activeTab === "network" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Your Professional Network
                  </h3>
                  <p className="text-gray-600 mb-6">
                    These are people connected to your friends. Add them to
                    expand your network.
                  </p>

                  {isLoadingNetwork ? (
                    <div className="text-center py-10">
                      <p>Loading your network connections...</p>
                    </div>
                  ) : networkMessage ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">{networkMessage}</p>
                      {!friends.length && (
                        <button
                          onClick={() => setActiveTab("find-friends")}
                          className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Find Friends First
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {networkConnections.map((connection) => (
                        <div
                          key={connection._id}
                          className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                        >
                          <div className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center">
                                <span className="text-gray-800 font-semibold text-lg">
                                  {connection.firstName.charAt(0)}
                                  {connection.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {connection.firstName} {connection.lastName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {connection.jobTitle || "No title specified"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                {connection.location || "No location specified"}
                              </p>
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                {connection.mutualFriends} mutual connection
                                {connection.mutualFriends !== 1 ? "s" : ""}
                              </p>
                            </div>

                            <div className="mt-4">
                              {connection.status === "pending" ? (
                                <button
                                  disabled
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-500 bg-gray-50 cursor-not-allowed"
                                >
                                  Request Sent
                                </button>
                              ) : connection.status === "received" ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleFriendRequest(
                                        connection.requestId!,
                                        "accept"
                                      )
                                    }
                                    disabled={
                                      processingRequestId ===
                                      connection.requestId
                                    }
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleFriendRequest(
                                        connection.requestId!,
                                        "reject"
                                      )
                                    }
                                    disabled={
                                      processingRequestId ===
                                      connection.requestId
                                    }
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    sendFriendRequest(connection._id)
                                  }
                                  disabled={sendingRequestTo === connection._id}
                                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  {sendingRequestTo === connection._id
                                    ? "Sending..."
                                    : "Connect"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Feed Tab */}{" "}
              {activeTab === "feed" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Your Feed
                    </h3>

                    {/* Advanced Sorting Controls */}
                    <div className="flex space-x-3 items-center">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">
                          Sort by:
                        </label>
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={sortBy}
                          onChange={(e) =>
                            setSortBy(e.target.value as "date" | "likes")
                          }
                        >
                          <option value="date">Date</option>
                          <option value="likes">Likes</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Order:</label>
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={sortOrder}
                          onChange={(e) =>
                            setSortOrder(e.target.value as "asc" | "desc")
                          }
                        >
                          <option value="desc">Newest Posts/Most Liked First</option>
                          <option value="asc">Oldest Posts/Least Liked First</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Create Post */}
                  <div className="mb-6 bg-white p-6 rounded-lg shadow flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                        {user?.firstName.charAt(0)}
                        {user?.lastName.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full border border-gray-300 rounded-md p-3 mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        rows={3}
                        placeholder="Start a post, share your thoughts..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                      {/* Tambahkan input file dan preview pada create post */}
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full border border-gray-300 rounded-md p-2 mb-2"
                        onChange={(e) =>
                          setNewPostImageFile(e.target.files?.[0] || null)
                        }
                      />
                      {newPostImageFile && (
                        <div className="mb-2 flex justify-center">
                          <img
                            src={URL.createObjectURL(newPostImageFile)}
                            alt="Preview"
                            className="max-h-40 rounded border"
                          />
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          onClick={handleCreatePost}
                          disabled={!newPostContent.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Feed List */}
                  {isLoadingPosts ? (
                    <div className="text-center py-6">Loading feed...</div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No posts to show.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {posts.map((post) => (
                        <div
                          key={post._id}
                          className="bg-white rounded-xl shadow-lg p-6 max-w-xl mx-auto border border-gray-200"
                        >
                          <div className="flex items-start mb-3">
                            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-700 mr-4">
                              {post.author?.firstName?.charAt(0)}
                              {post.author?.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900">
                                {post.author?.firstName} {post.author?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {post.author?.jobTitle}
                                {post.author?.location
                                  ? ` • ${post.author.location}`
                                  : ""}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {new Date(post.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div
                            className="mb-3 text-gray-900 text-[15px] whitespace-pre-line"
                            style={{ lineHeight: "1.6" }}
                          >
                            {post.content}
                          </div>
                          {/* Comment Section */}
                          <div className="mt-2">
                            <h4 className="font-semibold">Comments</h4>
                            {(allComments[post._id]?.slice(0, showAllComments[post._id] ? undefined : 3) || []).map((comment) => (
                              <div key={comment._id} className="text-sm text-gray-700 mt-1">
                                <div className="flex items-center gap-2">
                                  {comment.userId?.image && (
                                    <img
                                      src={comment.userId.image}
                                      alt="avatar"
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <strong>
                                    {comment.userId?.firstName
                                      ? `${comment.userId.firstName} ${comment.userId.lastName}`
                                      : "Unknown"}
                                  </strong>
                                </div>
                                <div className="ml-8">{comment.content}</div>
                              </div>
                            ))}

                            {/* Toggle button */}
                            {allComments[post._id]?.length > 3 && (
                              <button
                                onClick={() =>
                                  setShowAllComments((prev) => ({
                                    ...prev,
                                    [post._id]: !prev[post._id],
                                  }))
                                }
                                className="text-sm text-blue-600 mt-2 hover:underline"
                              >
                                {showAllComments[post._id] ? "Hide comments" : "See more comments"}
                              </button>
                            )}

                            {/* Input komentar */}
                            <div className="flex gap-2 mt-3">
                              <input
                                type="text"
                                value={newComments[post._id] || ""}
                                onChange={(e) =>
                                  setNewComments((prev) => ({
                                    ...prev,
                                    [post._id]: e.target.value,
                                  }))
                                }
                                className="flex-1 border p-2 rounded"
                                placeholder="Write a comment..."
                              />
                              <button
                                onClick={() => postComment(post._id, user._id)}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                              >
                                Send
                              </button>
                            </div>
                          </div>

                          {post.image && (
                            <div className="mb-4 flex justify-center">
                              <img
                                src={post.image}
                                alt="Post Image"
                                className="rounded-lg max-h-96 w-full object-cover border"
                                style={{ maxWidth: "100%", objectFit: "cover" }}
                              />
                            </div>
                          )}{" "}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex space-x-4">
                              <button
                                onClick={() =>
                                  handleLikePost(
                                    post._id,
                                    post.likes?.includes(user!._id)
                                  )
                                }
                                className={`flex items-center px-4 py-2 rounded-full font-medium text-base transition border ${
                                  post.likes?.includes(user!._id)
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                }`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                                Like
                              </button>
                            </div>

                            <div className="flex items-center text-sm text-gray-500">
                              <div className="flex items-center mr-4">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  {post.likes?.length || 0}
                                </span>{" "}
                                likes
                              </div>
                            </div>
                            {post.author?._id === user!._id && (
                              <span className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    setEditModal({
                                      open: true,
                                      postId: post._id,
                                      content: post.content,
                                      image: post.image,
                                      imageFile: null,
                                    })
                                  }
                                  className="px-4 py-2 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium text-base hover:bg-yellow-100 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium text-base hover:bg-red-100 transition"
                                >
                                  Delete
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Edit Post Modal */}
              {editModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <h2 className="text-lg font-semibold mb-4">Edit Post</h2>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      rows={3}
                      value={editModal.content}
                      onChange={(e) =>
                        setEditModal((m) => ({ ...m, content: e.target.value }))
                      }
                    />
                    {/* Tambahkan input file dan preview pada modal edit post */}
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border border-gray-300 rounded-md p-2 mb-2"
                      onChange={(e) =>
                        setEditModal((m) => ({
                          ...m,
                          imageFile: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    {(editModal.imageFile || editModal.image) && (
                      <div className="mb-2 flex justify-center">
                        <img
                          src={
                            editModal.imageFile
                              ? URL.createObjectURL(editModal.imageFile)
                              : editModal.image
                          }
                          alt="Preview"
                          className="max-h-40 rounded border"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                        onClick={() => setEditModal({ open: false })}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-blue-600 text-white"
                        onClick={async () => {
                          await handleEditPost(
                            editModal.postId!,
                            editModal.content || ""
                          );
                          setEditModal({ open: false });
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
