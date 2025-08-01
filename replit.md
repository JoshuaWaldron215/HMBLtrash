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
- **Payment Processing**: Stripe integration for subscriptions and one‑time payments  
- **API Design**: RESTful endpoints with role‑based access control  
- **Email Service**: Resend for professional HTML notifications  
- **Route Optimization**: Advanced algorithm using permutation testing for small routes and nearest‑neighbor + 2‑opt for larger ones, with Philadelphia‑specific travel‑time considerations. Generates Google Maps‑optimized URLs for navigation.

### Database Design
- **ORM**: Drizzle (PostgreSQL dialect)  
- **Schema Location**: `shared/schema.ts`  
- **Tables**: `users`, `pickups`, `routes`, `subscriptions`  
- **Migrations**: Managed through Drizzle Kit

### Core Features & System Design
- **User Management**: JWT‑based authentication, secure password hashing (bcrypt), role‑based access (customer, driver, admin).  
- **Booking System**: One‑time pickups and recurring subscriptions with date‑based scheduling. Tiered pricing (including 4‑tier subscription packages, roughly $35–$150, depending on bag count and service type). Includes a robust test‑payment simulation for development.  
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