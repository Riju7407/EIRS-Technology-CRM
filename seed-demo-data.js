#!/usr/bin/env node

/**
 * Seed Demo Data Script
 * Usage: node seed-demo-data.js
 * 
 * This script populates the MongoDB database with demo data for testing
 * Website Users, Orders, Bookings, and Contacts
 */

require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

// Models
const WebsiteUser = require('./server/models/WebsiteUser');
const WebsiteOrder = require('./server/models/WebsiteOrder');
const WebsiteBooking = require('./server/models/WebsiteBooking');
const WebsiteContact = require('./server/models/WebsiteContact');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('\n📊 Checking existing data...');
    
    const [userCount, orderCount, bookingCount, contactCount] = await Promise.all([
      WebsiteUser.countDocuments({ source: 'website' }),
      WebsiteOrder.countDocuments({ source: 'website' }),
      WebsiteBooking.countDocuments({ source: 'website' }),
      WebsiteContact.countDocuments({ source: 'website' }),
    ]);

    if (userCount > 0 || orderCount > 0 || bookingCount > 0 || contactCount > 0) {
      console.log('\n⚠️  Data already exists:');
      console.log(`   - Users: ${userCount}`);
      console.log(`   - Orders: ${orderCount}`);
      console.log(`   - Bookings: ${bookingCount}`);
      console.log(`   - Contacts: ${contactCount}`);
      console.log('\n❓ Clear existing data first? (y/n): ', (await readInput()) === 'y');
      
      if ((await readInput()) === 'y') {
        await Promise.all([
          WebsiteUser.deleteMany({ source: 'website' }),
          WebsiteOrder.deleteMany({ source: 'website' }),
          WebsiteBooking.deleteMany({ source: 'website' }),
          WebsiteContact.deleteMany({ source: 'website' }),
        ]);
        console.log('🗑️  Existing data cleared');
      } else {
        console.log('⏭️  Skipping seed...');
        return;
      }
    }

    console.log('\n🌱 Seeding demo data...\n');

    // Sample users
    const sampleUsers = [
      { externalUserId: 'web-user-001', name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phoneNumber: '9876543210', address: '123 Main Street', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      { externalUserId: 'web-user-002', name: 'Priya Singh', email: 'priya.singh@example.com', phoneNumber: '9876543211', address: '456 Park Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { externalUserId: 'web-user-003', name: 'Amit Patel', email: 'amit.patel@example.com', phoneNumber: '9876543212', address: '789 Business Park', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      { externalUserId: 'web-user-004', name: 'Neha Verma', email: 'neha.verma@example.com', phoneNumber: '9876543213', address: '321 Tech Plaza', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
      { externalUserId: 'web-user-005', name: 'Vikram Singh', email: 'vikram.singh@example.com', phoneNumber: '9876543214', address: '654 Commerce Center', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    ];

    // Sample orders
    const sampleOrders = [
      { externalOrderId: 'WEB-ORDER-001', externalUserId: 'web-user-001', customerName: 'Rajesh Kumar', customerEmail: 'rajesh.kumar@example.com', customerPhone: '9876543210', totalPrice: 4999, totalItems: 2, status: 'Delivered', paymentStatus: 'Completed', paymentMethod: 'Card', notes: 'Delivered successfully' },
      { externalOrderId: 'WEB-ORDER-002', externalUserId: 'web-user-002', customerName: 'Priya Singh', customerEmail: 'priya.singh@example.com', customerPhone: '9876543211', totalPrice: 7500, totalItems: 3, status: 'Shipped', paymentStatus: 'Completed', paymentMethod: 'Online', notes: 'In transit' },
      { externalOrderId: 'WEB-ORDER-003', externalUserId: 'web-user-003', customerName: 'Amit Patel', customerEmail: 'amit.patel@example.com', customerPhone: '9876543212', totalPrice: 3299, totalItems: 1, status: 'Confirmed', paymentStatus: 'Completed', paymentMethod: 'UPI', notes: 'Processing order' },
      { externalOrderId: 'WEB-ORDER-004', externalUserId: 'web-user-004', customerName: 'Neha Verma', customerEmail: 'neha.verma@example.com', customerPhone: '9876543213', totalPrice: 5999, totalItems: 2, status: 'Pending', paymentStatus: 'Pending', paymentMethod: 'Cash on Delivery', notes: 'Awaiting confirmation' },
      { externalOrderId: 'WEB-ORDER-005', externalUserId: 'web-user-005', customerName: 'Vikram Singh', customerEmail: 'vikram.singh@example.com', customerPhone: '9876543214', totalPrice: 12000, totalItems: 5, status: 'Delivered', paymentStatus: 'Completed', paymentMethod: 'Card', notes: 'Bulk order completed' },
    ];

    // Sample bookings
    const sampleBookings = [
      { externalBookingId: 'WEB-BOOK-001', externalUserId: 'web-user-001', serviceName: 'Website Development', servicePrice: 25000, customerName: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phoneNumber: '9876543210', address: '123 Main Street, Delhi', preferredDate: new Date(Date.now() + 7*24*60*60*1000), notes: 'Need responsive design' },
      { externalBookingId: 'WEB-BOOK-002', externalUserId: 'web-user-002', serviceName: 'App Development', servicePrice: 40000, customerName: 'Priya Singh', email: 'priya.singh@example.com', phoneNumber: '9876543211', address: '456 Park Avenue, Mumbai', preferredDate: new Date(Date.now() + 14*24*60*60*1000), notes: 'iOS and Android apps' },
      { externalBookingId: 'WEB-BOOK-003', externalUserId: 'web-user-003', serviceName: 'Consultation', servicePrice: 5000, customerName: 'Amit Patel', email: 'amit.patel@example.com', phoneNumber: '9876543212', address: '789 Business Park, Bangalore', preferredDate: new Date(Date.now() + 3*24*60*60*1000), notes: 'Tech strategy discussion' },
      { externalBookingId: 'WEB-BOOK-004', externalUserId: 'web-user-004', serviceName: 'SEO Optimization', servicePrice: 15000, customerName: 'Neha Verma', email: 'neha.verma@example.com', phoneNumber: '9876543213', address: '321 Tech Plaza, Hyderabad', preferredDate: new Date(Date.now() + 5*24*60*60*1000), notes: 'Google ranking improvement' },
    ];

    // Sample contacts
    const sampleContacts = [
      { externalContactId: 'WEB-CONT-001', name: 'Arjun Gupta', email: 'arjun.gupta@example.com', phoneNumber: '9876543215', subject: 'Website Inquiry', message: 'Interested in your services for our startup' },
      { externalContactId: 'WEB-CONT-002', name: 'Deepika Reddy', email: 'deepika.reddy@example.com', phoneNumber: '9876543216', subject: 'Partnership Request', message: 'Want to explore partnership opportunities' },
      { externalContactId: 'WEB-CONT-003', name: 'Sanjay Mehra', email: 'sanjay.mehra@example.com', phoneNumber: '9876543217', subject: 'Support Needed', message: 'Having issues with the current setup' },
      { externalContactId: 'WEB-CONT-004', name: 'Nisha Joshi', email: 'nisha.joshi@example.com', phoneNumber: '9876543218', subject: 'Feedback', message: 'Great experience with your platform!' },
      { externalContactId: 'WEB-CONT-005', name: 'Rohit Sharma', email: 'rohit.sharma@example.com', phoneNumber: '9876543219', subject: 'Pricing Inquiry', message: 'Need custom pricing for large order' },
    ];

    // Insert all data
    const [users, orders, bookings, contacts] = await Promise.all([
      WebsiteUser.insertMany(sampleUsers.map(u => ({ ...u, source: 'website' }))),
      WebsiteOrder.insertMany(sampleOrders.map(o => ({ ...o, source: 'website', orderDate: o.orderDate || new Date() }))),
      WebsiteBooking.insertMany(sampleBookings.map(b => ({ ...b, source: 'website' }))),
      WebsiteContact.insertMany(sampleContacts.map(c => ({ ...c, source: 'website' }))),
    ]);

    console.log('✅ Data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   • ${users.length} Website Users created`);
    console.log(`   • ${orders.length} Website Orders created`);
    console.log(`   • ${bookings.length} Website Bookings created`);
    console.log(`   • ${contacts.length} Website Contacts created`);
    console.log('\n💡 Total value synced: ₹' + orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString());
    console.log('\n🚀 You can now see the data in CRM!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

const readInput = () => {
  return new Promise(resolve => {
    process.stdin.once('data', data => resolve(data.toString().trim().toLowerCase()));
  });
};

const main = async () => {
  await connectDB();
  await seedData();
  await mongoose.connection.close();
  console.log('✅ Connection closed');
  process.exit(0);
};

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
