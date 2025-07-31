# replit.md

## Overview

This is a full-stack web application for "Acapella Trash Removal powered by HMBL" - a residential trash pickup service. The application provides a complete business management system with customer booking, driver route management, admin oversight, and Stripe payment integration. It aims to achieve 100% production readiness, handling concurrent users and providing robust, real-time management for trash removal operations. The system supports 7-day service, custom pricing, and advanced route optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, local state with React hooks
- **UI Library**: Radix UI components with custom styling
- **Styling**: Tailwind CSS with custom design tokens
- **Design Principles**: Responsive design for all screen sizes (mobile, tablet, desktop) with distinct navigation patterns (desktop sidebar, mobile bottom tabs). Color scheme is navy blue (#1e3a8a).

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing, with all new users registering as 'customer' by default and admin-controlled role assignment.
- **Payment Processing**: Stripe integration for subscriptions and one-time payments.
- **API Design**: RESTful endpoints with role-based access control.

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect.
- **Tables**: `users`, `pickups`, `routes`, `subscriptions`.
- **Migrations**: Managed through Drizzle Kit.

### Key Features and Implementations
- **Authentication**: JWT-based with role-based access control (customer, driver, admin) and secure password hashing.
- **Booking System**: Supports one-time pickups and 4-tier recurring subscription packages ($35-$150) with date-based scheduling and tiered pricing. Includes a test payment simulation system for development.
- **Payment Integration**: Secure processing via Stripe Elements, managing subscriptions and automated customer creation.
- **Route Management**: Admin assignment of pickups to drivers. Driver dashboard features advanced route optimization using permutation testing for small routes and nearest neighbor + 2-opt for larger routes, considering Philadelphia-specific traffic patterns and real-time Google Maps integration with optimized multi-stop routes. Includes bulk completion functionality for drivers.
- **Admin Dashboard**: Comprehensive management of users, pickups, and routes. Features a pickup rescheduling system with optional email notifications and integrated clustering for route optimization, showing Philadelphia neighborhood groupings.
- **Email Notifications**: Integrated with Resend for professional HTML email templates for all customer touchpoints (rescheduling, booking confirmations, completion, subscription welcome).

## External Dependencies

- **Database**: Neon Database (PostgreSQL serverless)
- **Payments**: Stripe API
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
- **Email Service**: Resend
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod
- **Mapping**: Google Maps API (for navigation and route optimization)