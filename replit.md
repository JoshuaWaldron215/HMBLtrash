# replit.md

## Overview

This is a full-stack web application for "Acapella Trash Removal powered by LEMDROIDS" - a residential trash pickup service. The application provides a complete business management system with customer booking, driver route management, admin oversight, and Stripe payment integration. Built with React frontend, Express backend, and in-memory storage for development.

## Recent Changes (July 2025)
- ✓ Successfully migrated from Replit Agent to standard Replit environment
- ✓ Updated branding from "powered by HMBL" to "powered by LEMDROIDS" across all components
- ✓ Updated branding back to "powered by HMBL" across all components per user request
- ✓ Migrated from in-memory storage to PostgreSQL database
- ✓ Created DatabaseStorage class implementing all IStorage interface methods
- ✓ Added database connection setup with Neon PostgreSQL
- ✓ Successfully pushed database schema with drizzle-kit
- ✓ Seeded database with test users (admin, driver, customer)
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
- ✓ Enhanced driver dashboard with professional route optimization features:
  * Added completion checkboxes for each pickup with real-time progress tracking
  * Implemented visual progress bar showing completed vs pending pickups
  * Integrated customer names, bag counts, and special instructions display
  * Added drive time estimates and distance calculations between stops
  * Created Google Maps-ready structure for Distance Matrix API integration
  * Enhanced mobile design with TaskRabbit-style completion workflow
- ✓ Fixed subscription setup error and implemented comprehensive subscription protection:
  * Corrected authenticatedRequest function to use proper (method, url, data) format
  * Added robust error handling for JSON parsing and HTTP responses
  * Updated all API calls across dashboard, admin, driver, and subscription pages
  * Implemented subscription duplicate prevention in dashboard, booking modal, and subscription page
  * Added proper toast notifications for subscription conflicts
  * Enhanced user experience with clear error messages and automatic redirects
- ✓ Comprehensive customer dashboard UI improvements for better clarity and usability:
  * Added proper spacing (mb-8) between dashboard cards for better visual separation
  * Implemented icons throughout the interface using Lucide React icons
  * Enhanced upcoming pickup section with detailed pickup information display
  * Added friendly "No pickups scheduled" message with encouraging text
  * Improved Quick Actions section with larger tap areas (min-height: 44px) for mobile
  * Updated pickup history page with filter buttons and "Total Pickups" counter
  * Added color-coded status indicators (green for completed, blue for scheduled)
  * Implemented "Repeat This Pickup" button for completed pickups
  * Enhanced settings page with grouped profile editing and prominent sign-out button
  * Added support email contact (acapellatrashhmbl@gmail.com) to billing page
  * Improved mobile responsiveness with better button sizes and touch targets
  * Added special instructions field to booking modal for pickup customization
- ✓ Comprehensive test payment simulation system for development and testing:
  * Implemented TestPaymentSimulator class with 60+ realistic test card scenarios
  * Added support for successful payments, declines, expired cards, insufficient funds, CVC failures
  * Created TestCardInfo component displaying expandable test card reference guide
  * Built TestPaymentModal with realistic payment form and card validation
  * Integrated test payment flow into booking modal with seamless user experience
  * Added visual indicators for test mode with "No Real Charges" badges
  * Implemented test card quick-select buttons for rapid testing scenarios
  * Created comprehensive payment confirmation with detailed error handling
  * Added test card clipboard functionality for easy number copying
  * Enhanced payment endpoints to return test card information and mode indicators
- ✓ Final admin dashboard clustering simplification (July 14, 2025):
  * Removed separate clustering page for streamlined navigation
  * Added integrated "View Clusters" button on main admin dashboard
  * Implemented simple cluster cards showing Philadelphia neighborhoods (North Philly, West Philly, Fishtown)
  * Added dual action buttons: "View Details" (customer lists) and "Create Route" (instant optimization)
  * Built expandable customer address details with bag counts and contact information
  * Created real-time route creation with automatic driver assignment functionality
  * Implemented cluster route optimization with Philadelphia neighborhood groupings
- ✓ Subscription confirmation screen implementation:
  * Added "You're all set! 🎉" success modal for completed subscriptions
  * Implemented URL parameter-based redirect system from subscription to dashboard
  * Created full-screen celebration modal with welcome message and next steps
  * Added automatic URL cleanup after displaying success message
  * Enhanced subscription workflow with clear confirmation and dashboard return
- ✓ Geographic clustering system documentation and accuracy analysis:
  * Created comprehensive CLUSTERING_AND_WORKFLOW.md technical documentation
  * Documented mock geocoding system providing 70-80% accuracy for Philadelphia metro
  * Explained "Other Areas" cluster purpose for edge cases and manual review
  * Outlined route completion workflow with driver dashboard integration
  * Documented business workflow cycle and revenue tracking per neighborhood cluster
- ✓ Expanded Philadelphia metropolitan area coverage (July 14, 2025):
  * Extended clustering from 12 to 23 service areas covering tri-state region
  * Added Pennsylvania suburbs: Main Line, Delaware County, Montgomery County, Chester County, Bucks County
  * Included New Jersey metro: Camden County, Cherry Hill, Gloucester County, Burlington County, Moorestown/Marlton
  * Integrated Delaware areas: Wilmington, New Castle County for complete regional coverage
  * Updated geographic bounds to cover 39.4-40.5 latitude, -76.0 to -74.5 longitude
  * Enhanced accuracy to 75-85% for expanded metropolitan service area

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