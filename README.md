# LinkedFriend Application

A social networking application built with Next.js and MongoDB.

## NoSQL Benchmark Research

Before choosing the technologies used in this LinkedFriend Application, We conducted a benchmark and comparison of popular NoSQL databases, including MongoDB, Neo4j, and Redis.
The results of this research helped guide the decision to use MongoDB as the primary database and Redis for caching.

You can view the full benchmark project and its source code here:
👉 [NoSQL_Benchmark GitHub Repository](https://github.com/Tianrider/NoSQL_Benchmark)

## Setup with Local MongoDB and Redis (Docker)

This application is configured to use local MongoDB and Redis instances running in Docker.

### Prerequisites

-   [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine
-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup Instructions

1. **Start All Services (MongoDB and Redis)**

    ```bash
    # Start both MongoDB and Redis containers
    npm run services:start
    ```

    Or start services individually:

    ```bash
    # Start only the MongoDB container
    npm run mongo:start

    # Start only the Redis container
    npm run redis:start
    ```

    This will start:
    
    - A MongoDB container with the following configuration:
      - Port: 27017 (default MongoDB port)
      - Username: admin
      - Password: password
      - Database: linkedfriend

    - A Redis container with the following configuration:
      - Port: 6379 (default Redis port)
      - No password authentication (development setup)

2. **Initialize the Database**

    ```bash
    # Initialize the database with collections and indexes
    npm run mongo:init
    ```

3. **Start the Application**

    ```bash
    # Start the Next.js development server
    npm run dev
    ```

    The application will be available at [http://localhost:3000](http://localhost:3000)

4. **Stop All Containers (when done)**

    ```bash
    # Stop all containers (MongoDB and Redis)
    npm run services:stop
    ```

    Or stop MongoDB only:

    ```bash
    # Stop only the MongoDB container
    npm run mongo:stop
    ```

## Connection Details

### MongoDB
-   **Connection String**: `mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin`
-   **Database**: linkedfriend
-   **Collections**:
    -   users
    -   posts
    -   comments
    -   connections

### Redis
-   **Connection String**: `redis://localhost:6379`
-   **Used for**:
    -   User profile caching (TTL: 1 hour)
    -   Friend list caching (TTL: 10 minutes)
    -   Post caching (TTL: 5 minutes)

## Redis Caching Test Page

A test page is available to verify Redis caching functionality:

1. Start the application: `npm run dev`
2. Log in to your account
3. Visit [http://localhost:3000/redis-test](http://localhost:3000/redis-test)
4. Follow the instructions on the page to test Redis caching

## Troubleshooting

### MongoDB Issues
1. Make sure Docker is running on your machine
2. Verify the MongoDB container is running: `docker ps`
3. Check the MongoDB container logs: `docker logs mongodb`
4. If needed, restart the MongoDB container: `npm run mongo:start`

### Redis Issues
1. Make sure Docker is running on your machine
2. Verify the Redis container is running: `docker ps`
3. Check the Redis container logs: `docker logs redis`
4. If needed, restart the Redis container: `npm run redis:start`
5. To check Redis connection manually:
   ```
   # Using redis-cli (if installed)
   redis-cli ping

   # Or using Docker
   docker exec -it redis redis-cli ping
   ```
   Should return "PONG" if Redis is running correctly

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
