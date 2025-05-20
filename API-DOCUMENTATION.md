# LinkedFriend API Documentation

This document provides a comprehensive reference for all LinkedFriend API endpoints, including example curl commands for testing.

## Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword",
    "firstName": "John",
    "lastName": "Doe",
    "location": "New York, NY",
    "jobTitle": "Software Engineer"
  }'
```

**Response:**

```json
{
	"success": true,
	"user": {
		"_id": "USER_ID",
		"email": "user@example.com",
		"firstName": "John",
		"lastName": "Doe",
		"location": "New York, NY",
		"jobTitle": "Software Engineer"
	}
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**Response:**

```json
{
	"success": true,
	"user": {
		"_id": "USER_ID",
		"email": "user@example.com",
		"firstName": "John",
		"lastName": "Doe",
		"location": "New York, NY",
		"jobTitle": "Software Engineer"
	},
	"token": "JWT_TOKEN_STRING"
}
```

### Get User Profile

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"user": {
		"_id": "USER_ID",
		"email": "user@example.com",
		"firstName": "John",
		"lastName": "Doe",
		"location": "New York, NY",
		"jobTitle": "Software Engineer"
	}
}
```

## Friends

### Get User's Friends

```bash
curl -X GET http://localhost:3000/api/friends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"friends": [
		{
			"_id": "FRIEND_ID_1",
			"firstName": "Jane",
			"lastName": "Smith",
			"email": "jane@example.com",
			"jobTitle": "Product Manager",
			"location": "San Francisco, CA"
		},
		{
			"_id": "FRIEND_ID_2",
			"firstName": "Bob",
			"lastName": "Johnson",
			"email": "bob@example.com",
			"jobTitle": "UX Designer",
			"location": "Seattle, WA"
		}
	]
}
```

### Add a Friend

```bash
curl -X POST http://localhost:3000/api/friends/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "friendId": "USER_ID_TO_ADD"
  }'
```

**Response:**

```json
{
	"success": true,
	"message": "Friend added successfully",
	"friend": {
		"_id": "FRIEND_ID",
		"firstName": "Jane",
		"lastName": "Smith",
		"email": "jane@example.com",
		"jobTitle": "Product Manager",
		"location": "San Francisco, CA"
	}
}
```

### Get Friend Suggestions

```bash
curl -X GET http://localhost:3000/api/friends/suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"suggestions": [
		{
			"_id": "USER_ID_1",
			"firstName": "Alex",
			"lastName": "Miller",
			"email": "alex@example.com",
			"jobTitle": "Data Scientist",
			"location": "Boston, MA"
		},
		{
			"_id": "USER_ID_2",
			"firstName": "Sarah",
			"lastName": "Williams",
			"email": "sarah@example.com",
			"jobTitle": "Marketing Manager",
			"location": "Chicago, IL"
		}
	]
}
```

### Get Network Connections (Friends of Friends)

```bash
curl -X GET http://localhost:3000/api/friends/network \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"connections": [
		{
			"_id": "USER_ID_1",
			"firstName": "Michael",
			"lastName": "Brown",
			"email": "michael@example.com",
			"jobTitle": "Software Developer",
			"location": "Austin, TX",
			"mutualFriends": 3,
			"status": null
		},
		{
			"_id": "USER_ID_2",
			"firstName": "Emily",
			"lastName": "Davis",
			"email": "emily@example.com",
			"jobTitle": "Project Manager",
			"location": "Denver, CO",
			"mutualFriends": 2,
			"status": "pending"
		}
	]
}
```

## Friend Requests

### Get Friend Requests

```bash
curl -X GET http://localhost:3000/api/friends/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"sentRequests": [
		{
			"_id": "REQUEST_ID_1",
			"sender": {"_id": "YOUR_USER_ID"},
			"recipient": {
				"_id": "RECIPIENT_ID",
				"firstName": "David",
				"lastName": "Wilson",
				"email": "david@example.com",
				"jobTitle": "Software Engineer",
				"location": "Portland, OR"
			},
			"status": "pending",
			"createdAt": "2023-07-15T14:30:22.123Z"
		}
	],
	"receivedRequests": [
		{
			"_id": "REQUEST_ID_2",
			"sender": {
				"_id": "SENDER_ID",
				"firstName": "Emma",
				"lastName": "Taylor",
				"email": "emma@example.com",
				"jobTitle": "Data Analyst",
				"location": "Miami, FL"
			},
			"recipient": {"_id": "YOUR_USER_ID"},
			"status": "pending",
			"createdAt": "2023-07-16T09:45:11.456Z"
		}
	]
}
```

### Send Friend Request

```bash
curl -X POST http://localhost:3000/api/friends/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "USER_ID_TO_SEND_REQUEST"
  }'
