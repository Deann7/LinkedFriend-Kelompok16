# LinkedFriend Application

A social networking application built with Next.js and MongoDB.

## Setup with Local MongoDB (Docker)

This application is configured to use a local MongoDB instance running in Docker.

### Prerequisites

-   [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine
-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup Instructions

1. **Start MongoDB Container**

    ```bash
    # Start the MongoDB container
    npm run mongo:start
    ```

    This will start a MongoDB container with the following configuration:

    - Port: 27017 (default MongoDB port)
    - Username: admin
    - Password: password
    - Database: linkedfriend

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

4. **Stop MongoDB Container (when done)**

    ```bash
    # Stop the MongoDB container
    npm run mongo:stop
    ```

## MongoDB Connection Details

-   **Connection String**: `mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin`
-   **Database**: linkedfriend
-   **Collections**:
    -   users
    -   posts
    -   comments
    -   connections

## Troubleshooting

If you encounter connection issues:

1. Make sure Docker is running on your machine
2. Verify the MongoDB container is running: `docker ps`
3. Check the MongoDB container logs: `docker logs mongodb`
4. If needed, restart the MongoDB container: `npm run mongo:stop && npm run mongo:start`

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
