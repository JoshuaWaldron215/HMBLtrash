# replit.md

## Overview
This is a full-stack web application, "Acapella Trash Removal powered by HMBL," providing a comprehensive business management system for residential trash pickup services. It supports customer booking, driver route management, admin oversight, and integrated Stripe payments. The project aims to offer a complete solution for trash removal businesses, streamlining operations from customer acquisition to service delivery and financial management. It targets the Philadelphia metropolitan area, including surrounding tri-state regions, with ambitions for broader scalability.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local state with React hooks
- **UI Library**: Radix UI components with custom styling
- **Styling**: Tailwind CSS with custom design tokens, featuring a navy blue (#1e3a8a) color scheme. Responsive design supports mobile, tablet, and desktop views with adaptive navigation (desktop sidebar, mobile bottom tabs).
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing; role-based access control (customer, driver, admin). All new users register as 'customer' by default, with admin-controlled role assignment.
- **Payment Processing**: Stripe integration for subscriptions and one-time payments.
- **API Design**: RESTful endpoints.
- **Email Service**: Integration with Resend for professional email notifications.
- **Route Optimization**: Advanced algorithm using permutation testing for small routes and nearest neighbor + 2-opt for larger ones, with Philadelphia-specific travel time considerations. Generates Google Maps-optimized URLs.

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Tables**: Users, pickups, routes, subscriptions.

### Core Features & System Design
- **User Management**: JWT-based authentication, multi-role user creation, bcrypt password hashing.
- **Booking System**: Supports one-time pickups and recurring subscriptions with date-based scheduling. Tiered pricing based on bag count and service type, including 4-tier subscription packages.
- **Payment Integration**: Secure processing via Stripe Elements, managing recurring billing and automated customer creation in Stripe. Includes robust test payment simulation.
- **Route Management**: Admin assignment of pickups to drivers, real-time pickup status updates, and dynamic route optimization based on driver's current location. Driver dashboard includes bulk completion functionality and a 7-day schedule view.
- **Admin Dashboard**: Provides business metrics, user and pickup management, and route planning. Includes pickup rescheduling and integrated cluster management.
- **Responsive Design**: Comprehensive layout for all screen sizes, including collapsible sidebars and mobile overlays.
- **Branding**: "Acapella Trash Removal powered by HMBL."
- **Service Availability**: 7 days a week support.

## External Dependencies

- **Database**: Neon Database (PostgreSQL serverless)
- **Payments**: Stripe API
- **Email Service**: Resend
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod
- **Mapping/Navigation**: Google Maps (for route generation)