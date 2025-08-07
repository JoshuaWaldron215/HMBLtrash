# replit.md

## Overview
This is a full-stack web application for **“Acapella Trash Removal powered by HMBL”**—a residential trash pickup service. The application provides a comprehensive business management system covering customer booking, driver route management, admin oversight, and integrated Stripe payments. It aims for production readiness with robust, real‑time operations, concurrent user handling, 7‑day service availability, custom pricing, and advanced route optimization. The initial target market is the Philadelphia metropolitan area (with surrounding tri‑state regions), with broader scalability planned.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript  
- **Routing**: Wouter for client-side routing  
- **State Management**: TanStack Query for server state; local state with React hooks  
- **UI Library**: Radix UI components with custom styling  
- **Styling**: Tailwind CSS with custom design tokens; navy blue color scheme (`#1e3a8a`). Responsive design for mobile, tablet, and desktop with distinct navigation patterns (desktop sidebar, mobile bottom tabs).  
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js  
- **Language**: TypeScript with ESM modules  
- **Database**: PostgreSQL with Drizzle ORM  
- **Authentication**: JWT tokens with bcrypt password hashing; role‑based access control (customer, driver, admin). All new users register as **customer** by default, with admin‑controlled role assignment.  
- **Payment Processing**: Stripe integration for subscriptions and one‑time payments with complete billing history  
- **API Design**: RESTful endpoints with role‑based access control  
- **Email Service**: Resend for professional HTML notifications  
- **Route Optimization**: Advanced algorithm using permutation testing for small routes and nearest‑neighbor + 2‑opt for larger ones, with Philadelphia‑specific travel‑time considerations. Generates Google Maps‑optimized URLs for navigation.

### Production Status - FULLY OPERATIONAL & DEPLOYMENT READY (August 2025)
- **Comprehensive Testing**: All 13 core system tests passed (August 2025)
- **Authentication**: Admin and Driver role access verified and operational
- **Payment System**: Stripe integration fully functional in LIVE production mode
- **Payment Security**: Enhanced subscription flow prevents payment bypass (August 2025)
- **Billing System**: Complete transaction history, subscription management, and invoice integration
- **Mobile Optimization**: Responsive design tested across all device types
- **Admin Dashboard**: Full subscription management with pause/resume/cancel controls - ALL WORKING
- **Customer Dashboard**: Enhanced with detailed subscription package information and pickup scheduling
- **Security**: Enterprise-grade JWT authentication, BCrypt hashing, role-based access
- **Performance**: Optimized queries, lazy loading, compressed assets, real-time updates
- **Real-Time Updates**: All three dashboards auto-sync with configurable intervals and background updates (August 2025)
- **Subscription Management**: Pause, resume, cancel, and rescheduling all operational in production
- **Route Optimization**: Driver route system with Google Maps integration fully functional
- **Revenue Tracking**: $460/month active revenue from 8 subscriptions across all pricing tiers
- **Subscription Pickup Generation**: RESOLVED - Active subscriptions now automatically create pickup records visible on driver dashboard (August 2025)
- **Pickup Completion Workflow**: Subscription pickups auto-schedule next occurrence (7 days later), one-time pickups complete without recurring (August 2025)
- **Date Synchronization**: FIXED - All three dashboards now display consistent dates after reschedule operations (August 2025)
- **UI/UX Issues**: RESOLVED - Reschedule popup z-index fixed, no longer hidden behind other elements (August 2025)
- **Public Launch Ready**: Complete deployment checklist created for going live with paying customers (August 2025)

### Database Design
- **ORM**: Drizzle (PostgreSQL dialect)  
- **Schema Location**: `shared/schema.ts`  
- **Tables**: `users`, `pickups`, `routes`, `subscriptions`  
- **Migrations**: Managed through Drizzle Kit

### Core Features & System Design
- **User Management**: JWT‑based authentication, secure password hashing (bcrypt), role‑based access (customer, driver, admin).  
- **Booking System**: One‑time pickups and recurring subscriptions with automated scheduling. Four subscription packages: Basic ($35/month, weekly), Clean-Carry ($60/month, weekly + services), Heavy-Duty ($75/month, twice-weekly), Premium ($150/month, twice-weekly + lawn service). Automatic pickup generation via subscriptionScheduler.ts.  
- **Payment Integration**: Stripe Elements for secure collection; recurring billing and automated customer creation in Stripe.  
- **Route Management**: Admin assigns pickups to drivers; real‑time pickup status updates. Driver dashboard supports advanced route optimization (see above), bulk completion, Google Maps deep links, and a 7‑day schedule view.  
- **Admin Dashboard**: Business metrics, user and pickup management, route planning, pickup rescheduling (with optional email notifications), and neighborhood clustering to aid optimization—tailored to Philadelphia areas.  
- **Email Notifications**: Resend‑powered HTML templates for key touchpoints (booking confirmations, rescheduling, completion, subscription welcome).  
- **Responsive Design**: Layouts tuned for all screen sizes, with collapsible sidebars on desktop and mobile overlays.  
- **Branding**: “Acapella Trash Removal powered by HMBL.”  
- **Service Availability**: 7 days a week.
- **Payment System**: Full Stripe integration with both one-time payments and subscription billing. Frontend checkout and subscription flows with Stripe Elements for secure payment processing.

## External Dependencies
- **Database**: Neon Database (serverless PostgreSQL)  
- **Payments**: Stripe API  
- **Email Service**: Resend  
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`  
- **UI Components**: Radix UI  
- **Styling**: Tailwind CSS, PostCSS  
- **Icons**: Lucide React  
- **Forms**: React Hook Form, Zod  
- **Mapping/Navigation**: Google Maps (for route generation and navigation)