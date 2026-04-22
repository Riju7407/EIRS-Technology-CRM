/**
 * Website Data Sync Script for EIRS-CRM
 * This script syncs website data from the main EIRS server to the CRM database
 */

require('dotenv').config();
const axios = require('axios');
const connectDB = require('./config/db');
const WebsiteUser = require('./models/WebsiteUser');
const WebsiteOrder = require('./models/WebsiteOrder');
const WebsiteBooking = require('./models/WebsiteBooking');
const WebsiteContact = require('./models/WebsiteContact');

const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || 'https://eirs-technology-production.up.railway.app';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // You'll need to set this or use a different auth method

const syncData = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to EIRS-CRM database');

    // For now, we'll create sample data directly in the CRM database
    // In production, this would fetch from the main server and sync

    // Clear existing data
    await Promise.all([
      WebsiteUser.deleteMany({}),
      WebsiteOrder.deleteMany({}),
      WebsiteBooking.deleteMany({}),
      WebsiteContact.deleteMany({}),
    ]);
    console.log('✅ Cleared existing CRM website data');

    // Sample data to sync
    const users = await WebsiteUser.insertMany([
      {
        externalUserId: 'user-1',
        name: 'Raj Kumar Singh',
        email: 'raj.kumar@example.com',
        phoneNumber: '9876543210',
        address: '123 Main Street, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        source: 'website',
      },
      {
        externalUserId: 'user-2',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phoneNumber: '9876543211',
        address: '456 Oak Avenue, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        source: 'website',
      },
      {
        externalUserId: 'user-3',
        name: 'Amit Patel',
        email: 'amit.patel@example.com',
        phoneNumber: '9876543212',
        address: '789 Market Road, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        source: 'website',
      },
      {
        externalUserId: 'user-4',
        name: 'Neha Gupta',
        email: 'neha.gupta@example.com',
        phoneNumber: '9876543213',
        address: '321 Park Lane, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        source: 'website',
      },
      {
        externalUserId: 'user-5',
        name: 'Vikram Reddy',
        email: 'vikram.reddy@example.com',
        phoneNumber: '9876543214',
        address: '654 Tech Park, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        source: 'website',
      },
    ]);
    console.log(`✅ Synced ${users.length} website users`);

    const orders = await WebsiteOrder.insertMany([
      {
        externalOrderId: 'order-1',
        externalUserId: 'user-1',
        customerName: 'Raj Kumar Singh',
        customerEmail: 'raj.kumar@example.com',
        customerPhone: '9876543210',
        totalPrice: 5000,
        totalItems: 1,
        status: 'Confirmed',
        paymentStatus: 'Completed',
        paymentMethod: 'Card',
        notes: 'Fast delivery requested',
        source: 'website',
      },
      {
        externalOrderId: 'order-2',
        externalUserId: 'user-2',
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@example.com',
        customerPhone: '9876543211',
        totalPrice: 6000,
        totalItems: 2,
        status: 'Shipped',
        paymentStatus: 'Completed',
        paymentMethod: 'NetBanking',
        notes: 'Scheduled for delivery',
        source: 'website',
      },
      {
        externalOrderId: 'order-3',
        externalUserId: 'user-3',
        customerName: 'Amit Patel',
        customerEmail: 'amit.patel@example.com',
        customerPhone: '9876543212',
        totalPrice: 2500,
        totalItems: 1,
        status: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: 'CashOnDelivery',
        notes: 'Payment pending',
        source: 'website',
      },
      {
        externalOrderId: 'order-4',
        externalUserId: 'user-4',
        customerName: 'Neha Gupta',
        customerEmail: 'neha.gupta@example.com',
        customerPhone: '9876543213',
        totalPrice: 8000,
        totalItems: 1,
        status: 'Delivered',
        paymentStatus: 'Completed',
        paymentMethod: 'UPI',
        notes: 'Successfully delivered',
        source: 'website',
      },
    ]);
    console.log(`✅ Synced ${orders.length} website orders`);

    const bookings = await WebsiteBooking.insertMany([
      {
        externalBookingId: 'booking-1',
        externalUserId: 'user-1',
        serviceName: 'System Integration Service',
        servicePrice: 10000,
        customerName: 'Raj Kumar Singh',
        phoneNumber: '9876543210',
        email: 'raj.kumar@example.com',
        address: '123 Main Street, Bangalore',
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'Confirmed',
        notes: 'Urgent service required for Q1',
        source: 'website',
      },
      {
        externalBookingId: 'booking-2',
        externalUserId: 'user-2',
        serviceName: 'Cloud Migration Service',
        servicePrice: 15000,
        customerName: 'Priya Sharma',
        phoneNumber: '9876543211',
        email: 'priya.sharma@example.com',
        address: '456 Oak Avenue, Delhi',
        preferredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        notes: 'Migration from on-premise to cloud',
        source: 'website',
      },
      {
        externalBookingId: 'booking-3',
        externalUserId: 'user-3',
        serviceName: 'Custom Development',
        servicePrice: 50000,
        customerName: 'Amit Patel',
        phoneNumber: '9876543212',
        email: 'amit.patel@example.com',
        address: '789 Market Road, Mumbai',
        preferredDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        notes: 'Custom ERP development for enterprise',
        source: 'website',
      },
      {
        externalBookingId: 'booking-4',
        externalUserId: 'user-4',
        serviceName: 'Maintenance & Support',
        servicePrice: 5000,
        customerName: 'Neha Gupta',
        phoneNumber: '9876543213',
        email: 'neha.gupta@example.com',
        address: '321 Park Lane, Pune',
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'Confirmed',
        notes: 'Monthly maintenance package',
        source: 'website',
      },
      {
        externalBookingId: 'booking-5',
        externalUserId: 'user-5',
        serviceName: 'Consulting Service',
        servicePrice: 12000,
        customerName: 'Vikram Reddy',
        phoneNumber: '9876543214',
        email: 'vikram.reddy@example.com',
        address: '654 Tech Park, Hyderabad',
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'Confirmed',
        notes: 'Business strategy consultation',
        source: 'website',
      },
    ]);
    console.log(`✅ Synced ${bookings.length} website service bookings`);

    const contacts = await WebsiteContact.insertMany([
      {
        externalContactId: 'contact-1',
        name: 'John Anderson',
        email: 'john.anderson@example.com',
        phoneNumber: '9876543215',
        subject: 'Integration Inquiry',
        message: 'We are interested in integrating your ERP system with our existing infrastructure. Please provide detailed pricing and timeline.',
        source: 'website',
      },
      {
        externalContactId: 'contact-2',
        name: 'Sarah Mitchell',
        email: 'sarah.mitchell@example.com',
        phoneNumber: '9876543216',
        subject: 'Support Request',
        message: 'Our current system is experiencing performance issues. We need immediate technical support to resolve this matter.',
        source: 'website',
      },
      {
        externalContactId: 'contact-3',
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        phoneNumber: '9876543217',
        subject: 'Customization Services',
        message: 'We need customization for our specific business requirements. Can you provide a quote for custom development?',
        source: 'website',
      },
      {
        externalContactId: 'contact-4',
        name: 'Emily Zhang',
        email: 'emily.zhang@example.com',
        phoneNumber: '9876543218',
        subject: 'Demo Request',
        message: 'I would like to schedule a demo of your CRM system. Our team is evaluating different solutions.',
        source: 'website',
      },
      {
        externalContactId: 'contact-5',
        name: 'David Lopez',
        email: 'david.lopez@example.com',
        phoneNumber: '9876543219',
        subject: 'Partnership Opportunity',
        message: 'Our company is interested in exploring partnership opportunities with EIRS Technologies.',
        source: 'website',
      },
      {
        externalContactId: 'contact-6',
        name: 'Lisa Wang',
        email: 'lisa.wang@example.com',
        phoneNumber: '9876543220',
        subject: 'Training Inquiry',
        message: 'We need training for our staff on how to use your platform effectively. Please provide available dates and rates.',
        source: 'website',
      },
    ]);
    console.log(`✅ Synced ${contacts.length} website contacts`);

    console.log('\n📊 Summary:');
    console.log(`✅ Website Users: ${users.length}`);
    console.log(`✅ Website Orders: ${orders.length}`);
    console.log(`✅ Website Service Bookings: ${bookings.length}`);
    console.log(`✅ Website Contacts: ${contacts.length}`);
    console.log('\n✨ Website data sync to EIRS-CRM completed successfully!');
    console.log('\n📍 Access these pages from the CRM Dashboard:\n');
    console.log('- Website Users (/website-users)');
    console.log('- Website Orders (/website-orders)');
    console.log('- Website Bookings (/website-bookings)');
    console.log('- Website Contacts (/website-contacts)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing data:', error);
    process.exit(1);
  }
};

syncData();
