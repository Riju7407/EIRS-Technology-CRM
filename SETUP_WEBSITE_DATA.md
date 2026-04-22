# Setup Website Data - EIRS-CRM

## Quick Setup - Populate Demo Data

After deploying to Vercel and logging in as admin, follow these steps to populate demo data:

### Option 1: Using Terminal/Curl (Quick)

```bash
# Seed demo data
curl -X POST https://eirs-technology-crm.vercel.app/api/website-sync/seed-demo

# Clear demo data (if needed)
curl -X DELETE https://eirs-technology-crm.vercel.app/api/website-sync/clear-demo
```

### Option 2: Using Browser Console

1. Open the CRM in your browser
2. Login as admin (technologyeirs@gmail.com / EIRS@123crm)
3. Open Browser Console (F12 or Cmd+Opt+J)
4. Run this command:

```javascript
// Seed demo data
fetch('/api/website-sync/seed-demo', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d));

// Or clear demo data
fetch('/api/website-sync/clear-demo', { method: 'DELETE' })
  .then(r => r.json())
  .then(d => console.log(d));
```

### What Gets Created

**5 Website Users**
- Rajesh Kumar (Delhi)
- Priya Singh (Mumbai)
- Amit Patel (Bangalore)
- Neha Verma (Hyderabad)
- Vikram Singh (Pune)

**5 Website Orders**
- Total value: ₹33,797
- Statuses: Pending, Confirmed, Shipped, Delivered
- Payment methods: Card, Online, UPI, Cash on Delivery

**4 Website Service Bookings**
- Website Development (₹25,000)
- App Development (₹40,000)
- Consultation (₹5,000)
- SEO Optimization (₹15,000)

**5 Website Contact Enquiries**
- Various business inquiries
- Feedback and partnership requests
- Support and pricing questions

---

## Data Locations After Setup

After seeding, you can view data at:

- **Website Users**: CRM → Website Users
- **Website Orders**: CRM → Website Orders
- **Website Bookings**: CRM → Website Service Bookings
- **Website Contacts**: CRM → Website Contact Enquiries

All data includes:
- Search/Filter capabilities
- Edit functionality
- Delete capability
- Manual add/create options
- Statistics dashboard

---

## API Endpoints

### Public Endpoints (No Auth Required)

```
POST /api/website-sync/seed-demo          → Create demo data
DELETE /api/website-sync/clear-demo       → Delete all demo data
```

### Protected Endpoints (Admin Auth Required)

```
GET    /api/website-sync/stats            → Get statistics
GET    /api/website-sync/users            → List users
GET    /api/website-sync/orders           → List orders
GET    /api/website-sync/bookings         → List bookings
GET    /api/website-sync/contacts         → List contacts

POST   /api/website-sync/users            → Create user
POST   /api/website-sync/orders           → Create order
POST   /api/website-sync/bookings         → Create booking
POST   /api/website-sync/contacts         → Create contact

PUT    /api/website-sync/users/:id        → Update user
PUT    /api/website-sync/orders/:id       → Update order
PUT    /api/website-sync/bookings/:id     → Update booking
PUT    /api/website-sync/contacts/:id     → Update contact

DELETE /api/website-sync/users/:id        → Delete user
DELETE /api/website-sync/orders/:id       → Delete order
DELETE /api/website-sync/bookings/:id     → Delete booking
DELETE /api/website-sync/contacts/:id     → Delete contact
```

---

## Troubleshooting

### "Demo data already exists" error
- This means data has already been seeded
- Clear it first with DELETE /api/website-sync/clear-demo
- Then reseed with POST /api/website-sync/seed-demo

### Pages still show "No data"
1. Check if you're logged in as admin
2. Try refreshing the page (F5)
3. Open browser console to check for errors
4. Verify the seed endpoint was called successfully

### Cannot access endpoints
1. Ensure you're logged in with admin account
2. Check that the token is being sent in Authorization header
3. Verify Vercel deployment completed successfully
