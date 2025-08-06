# Collaborative Development Setup Guide

## For the Project Owner (You)

### Step 1: Share Your Database Connection
1. In your Replit, click the "Secrets" tab (🔒 lock icon) in the sidebar
2. Find the `DATABASE_URL` secret
3. Copy the entire value (starts with `postgresql://`)
4. Share this URL securely with your collaborator (via private message, not public GitHub)

### Step 2: Share Other Required Secrets
Copy and share these environment variables from your Secrets tab:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - For authentication consistency (if you have one)
- `STRIPE_SECRET_KEY` - For payment processing (if using Stripe)
- `VITE_STRIPE_PUBLIC_KEY` - For frontend payment forms (if using Stripe)

---

## For Your Collaborator

### Step 1: Clone the Repository
1. Fork or clone the GitHub repository to your own Replit
2. Open the project in Replit

### Step 2: Install Dependencies
Run this command in the Shell:
```bash
npm install
```

### Step 3: Add Environment Variables
1. Click the "Secrets" tab (🔒 lock icon) in your Replit sidebar
2. Add each secret by clicking "New Secret":
   - **Name:** `DATABASE_URL`
   - **Value:** [paste the URL shared by project owner]
   
   - **Name:** `JWT_SECRET` 
   - **Value:** [paste the secret shared by project owner, or create: `your_jwt_secret_here_123`]

### Step 4: Start the Application
Run this command:
```bash
npm run dev
```

### Step 5: Test Login
The application will start on the provided URL. Contact the project admin for login credentials.

---

## Database Schema Overview

Your current database has these tables:

### Users Table
- `id` - Auto-incrementing primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Encrypted password
- `role` - Either 'customer', 'driver', or 'admin'
- `phone` - Phone number (optional)
- `address` - Address (optional)
- `stripeCustomerId` - Stripe customer ID (optional)
- `stripeSubscriptionId` - Stripe subscription ID (optional)
- `createdAt` - Account creation timestamp

### Pickups Table
- `id` - Auto-incrementing primary key
- `customerId` - References users.id
- `driverId` - References users.id (optional, assigned later)
- `address` - Pickup location
- `bagCount` - Number of bags
- `amount` - Price amount (decimal)
- `serviceType` - Either 'subscription' or 'one-time'
- `status` - 'pending', 'assigned', 'completed', or 'cancelled'
- `scheduledDate` - When pickup is scheduled
- `completedAt` - When pickup was completed (optional)
- `specialInstructions` - Customer notes (optional)
- `createdAt` - Order creation timestamp

### Routes Table
- `id` - Auto-incrementing primary key
- `driverId` - References users.id
- `date` - Route date
- `pickupIds` - Array of pickup IDs in optimized order
- `totalDistance` - Total route distance (optional)
- `estimatedTime` - Estimated time in minutes (optional)
- `status` - 'pending', 'active', or 'completed'
- `createdAt` - Route creation timestamp

### Subscriptions Table
- `id` - Auto-incrementing primary key
- `customerId` - References users.id
- `stripeSubscriptionId` - Stripe subscription ID
- `status` - 'active', 'cancelled', or 'past_due'
- `nextPickupDate` - Next scheduled pickup
- `createdAt` - Subscription creation timestamp

### Sessions Table
- `sid` - Session ID (primary key)
- `sess` - Session data (JSON)
- `expire` - Session expiration timestamp

---

## Making Schema Changes

When either developer needs to modify the database structure:

1. **Edit the Schema:** Modify `shared/schema.ts`
2. **Push Changes:** Run `npm run db:push`
3. **Commit Code:** Push changes to GitHub
4. **Notify Team:** Let other developers know to pull and run `npm run db:push`

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly copied (no extra spaces)
- Ensure the database URL hasn't expired
- Check that both developers can access the internet

### Conflicting Data
- Both developers share the same data
- Test with different user accounts to avoid conflicts
- Create additional test users if needed

### Schema Sync Issues
- Always run `npm run db:push` after pulling schema changes
- If issues persist, check the console for error messages