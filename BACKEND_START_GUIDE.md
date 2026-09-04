# Project Start Guide

This guide covers how to set up, start the database, run the backend server, and launch the mobile app for the SwasthyaSetu project locally.

## Prerequisites

- **Node.js** and **npm**
- **Docker** and **Docker Compose** (for the database)

---

## 1. Environment Variables

Make sure the environment variables are set correctly for the backend. 
Create or check the `.env` file inside the `apps/backend` directory (or use `.env.example` in the project root as a reference).

Example `.env` in `apps/backend/.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/swasthyasetu?schema=public"

# Auth
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

> **Note:** The `DATABASE_URL` connects to port `5433` which is the port exposed by our Docker container.

---

## 2. Install Dependencies

Install all dependencies from the root of the project workspace.

```bash
# In the root directory (c:\Users\Aditya\Swasthsetu\SwasthyaSetu)
npm install
```

---

## 3. Start the Database Server

We use a PostgreSQL database running in a Docker container.

1. Ensure Docker is running on your machine.
2. Start the database service using the `docker-compose.yml` file located at the project root:

```bash
# In the root directory
docker-compose up -d db
```

This will run the PostgreSQL database in the background on port `5433` (mapped from `5432` internally).

---

## 4. Run Database Migrations (Prisma)

If this is your first time setting up, or if there have been schema changes, you'll need to run Prisma migrations or push the schema to the database.

```bash
# In the root directory
npm run dev:backend -- prisma db push
# OR if using migrations:
# npm run dev:backend -- prisma migrate dev
```
*(You can also navigate to `apps/backend` and run `npx prisma db push` directly).*

---

## 5. Start the Backend Server

Finally, you can start the backend development server.

Run the following command from the project root:

```bash
# In the root directory
npm run dev:backend
```

This uses the npm workspace to start the `@swasthyasetu/backend` application on the `PORT` specified in your `.env` (default is `3000`).

The backend is now accessible locally, typically at `http://localhost:3000`.

---

## 6. Start the Mobile App (Expo)

The mobile app is built with Expo. To run it locally (after you have installed dependencies in step 2):

1. Open a **new terminal window** at the project root (`c:\Users\Aditya\Swasthsetu\SwasthyaSetu`).
2. Run the mobile dev script:

```bash
npm run dev:mobile
```

3. This will start the Expo development server. You can then:
   - Press **a** to open the app on an Android Emulator (if running Android Studio).
   - Press **i** to open the app on an iOS Simulator (if on macOS).
   - Scan the **QR Code** shown in the terminal with your physical phone using the **Expo Go** app.

> **Tip:** If you are testing on a physical device, ensure your phone and computer are on the same Wi-Fi network. You might also need to configure the mobile app to point to your computer's local network IP address rather than `localhost` if it connects to the backend.
