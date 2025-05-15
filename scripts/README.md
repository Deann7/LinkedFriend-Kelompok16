# Database Seeder

This script populates your MongoDB database with dummy users, friend relationships, friend requests, and notifications for testing purposes.

## What Gets Created

-   30 dummy users with random job titles and locations
-   Friend relationships between users (5 friends per user on average)
-   10 pending friend requests between random users
-   Notifications for each friend request
-   Some random system notifications
-   A test admin user (admin@example.com / admin123)

All regular test users share the same password: `password123`

## How to Use

1. Make sure your MongoDB is running:

    ```
    npm run mongo:start
    ```

2. Run the seed script:

    ```
    npm run db:seed
    ```

3. Now you can log in with any of the generated users:

    - Username: user1@example.com (or user2@example.com through user30@example.com)
    - Password: password123

4. Test friend requests and notifications with the pre-populated data.

5. When you're done, you can stop MongoDB:
    ```
    npm run mongo:stop
    ```

## Customization

You can edit the `seed-db.js` file to adjust the number of users, friends, or requests by changing the following constants:

```js
const NUM_USERS = 30;
const NUM_FRIENDS_PER_USER = 5;
const NUM_PENDING_REQUESTS = 10;
```

If you want to reset the database back to empty, simply delete the collections using MongoDB commands or admin tools.

## Notes for Development

The seeder generates a deterministic yet varied dataset that demonstrates all the features of the friend management system:

-   Users with different friend counts
-   Pending friend requests in both directions
-   Read and unread notifications
-   System notifications
-   Friend suggestions (users who aren't already friends)
