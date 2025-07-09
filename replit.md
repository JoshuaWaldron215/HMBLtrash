# replit.md

## Overview

This is a full-stack web application for "Acapella Trash Removal powered by HMBL" - a residential trash pickup service. The application provides a complete business management system with customer booking, driver route management, admin oversight, and Stripe payment integration. Built with React frontend, Express backend, and in-memory storage for development.

## Recent Changes (July 2025)
- ✓ Fixed TypeScript compilation errors and Express middleware types
- ✓ Added graceful handling for missing Stripe API keys during development  
- ✓ Implemented mock payment responses for testing without live Stripe integration
- ✓ Changed color scheme from black to proper navy blue (#1e3a8a) for better visibility
- ✓ Created comprehensive responsive design for all screen sizes (mobile, tablet, desktop)
- ✓ Implemented desktop sidebar navigation with mobile bottom tabs
- ✓ Removed customer reviews section from home page per user feedback
- ✓ Added proper CSS opacity syntax fixes across all components
- ✓ Set up complete authentication flow with role-based access control
- ✓ Added collapsible sidebar functionality for mobile and desktop
- ✓ Implemented proper route protection based on user roles (customer/driver/admin)
- ✓ Added mobile sidebar overlay with proper open/close functionality
- ✓ Fixed home page navigation - shows Sign In/Get Started buttons instead of sidebar for unauthenticated users
- ✓ Set up admin-controlled role assignment system for optimal user management
- ✓ Implemented role change functionality for admins to promote customers to drivers or admins
- ✓ Added back buttons to login/register pages for better user experience
- ✓ Removed role selection from signup - all new users register as customers for security
- ✓ Streamlined registration process with clean form design
- ✓ Updated navigation structure to match role-specific requirements:
  * Customer: Home, Next Pickup, Pickup History, Billing, Settings
  * Driver: My Route, Map View, Pickup History, Profile (sticky bottom mobile nav)
  * Admin: Dashboard, Subscribers, One-Time Requests, Route Optimization, Driver Assignments, Reports, Settings
- ✓ Implemented comprehensive route optimization system:
  * Created driver-specific pages (Map View, Pickup History, Profile) with full functionality
  * Built route optimization algorithm with priority sorting and geographic optimization
  * Added real-time route tracking with estimated arrival times and distances
  * Integrated Google Maps navigation with one-click directions
  * Created sample pickup data for testing the driver workflow
  * Fixed all 404 navigation issues and TypeScript errors

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication Strategy

**Optimal Signup/Login Process:**
1. **Customer Registration**: All new users register as 'customer' by default
2. **Admin Role Assignment**: Admin promotes users to 'driver' or 'admin' roles as needed
3. **Role-Based Redirects**: Users are automatically redirected to appropriate dashboards:
   - Customers → /dashboard (booking and subscription management)
   - Drivers → /driver (route management and pickup completion)
   - Admins → /admin (user management, pickup assignment, business overview)
4. **Landing Page**: Unauthenticated users see marketing page with Sign In/Get Started buttons
5. **Security**: Admin-controlled role assignment prevents unauthorized access to sensitive areas

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