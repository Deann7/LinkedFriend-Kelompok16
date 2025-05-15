# LinkedFriend Test Data Generator

This project includes a data seeding script to generate test data for the LinkedFriend application. The seeder creates realistic test data including users, friend relationships, friend requests, and notifications.

## How to Use the Test Data

1. Start your MongoDB instance:

    ```
    npm run mongo:start
    ```

2. Run the data seeding script:

    ```
    npm run db:seed
    ```

3. Start the application:

    ```
    npm run dev
    ```

4. Log in with any of the test accounts:

    - Email: user1@example.com (through user30@example.com)
    - Password: password123

    Or admin account:

    - Email: admin@example.com
    - Password: admin123

## What Gets Generated

The seeder creates:

-   30 regular users with random profiles (same password for all: password123)
-   Friend connections between users (averages 5 friends per user)
-   10 pending friend requests between random users
-   Notifications for friend requests
-   System notifications for some users
-   1 admin user (admin@example.com / admin123)

## Testing Friend Features

With this data, you can test:

### Friend Management

-   View existing friends on the Friends tab
-   Send new friend requests to suggestions
-   Accept/reject incoming friend requests
-   Search for users

### Notifications

-   View unread notifications (friend requests, request acceptances)
-   Mark notifications as read
-   See the notification counter update

### Friend Suggestions

-   See users who are not yet your friends
-   Filter out users who already have pending requests

## Customization

To adjust the amount of test data, edit the constants at the top of `scripts/seed-db.js`:

```js
const NUM_USERS = 30; // Number of total users
const NUM_FRIENDS_PER_USER = 5; // Average friends per user
const NUM_PENDING_REQUESTS = 10; // Number of pending friend requests
```

## Resetting the Data

To reset and regenerate fresh data:

1. Simply run the seed script again:

    ```
    npm run db:seed
    ```

2. This will clear all existing users, friend requests, and notifications before creating new ones.