```

**Response:**

```json
{
	"success": true,
	"message": "Friend request sent",
	"request": {
		"_id": "REQUEST_ID",
		"sender": {
			"_id": "YOUR_USER_ID",
			"firstName": "John",
			"lastName": "Doe",
			"email": "john@example.com",
			"jobTitle": "Software Engineer",
			"location": "New York, NY"
		},
		"recipient": {
			"_id": "RECIPIENT_ID",
			"firstName": "Lisa",
			"lastName": "Johnson",
			"email": "lisa@example.com",
			"jobTitle": "Product Designer",
			"location": "Los Angeles, CA"
		},
		"status": "pending",
		"createdAt": "2023-07-17T12:34:56.789Z"
	}
}
```

### Accept Friend Request

```bash
curl -X PATCH http://localhost:3000/api/friends/requests/REQUEST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept"
  }'
```

**Response:**

```json
{
	"success": true,
	"message": "Friend request accepted"
}
```

### Reject Friend Request

```bash
curl -X PATCH http://localhost:3000/api/friends/requests/REQUEST_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject"
  }'
```

**Response:**

```json
{
	"success": true,
	"message": "Friend request rejected"
}
```

## Users

### Search Users

```bash
curl -X GET "http://localhost:3000/api/users/search?query=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"users": [
		{
			"_id": "USER_ID_1",
			"firstName": "John",
			"lastName": "Smith",
			"email": "johnsmith@example.com",
			"jobTitle": "Frontend Developer",
			"location": "Boston, MA",
			"status": null
		},
		{
			"_id": "USER_ID_2",
			"firstName": "Johnny",
			"lastName": "Walker",
			"email": "johnny@example.com",
			"jobTitle": "UX Researcher",
			"location": "Chicago, IL",
			"status": "friend"
		},
		{
			"_id": "USER_ID_3",
			"firstName": "Elizabeth",
			"lastName": "Johnson",
			"email": "elizabeth@example.com",
			"jobTitle": "Project Manager",
			"location": "San Francisco, CA",
			"status": "pending"
		}
	]
}
```

## Notifications

### Get Notifications

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"notifications": [
		{
			"id": "NOTIFICATION_ID_1",
			"type": "friend_request",
			"message": "Alex Miller sent you a friend request",
			"isRead": false,
			"data": {
				"requestId": "REQUEST_ID",
				"senderId": "SENDER_ID",
				"senderName": "Alex Miller"
			},
			"createdAt": "2023-07-15T14:30:22.123Z"
		},
		{
			"id": "NOTIFICATION_ID_2",
			"type": "request_accepted",
			"message": "Sarah Williams accepted your friend request",
			"isRead": true,
			"data": {
				"friendId": "FRIEND_ID",
				"friendName": "Sarah Williams"
			},
			"createdAt": "2023-07-14T10:22:33.456Z"
		},
		{
			"id": "NOTIFICATION_ID_3",
			"type": "system",
			"message": "Welcome to LinkedFriend! Complete your profile to connect with more professionals.",
			"isRead": true,
			"createdAt": "2023-07-10T08:15:42.789Z"
		}
	]
}
```

### Mark Notification as Read

```bash
curl -X PATCH http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"message": "Notification marked as read"
}
```

### Mark All Notifications as Read

```bash
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
	"success": true,
	"message": "All notifications marked as read",
	"count": 3
}
```

## Authentication Note

For all API endpoints except `/api/auth/login` and `/api/auth/register`, you must include the JWT token received during login in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

All endpoints follow a consistent error handling pattern:

-   **400 Bad Request**: Invalid or missing required parameters
-   **401 Unauthorized**: Invalid or expired authentication token
-   **404 Not Found**: Requested resource not found
-   **409 Conflict**: Resource already exists (e.g., email already registered)
-   **500 Internal Server Error**: Server-side issue

Error responses include:

```json
{
	"success": false,
	"message": "Error description"
}
```

## Testing with Test Account

For easy testing, you can create a predefined test account with sample data:

```bash
# Start MongoDB
npm run mongo:start

# Create test account
npm run create:test-account

# Login with test account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

The test account comes with 5 friends, 3 incoming friend requests, 2 outgoing friend requests, and notifications.
