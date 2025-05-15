# Test Account for LinkedFriend Application

This document provides information about the special test account created for the LinkedFriend application.

## Test Account Credentials

```
Email: test@example.com
Password: test123
```

## What's Included

The test account comes pre-configured with:

-   **5 Friends**: The account already has 5 connections
-   **3 Incoming Friend Requests**: There are 3 pending requests waiting to be accepted/rejected
-   **2 Outgoing Friend Requests**: The account has sent 2 friend requests to other users
-   **Notifications**: A mix of read/unread system and friend request notifications

## How to Use

1. Make sure your MongoDB is running:

    ```
    npm run mongo:start
    ```

2. Create or refresh the test account:

    ```
    npm run create:test-account
    ```

3. Start the application:

    ```
    npm run dev
    ```

4. Log in with the test account credentials (test@example.com / test123)

5. Explore the following features:

    - **Friends Tab**: View your 5 existing connections
    - **Friend Requests Tab**: See 3 incoming requests to accept/reject
    - **Network Tab**: Explore 2nd-degree connections (friends of friends)
    - **Notifications**: View and interact with notifications
    - **Find Friends**: Search for users and send new connection requests

## Refreshing the Test Account

If you want to reset the test account back to its initial state:

```
npm run create:test-account
```

This will remove the existing test account and all its data, then create a fresh account with the same configurations.

## Account Structure

```
Test User
├── 5 Friends (randomly selected from existing users)
├── 3 Incoming Friend Requests
├── 2 Outgoing Friend Requests
└── Notifications
    ├── Friend Request Notifications
    └── System Notifications
```

## Implementation Details

The test account is created using the script at `scripts/create-test-account.js`.

This script:

1. Removes any existing test account data
2. Creates a fresh account
3. Adds friends, requests, and notifications
4. Ensures proper data relationships between the test account and other users
