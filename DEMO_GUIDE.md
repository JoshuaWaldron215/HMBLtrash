# Demo Guide: Testing Philadelphia Metro Trash Pickup Service

## Quick Test Flow

### **Step 1: Login as Admin**
- Go to `/login`
- Email: `admin@test.com`
- Password: `password123`
- You'll be redirected to `/admin`

### **Step 2: Create Demo Data**
- In admin dashboard, scroll to "Demo & Testing" section
- Click "Create Demo Data" button
- This creates 8 Philadelphia customers with real addresses:
  - 4 subscription customers ($20/month)
  - 4 package customers (same-day + next-day)

### **Step 3: Test Route Optimization**
- **Option A**: Click "Optimize Subscription Route"
  - Groups all subscription pickups
  - Shows 4 stops across Philly metro
  - Revenue: ~$20 (predictable income)

- **Option B**: Click "Optimize Package Route"  
  - Groups same-day ($25-35) + next-day ($10-15) pickups
  - Shows 4 stops with premium pricing
  - Revenue: ~$80-120 (higher profit)

### **Step 4: Test as Driver**
- Go to `/login`
- Email: `driver@test.com`  
- Password: `password123`
- View optimized route with completion checkboxes
- One-click Google Maps navigation

### **Step 5: Test as Customer**
- Go to `/login`
- Email: `customer@test.com`
- Password: `password123`
- Subscribe for $20/month
- Request pickup

## **Key Demo Addresses** (Philadelphia Metro):
- Center City: 1234 Walnut Street
- South Philly: 567 Passyunk Avenue  
- Delaware County: 890 Lancaster Avenue, Bryn Mawr
- Montgomery County: 123 DeKalb Pike, King of Prussia
- Fishtown: 456 Frankford Avenue
- Bucks County: 789 Street Road, Bensalem
- South Jersey: 321 Route 70, Cherry Hill
- Chester County: 654 High Street, West Chester

## **Business Model Test:**
- **Subscription Route**: Predictable $20-40/day, 4-6 stops, relationship building
- **Package Route**: Premium $80-120/day, 4-6 stops, time-sensitive
- **Geographic Clustering**: Groups by Philly neighborhoods, minimizes drive time

## **No API Required:**
- Route optimization uses geographic clustering (lat/lng coordinates)
- Google Maps links for navigation (no API key needed)
- Simple distance calculations between stops