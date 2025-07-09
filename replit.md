# replit.md

## Overview

This is a full-stack web application for "Acapella Trash Removal powered by HMBL" - a residential trash pickup service. The application provides a complete business management system with customer booking, driver route management, admin oversight, and Stripe payment integration. Built with React frontend, Express backend, and in-memory storage for development.

## Recent Changes (July 2025)
- ✓ Fixed TypeScript compilation errors and Express middleware types
- ✓ Added graceful handling for missing Stripe API keys during development  
- ✓ Implemented mock payment responses for testing without live Stripe integration
- ✓ Configured professional color scheme matching service requirements
- ✓ Created responsive mobile-first design for driver dashboard
- ✓ Set up complete authentication flow with role-based access control

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local state with React hooks
- **UI Library**: Radix UI components with custom styling
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Payment Processing**: Stripe integration for subscriptions and one-time payments
- **API Design**: RESTful endpoints with role-based access control

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing
- **Tables**: users, pickups, routes, subscriptions
- **Migrations**: Managed through Drizzle Kit

## Key Components

### User Management
- **Authentication**: JWT-based with role-based access (customer, driver, admin)
- **Registration**: Multi-role user creation with form validation
- **Password Security**: bcrypt hashing with salt rounds

### Booking System
- **Service Types**: One-time pickups and recurring subscriptions
- **Scheduling**: Date-based pickup scheduling
- **Pricing**: Tiered pricing based on bag count and service type

### Payment Integration
- **Stripe Elements**: React Stripe.js for secure payment processing
- **Subscription Management**: Recurring billing through Stripe subscriptions
- **Customer Management**: Automated Stripe customer creation and linking

### Route Management
- **Driver Assignment**: Admin can assign pickups to drivers
- **Route Optimization**: Driver dashboard shows assigned pickups
- **Status Tracking**: Real-time pickup status updates (pending, assigned, completed)

### Admin Dashboard
- **Overview Statistics**: Business metrics and KPIs
- **User Management**: View and manage customers and drivers
- **Pickup Management**: Assign, track, and complete pickups
- **Route Planning**: Optimize driver routes and schedules

## Data Flow

1. **User Registration/Login**: 
   - User submits credentials → Server validates → JWT token issued → Client stores token
   - Role-based redirection to appropriate dashboard

2. **Booking Process**:
   - Customer selects service → Booking modal collects details → Stripe payment → Pickup created in database
   - Admin can view and assign to drivers

3. **Driver Workflow**:
   - Driver logs in → Views assigned route → Navigates to addresses → Marks pickups complete
   - Real-time updates to admin dashboard

4. **Payment Flow**:
   - Stripe Elements collects payment → Server creates Stripe customer/subscription → Database updated with payment status

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **Payments**: Stripe API for payment processing
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Password Hashing**: bcryptjs for secure password storage

### UI Dependencies
- **Component Library**: Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Zod validation

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across frontend and backend
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like behavior
- **Database**: Environment variable configuration for database connection

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: esbuild bundle for optimized server deployment
- **Database**: Drizzle push for schema deployment

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Stripe**: `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`
- **JWT**: `JWT_SECRET` for token signing
- **Node Environment**: `NODE_ENV` for environment-specific behavior

### File Structure
```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── migrations/       # Database migrations
├── dist/            # Production build output
└── node_modules/    # Dependencies
```

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment workflows.