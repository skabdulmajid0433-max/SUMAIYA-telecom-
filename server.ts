import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data folder
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed database
function getInitialDatabase() {
  const now = new Date().toISOString();
  return {
    settings: {
      shopName: 'Sumaiya telecom',
      ownerName: 'sk abdulmajid',
      phone: '9679100433',
      whatsapp: '9679100433',
      email: 'skabdulmajid0433@gmail.com',
      address: 'Main Market, Station Road, Rampurhat, Birbhum, West Bengal 731224',
      gstNumber: '19AABCS1234F1Z5',
      currency: '₹',
      taxRate: 0,
      invoicePrefix: 'INV',
      repairPrefix: 'REP',
      terms: '1. Customer is advised to take complete backup of personal data. Shop is not responsible for data loss.\n2. Please inspect the device carefully upon delivery.\n3. Physical, water, or electric surge damage voids any testing warranty.\n4. Parts replacement comes with 30-day testing warranty unless specified otherwise.\n5. Uncollected items after 30 days of completion notification may be disposed of.',
      invoiceFooter: 'Thank you for your business at Sumaiya telecom! For fast WhatsApp support, message 9679100433.',
      allowNegativeStock: false,
      lowStockThreshold: 3,
      allowDeliveryWithDue: true,
      dailySalaryPresentPercent: 100,
      dailySalaryHalfDayPercent: 50,
      dailySalaryAbsentPercent: 0,
      dailySalaryLeavePercent: 100,
      smsSenderId: 'SUMTEL',
      smsApiKey: ''
    },
    users: [
      { id: 'usr-1', name: 'sk abdulmajid', role: 'admin', username: 'owner', pin: '1234', phone: '9679100433', active: true },
      { id: 'usr-2', name: 'Rahim Khan', role: 'manager', username: 'manager', pin: '2222', phone: '9876543210', active: true },
      { id: 'usr-3', name: 'Tapas Das (Technician)', role: 'staff', username: 'staff', pin: '3333', phone: '9832109876', active: true }
    ],
    customers: [
      { id: 'CUST-0001', name: 'Rahim Mondal', phone: '9876543210', altPhone: '9876543211', whatsapp: '9876543210', email: 'rahim@example.com', address: 'Ward 5, Rampurhat', notes: 'Regular customer', active: true, createdAt: now, updatedAt: now },
      { id: 'CUST-0002', name: 'Subhash Ghosh', phone: '9434123456', altPhone: '', whatsapp: '9434123456', email: '', address: 'Nalhati Bus Stand', notes: '', active: true, createdAt: now, updatedAt: now },
      { id: 'CUST-0003', name: 'Anisur Rahman', phone: '9732987654', altPhone: '', whatsapp: '9732987654', email: '', address: 'Margram Bazar', notes: 'Wholesale buyer for tempered glass', active: true, createdAt: now, updatedAt: now },
      { id: 'CUST-0004', name: 'Amitava Sen', phone: '8918234567', altPhone: '', whatsapp: '8918234567', email: '', address: 'Sainthia Road', notes: '', active: true, createdAt: now, updatedAt: now }
    ],
    products: [
      {
        id: 'prod-1',
        sku: 'LCD-SAM-A15',
        barcode: '890123456701',
        name: 'Samsung Galaxy A15 LCD Screen (Original Folder)',
        category: 'LCD / Display',
        subcategory: 'Display Folder',
        brand: 'Samsung',
        compatibleModels: 'Galaxy A15 4G/5G, SM-A155F, SM-A156B',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchasePrice: 1200,
        sellingPrice: 1800,
        minSellingPrice: 1650,
        wholesalePrice: 1500,
        quantity: 8,
        minStockLevel: 2,
        unit: 'Pcs',
        rackLocation: 'A-01',
        warranty: '30 Days Testing',
        taxPercent: 0,
        description: 'High brightness FHD+ AMOLED replacement display combo',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-2',
        sku: 'LCD-RED-N12',
        barcode: '890123456702',
        name: 'Redmi Note 12 Original Display Combo',
        category: 'LCD / Display',
        subcategory: 'Display Folder',
        brand: 'Xiaomi / Redmi',
        compatibleModels: 'Redmi Note 12 4G / 5G',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchasePrice: 1350,
        sellingPrice: 2100,
        minSellingPrice: 1950,
        wholesalePrice: 1750,
        quantity: 6,
        minStockLevel: 2,
        unit: 'Pcs',
        rackLocation: 'A-02',
        warranty: '30 Days Testing',
        taxPercent: 0,
        description: 'Smooth 120Hz compatible OLED assembly',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-3',
        sku: 'LCD-VIV-Y20',
        barcode: '890123456703',
        name: 'Vivo Y20 / Y12 / Y15 Display Combo',
        category: 'LCD / Display',
        subcategory: 'Display Folder',
        brand: 'Vivo',
        compatibleModels: 'Vivo Y20, Y20i, Y12s, Y15s',
        supplierId: 'sup-3',
        supplierName: 'Star Display Wholesalers',
        purchasePrice: 850,
        sellingPrice: 1450,
        minSellingPrice: 1300,
        wholesalePrice: 1100,
        quantity: 11,
        minStockLevel: 3,
        unit: 'Pcs',
        rackLocation: 'A-03',
        warranty: '30 Days Testing',
        taxPercent: 0,
        description: 'Grade A+ IPS LCD with responsive touch flex',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-4',
        sku: 'BAT-IPH-11',
        barcode: '890123456704',
        name: 'iPhone 11 Battery High Capacity (3110mAh)',
        category: 'Spare Parts',
        subcategory: 'Battery',
        brand: 'Apple',
        compatibleModels: 'Apple iPhone 11 (A2111, A2221)',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchasePrice: 1050,
        sellingPrice: 1900,
        minSellingPrice: 1700,
        wholesalePrice: 1450,
        quantity: 5,
        minStockLevel: 2,
        unit: 'Pcs',
        rackLocation: 'B-01',
        warranty: '6 Months Replacement',
        taxPercent: 0,
        description: 'Zero cycle pure cobalt high performance battery',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-5',
        sku: 'SPR-CHG-TC10',
        barcode: '890123456705',
        name: 'Type-C Charging Sub-Board Flex Universal',
        category: 'Spare Parts',
        subcategory: 'Charging Flex',
        brand: 'Universal',
        compatibleModels: 'Samsung / Redmi / Realme Type-C models',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchasePrice: 90,
        sellingPrice: 350,
        minSellingPrice: 280,
        wholesalePrice: 180,
        quantity: 24,
        minStockLevel: 5,
        unit: 'Pcs',
        rackLocation: 'B-02',
        warranty: 'Testing Warranty',
        taxPercent: 0,
        description: 'Microphone & fast-charging supported sub PCB board',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-6',
        sku: 'TLS-GLU-T70',
        barcode: '890123456706',
        name: 'T-7000 Black Multi-Purpose Liquid Adhesive (50ml)',
        category: 'Tools & Consumables',
        subcategory: 'Glue / Adhesive',
        brand: 'Zhanlida',
        compatibleModels: 'Universal Phone Frames & LCDs',
        supplierId: 'sup-3',
        supplierName: 'Star Display Wholesalers',
        purchasePrice: 110,
        sellingPrice: 220,
        minSellingPrice: 190,
        wholesalePrice: 150,
        quantity: 14,
        minStockLevel: 3,
        unit: 'Tube',
        rackLocation: 'C-01',
        warranty: 'None',
        taxPercent: 0,
        description: 'High elastic black frame glue for screen replacement',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-7',
        sku: 'ACC-CHG-65W',
        barcode: '890123456707',
        name: '65W SuperVOOC & Dart Ultra-Fast Charger Adapter',
        category: 'Accessories',
        subcategory: 'Wall Charger',
        brand: 'Realme / OnePlus Compatible',
        compatibleModels: 'Realme, Oppo, OnePlus, Vivo Type-C phones',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        purchasePrice: 320,
        sellingPrice: 650,
        minSellingPrice: 550,
        wholesalePrice: 440,
        quantity: 14,
        minStockLevel: 4,
        unit: 'Pcs',
        rackLocation: 'D-01',
        warranty: '3 Months Warranty',
        taxPercent: 0,
        description: 'Dual IC surge protected 65W flash wall charger',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-8',
        sku: 'ACC-CBL-3IN1',
        barcode: '890123456708',
        name: 'Nylon Braided 3-in-1 Fast Charging Cable (1.2m)',
        category: 'Accessories',
        subcategory: 'Cables',
        brand: 'MaxPro',
        compatibleModels: 'Lightning + Type-C + Micro USB',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        purchasePrice: 85,
        sellingPrice: 220,
        minSellingPrice: 180,
        wholesalePrice: 130,
        quantity: 18,
        minStockLevel: 5,
        unit: 'Pcs',
        rackLocation: 'D-02',
        warranty: '1 Month Replacement',
        taxPercent: 0,
        description: 'Durable zinc alloy connector heads with 3.1A fast power',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-9',
        sku: 'ACC-TMP-9D',
        barcode: '890123456709',
        name: '9D Full Glue Curved Tempered Glass (Assorted Models)',
        category: 'Accessories',
        subcategory: 'Screen Protector',
        brand: 'Super D',
        compatibleModels: 'Samsung / Redmi / Realme / Vivo / Oppo',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        purchasePrice: 22,
        sellingPrice: 99,
        minSellingPrice: 70,
        wholesalePrice: 40,
        quantity: 55,
        minStockLevel: 15,
        unit: 'Pcs',
        rackLocation: 'D-03',
        warranty: 'None',
        taxPercent: 0,
        description: 'Anti-scratch 9H tempered glass with edge-to-edge glue',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-10',
        sku: 'ACC-TWS-PRO',
        barcode: '890123456710',
        name: 'TWS Wireless Bluetooth Earbuds Pro (Active ENC)',
        category: 'Accessories',
        subcategory: 'Audio / TWS',
        brand: 'Airdopes Clone',
        compatibleModels: 'All Bluetooth Android & iOS Phones',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        purchasePrice: 420,
        sellingPrice: 899,
        minSellingPrice: 799,
        wholesalePrice: 620,
        quantity: 8,
        minStockLevel: 3,
        unit: 'Pcs',
        rackLocation: 'D-04',
        warranty: '3 Months Shop Warranty',
        taxPercent: 0,
        description: 'Deep bass stereo sound, 28-hr battery backup with case',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-11',
        sku: 'ACC-COV-SMK',
        barcode: '890123456711',
        name: 'Matte Smoke Translucent Shockproof Bumper Case',
        category: 'Accessories',
        subcategory: 'Mobile Covers',
        brand: 'ArmorShield',
        compatibleModels: 'Latest Samsung, Redmi, Realme & iPhone Series',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        purchasePrice: 45,
        sellingPrice: 150,
        minSellingPrice: 120,
        wholesalePrice: 80,
        quantity: 2, // low stock for alert testing!
        minStockLevel: 5,
        unit: 'Pcs',
        rackLocation: 'D-05',
        warranty: 'None',
        taxPercent: 0,
        description: 'Anti-fingerprint matte PC back with soft colorful TPU edges',
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    repairs: [
      {
        id: 'REP-2026-0001',
        customerId: 'CUST-0001',
        customerName: 'Rahim Mondal',
        customerPhone: '9876543210',
        customerWhatsapp: '9876543210',
        customerAddress: 'Ward 5, Rampurhat',
        brand: 'Samsung',
        model: 'Galaxy A15 5G',
        imei1: '354890123456781',
        imei2: '354890123456782',
        color: 'Blue Black',
        deviceCondition: ['Screen broken', 'Touch problem', 'Body scratched'],
        lockCode: 'Pattern: Z shape (Unlocked by customer)',
        simReceived: false,
        sdCardReceived: false,
        chargerReceived: false,
        batteryCondition: 'Good (85%)',
        otherAccessories: 'None',
        problemDescription: 'Touch screen not responding after fall on concrete, glass cracked on top right corner.',
        technicianNotes: 'Folder replacement required. Inner chassis aligned.',
        estimatedCost: 1950,
        advancePaid: 500,
        remainingAmount: 1450,
        expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        assignedTechnician: 'Tapas Das (Technician)',
        priority: 'High',
        status: 'Repairing',
        statusHistory: [
          { status: 'Received', date: new Date(Date.now() - 3600000 * 5).toISOString(), staffName: 'Rahim Khan', note: 'Customer deposited device with ₹500 advance.' },
          { status: 'Checking', date: new Date(Date.now() - 3600000 * 3).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Motherboard is intact, display combo test successful.' },
          { status: 'Repairing', date: new Date(Date.now() - 3600000 * 1).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Fitting original folder with T-7000 glue.' }
        ],
        partsUsed: [
          { productId: 'prod-1', productName: 'Samsung Galaxy A15 LCD Screen (Original Folder)', sku: 'LCD-SAM-A15', quantity: 1, costPrice: 1200, sellingPrice: 1800, isIncludedInRepairPrice: true }
        ],
        photos: [],
        warrantyDays: 30,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        createdBy: 'Rahim Khan',
        updatedAt: now,
        updatedBy: 'Tapas Das (Technician)',
        active: true
      },
      {
        id: 'REP-2026-0002',
        customerId: 'CUST-0002',
        customerName: 'Subhash Ghosh',
        customerPhone: '9434123456',
        customerWhatsapp: '9434123456',
        customerAddress: 'Nalhati Bus Stand',
        brand: 'Vivo',
        model: 'Y20i',
        imei1: '864501234567892',
        imei2: '',
        color: 'Nebula Blue',
        deviceCondition: ['Charging problem', 'Speaker low sound'],
        lockCode: 'PIN: 2580',
        simReceived: false,
        sdCardReceived: false,
        chargerReceived: true,
        batteryCondition: 'Good',
        otherAccessories: 'Transparent back cover',
        problemDescription: 'Charging cable disconnects when moved. Speaker full of dust.',
        technicianNotes: 'Type-C sub-board replaced and speaker mesh ultrasonic cleaned.',
        estimatedCost: 650,
        advancePaid: 200,
        remainingAmount: 450,
        expectedDeliveryDate: new Date().toISOString().split('T')[0],
        assignedTechnician: 'Tapas Das (Technician)',
        priority: 'Normal',
        status: 'Ready',
        statusHistory: [
          { status: 'Received', date: new Date(Date.now() - 86400000).toISOString(), staffName: 'sk abdulmajid', note: 'Received with original charger' },
          { status: 'Repairing', date: new Date(Date.now() - 3600000 * 12).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Replaced sub-board' },
          { status: 'Ready', date: new Date(Date.now() - 3600000 * 2).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Testing complete. Rapid charging working 100%.' }
        ],
        partsUsed: [
          { productId: 'prod-5', productName: 'Type-C Charging Sub-Board Flex Universal', sku: 'SPR-CHG-TC10', quantity: 1, costPrice: 90, sellingPrice: 350, isIncludedInRepairPrice: true }
        ],
        photos: [],
        warrantyDays: 15,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'sk abdulmajid',
        updatedAt: now,
        updatedBy: 'Tapas Das (Technician)',
        active: true
      },
      {
        id: 'REP-2026-0003',
        customerId: 'CUST-0004',
        customerName: 'Amitava Sen',
        customerPhone: '8918234567',
        customerWhatsapp: '8918234567',
        customerAddress: 'Sainthia Road',
        brand: 'Apple',
        model: 'iPhone 11',
        imei1: '359123456789013',
        imei2: '',
        color: 'Black',
        deviceCondition: ['Battery problem', 'Heats up during calls'],
        lockCode: 'Face ID / Passcode provided in shop',
        simReceived: false,
        sdCardReceived: false,
        chargerReceived: false,
        batteryCondition: 'Degraded (68% Service status in iOS settings)',
        otherAccessories: 'None',
        problemDescription: 'Battery backup only 2 hours. Phone turns off at 20%.',
        technicianNotes: 'Need original grade battery replacement with BMS flex transfer.',
        estimatedCost: 2200,
        advancePaid: 1000,
        remainingAmount: 1200,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        assignedTechnician: 'sk abdulmajid',
        priority: 'Urgent',
        status: 'Checking',
        statusHistory: [
          { status: 'Received', date: new Date(Date.now() - 3600000 * 2).toISOString(), staffName: 'sk abdulmajid', note: 'Customer accepted initial estimate of ₹2200.' },
          { status: 'Checking', date: new Date(Date.now() - 3600000 * 1).toISOString(), staffName: 'sk abdulmajid', note: 'Running diagnostic current draw test on DC power supply.' }
        ],
        partsUsed: [],
        photos: [],
        warrantyDays: 180,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdBy: 'sk abdulmajid',
        updatedAt: now,
        updatedBy: 'sk abdulmajid',
        active: true
      },
      {
        id: 'REP-2026-0004',
        customerId: 'CUST-0003',
        customerName: 'Anisur Rahman',
        customerPhone: '9732987654',
        customerWhatsapp: '9732987654',
        customerAddress: 'Margram Bazar',
        brand: 'Xiaomi / Redmi',
        model: 'Redmi Note 12 5G',
        imei1: '869123456789045',
        imei2: '',
        color: 'Frosted Green',
        deviceCondition: ['Screen broken', 'Water damage'],
        lockCode: 'PIN: 1122',
        simReceived: false,
        sdCardReceived: false,
        chargerReceived: false,
        batteryCondition: 'Good',
        otherAccessories: 'None',
        problemDescription: 'Water spill during rain, screen flickering and blank.',
        technicianNotes: 'Ultrasonic board wash done, replaced Redmi Note 12 Display Combo.',
        estimatedCost: 2400,
        advancePaid: 1500,
        remainingAmount: 0,
        expectedDeliveryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        assignedTechnician: 'Tapas Das (Technician)',
        priority: 'Normal',
        status: 'Delivered',
        statusHistory: [
          { status: 'Received', date: new Date(Date.now() - 86400000 * 3).toISOString(), staffName: 'Rahim Khan', note: 'Advance ₹1500 received' },
          { status: 'Repairing', date: new Date(Date.now() - 86400000 * 2).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Fitted new combo' },
          { status: 'Ready', date: new Date(Date.now() - 86400000 * 1).toISOString(), staffName: 'Tapas Das (Technician)', note: 'Phone fully tested' },
          { status: 'Delivered', date: new Date(Date.now() - 3600000 * 8).toISOString(), staffName: 'sk abdulmajid', note: 'Customer tested and took delivery. Remaining ₹900 paid via UPI.' }
        ],
        partsUsed: [
          { productId: 'prod-2', productName: 'Redmi Note 12 Original Display Combo', sku: 'LCD-RED-N12', quantity: 1, costPrice: 1350, sellingPrice: 2100, isIncludedInRepairPrice: true }
        ],
        photos: [],
        warrantyDays: 30,
        warrantyExpiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
        deliveredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        deliveredBy: 'sk abdulmajid',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdBy: 'Rahim Khan',
        updatedAt: now,
        updatedBy: 'sk abdulmajid',
        active: true
      }
    ],
    invoices: [
      {
        id: 'INV-2026-0001',
        invoiceType: 'repair',
        repairId: 'REP-2026-0004',
        customerId: 'CUST-0003',
        customerName: 'Anisur Rahman',
        customerPhone: '9732987654',
        items: [
          { id: 'item-1', type: 'repair', repairId: 'REP-2026-0004', description: 'Redmi Note 12 Water Damage Cleaning & Original Display Replacement', quantity: 1, unitPrice: 2400, discount: 0, total: 2400 }
        ],
        subtotal: 2400,
        discount: 0,
        taxAmount: 0,
        taxPercent: 0,
        totalAmount: 2400,
        paidAmount: 2400,
        dueAmount: 0,
        paymentStatus: 'Paid',
        payments: [
          { id: 'pay-1', date: new Date(Date.now() - 86400000 * 3).toISOString(), amount: 1500, method: 'Cash', referenceNumber: 'ADVANCE-CASH', notes: 'Initial intake advance', recordedBy: 'Rahim Khan' },
          { id: 'pay-2', date: new Date(Date.now() - 3600000 * 8).toISOString(), amount: 900, method: 'UPI', referenceNumber: 'UPI/20261005/982134', notes: 'Delivery final balance', recordedBy: 'sk abdulmajid' }
        ],
        notes: 'Delivery completed with 30 days testing warranty on display.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdBy: 'Rahim Khan',
        updatedAt: now
      },
      {
        id: 'INV-2026-0002',
        invoiceType: 'sales',
        customerId: 'CUST-0001',
        customerName: 'Rahim Mondal',
        customerPhone: '9876543210',
        items: [
          { id: 'item-2', type: 'product', productId: 'prod-7', description: '65W SuperVOOC & Dart Ultra-Fast Charger Adapter', quantity: 1, unitPrice: 650, discount: 50, total: 600 },
          { id: 'item-3', type: 'product', productId: 'prod-8', description: 'Nylon Braided 3-in-1 Fast Charging Cable (1.2m)', quantity: 1, unitPrice: 220, discount: 20, total: 200 }
        ],
        subtotal: 870,
        discount: 70,
        taxAmount: 0,
        taxPercent: 0,
        totalAmount: 800,
        paidAmount: 500,
        dueAmount: 300,
        paymentStatus: 'Partially Paid',
        payments: [
          { id: 'pay-3', date: new Date(Date.now() - 3600000 * 4).toISOString(), amount: 500, method: 'Cash', referenceNumber: '', notes: 'Customer promised to pay remaining ₹300 during phone collection', recordedBy: 'Rahim Khan' }
        ],
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        notes: 'Due ₹300 pending against Rahim Mondal',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        createdBy: 'Rahim Khan',
        updatedAt: now
      },
      {
        id: 'INV-2026-0003',
        invoiceType: 'combined',
        customerId: 'CUST-0002',
        customerName: 'Subhash Ghosh',
        customerPhone: '9434123456',
        repairId: 'REP-2026-0002',
        items: [
          { id: 'item-4', type: 'repair', repairId: 'REP-2026-0002', description: 'Vivo Y20i Charging Port Sub-Board Replacement & Service', quantity: 1, unitPrice: 650, discount: 0, total: 650 },
          { id: 'item-5', type: 'product', productId: 'prod-9', description: '9D Full Glue Curved Tempered Glass', quantity: 1, unitPrice: 99, discount: 0, total: 99 }
        ],
        subtotal: 749,
        discount: 0,
        taxAmount: 0,
        taxPercent: 0,
        totalAmount: 749,
        paidAmount: 200,
        dueAmount: 549,
        paymentStatus: 'Partially Paid',
        payments: [
          { id: 'pay-4', date: new Date(Date.now() - 86400000).toISOString(), amount: 200, method: 'Cash', referenceNumber: 'ADVANCE-CASH', notes: 'Advance for repair', recordedBy: 'sk abdulmajid' }
        ],
        dueDate: new Date().toISOString().split('T')[0],
        notes: 'Repair ready, pending delivery payment.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'sk abdulmajid',
        updatedAt: now
      }
    ],
    stockMovements: [
      { id: 'stk-1', date: new Date(Date.now() - 86400000 * 5).toISOString(), productId: 'prod-1', productName: 'Samsung Galaxy A15 LCD Screen', sku: 'LCD-SAM-A15', type: 'PURCHASE', quantityIn: 10, quantityOut: 0, balance: 10, referenceId: 'PUR-2026-0001', reason: 'Stock inward from supplier', user: 'sk abdulmajid' },
      { id: 'stk-2', date: new Date(Date.now() - 86400000 * 2).toISOString(), productId: 'prod-1', productName: 'Samsung Galaxy A15 LCD Screen', sku: 'LCD-SAM-A15', type: 'REPAIR', quantityIn: 0, quantityOut: 1, balance: 9, referenceId: 'REP-2026-0001', reason: 'Used in repair job #REP-2026-0001', user: 'Tapas Das (Technician)' },
      { id: 'stk-3', date: new Date(Date.now() - 86400000 * 4).toISOString(), productId: 'prod-7', productName: '65W SuperVOOC Fast Charger', sku: 'ACC-CHG-65W', type: 'SALE', quantityIn: 0, quantityOut: 1, balance: 14, referenceId: 'INV-2026-0002', reason: 'Customer invoice #INV-2026-0002', user: 'Rahim Khan' }
    ],
    suppliers: [
      { id: 'sup-1', name: 'Ganesh Das', companyName: 'National Mobile Spares Kolkata', phone: '9831001122', whatsapp: '9831001122', email: 'sales@nationalspares.in', address: 'Chandni Chowk Market, Kolkata', gstNumber: '19AABCN5566G1Z2', notes: 'Best rates for original displays and batteries', active: true, createdAt: now },
      { id: 'sup-2', name: 'Sunil Kumar', companyName: 'Royal Accessories Hub Delhi', phone: '9811002233', whatsapp: '9811002233', email: 'royalacc@hub.com', address: 'Karol Bagh, New Delhi', gstNumber: '07AAACR8899K1Z4', notes: 'Chargers, cables, covers, wholesale shipments by parcel', active: true, createdAt: now },
      { id: 'sup-3', name: 'Md. Farooq', companyName: 'Star Display Wholesalers', phone: '9830114455', whatsapp: '9830114455', email: 'stardisplays@gmail.com', address: 'Malda Spares Market', gstNumber: '', notes: 'Budget combos, frame glues and repair tools', active: true, createdAt: now }
    ],
    purchases: [
      {
        id: 'PUR-2026-0001',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        invoiceNumber: 'NAT-INV-8891',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        items: [
          { productId: 'prod-1', productName: 'Samsung Galaxy A15 LCD Screen (Original Folder)', category: 'LCD / Display', quantity: 10, purchasePrice: 1200, sellingPrice: 1800, total: 12000 },
          { productId: 'prod-2', productName: 'Redmi Note 12 Original Display Combo', category: 'LCD / Display', quantity: 8, purchasePrice: 1350, sellingPrice: 2100, total: 10800 }
        ],
        totalAmount: 22800,
        paidAmount: 15000,
        dueAmount: 7800,
        paymentStatus: 'Partially Paid',
        paymentMethod: 'Bank Transfer',
        notes: 'Remaining ₹7,800 to be cleared in next bill cycle',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        createdBy: 'sk abdulmajid'
      },
      {
        id: 'PUR-2026-0002',
        supplierId: 'sup-2',
        supplierName: 'Royal Accessories Hub Delhi',
        invoiceNumber: 'ROY-DEL-4412',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        items: [
          { productId: 'prod-7', productName: '65W SuperVOOC & Dart Ultra-Fast Charger Adapter', category: 'Accessories', quantity: 15, purchasePrice: 320, sellingPrice: 650, total: 4800 },
          { productId: 'prod-8', productName: 'Nylon Braided 3-in-1 Fast Charging Cable (1.2m)', category: 'Accessories', quantity: 20, purchasePrice: 85, sellingPrice: 220, total: 1700 },
          { productId: 'prod-9', productName: '9D Full Glue Curved Tempered Glass (Assorted)', category: 'Accessories', quantity: 60, purchasePrice: 22, sellingPrice: 99, total: 1320 }
        ],
        totalAmount: 7820,
        paidAmount: 7820,
        dueAmount: 0,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        notes: 'Paid via PhonePe at delivery parcel receipt',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdBy: 'sk abdulmajid'
      }
    ],
    supplierReturns: [
      {
        id: 'RET-0001',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchaseId: 'PUR-2026-0001',
        productId: 'prod-2',
        productName: 'Redmi Note 12 Original Display Combo',
        quantity: 1,
        purchasePrice: 1350,
        totalAmount: 1350,
        reason: 'Touch flex defective during pre-fit testing',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        notes: 'Replacement or credit note issued by supplier',
        createdBy: 'Tapas Das (Technician)'
      }
    ],
    supplierPayments: [
      {
        id: 'SPAY-0001',
        supplierId: 'sup-1',
        supplierName: 'National Mobile Spares Kolkata',
        purchaseId: 'PUR-2026-0001',
        amount: 15000,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'NEFT9923847291',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        notes: 'Advance part payment against invoice NAT-INV-8891',
        createdBy: 'sk abdulmajid'
      }
    ],
    staff: [
      { id: 'stf-1', name: 'sk abdulmajid', phone: '9679100433', address: 'Station Road, Rampurhat', joiningDate: '2020-01-01', jobRole: 'Shop Owner & Senior Tech', salaryType: 'monthly', dailySalary: 0, monthlySalary: 0, emergencyContact: '9679100433', status: 'active', notes: 'Owner' },
      { id: 'stf-2', name: 'Rahim Khan', phone: '9876543210', address: 'Dakshin Ramchandrapur', joiningDate: '2022-04-15', jobRole: 'Store Manager & Billing', salaryType: 'monthly', dailySalary: 600, monthlySalary: 18000, emergencyContact: '9876543219', status: 'active', notes: 'Handles customer reception, billing & inventory' },
      { id: 'stf-3', name: 'Tapas Das', phone: '9832109876', address: 'Nalhati Sub-Division', joiningDate: '2023-02-10', jobRole: 'Hardware & Display Technician', salaryType: 'daily', dailySalary: 650, monthlySalary: 0, emergencyContact: '9832109870', status: 'active', notes: 'Specialist in LCD folder replacement, charging flex & micro-soldering' },
      { id: 'stf-4', name: 'Bappi Mondal', phone: '8927112233', address: 'Rampurhat Ward 2', joiningDate: '2023-11-01', jobRole: 'Accessories Sales & Helper', salaryType: 'daily', dailySalary: 450, monthlySalary: 0, emergencyContact: '8927112230', status: 'active', notes: 'Tempered glass fitting and accessories sale' }
    ],
    attendance: [
      { id: 'att-1', date: new Date().toISOString().split('T')[0], staffId: 'stf-2', staffName: 'Rahim Khan', status: 'Present', checkIn: '09:30 AM', checkOut: '08:30 PM', workingHours: 11, earnedSalary: 600, notes: 'On time' },
      { id: 'att-2', date: new Date().toISOString().split('T')[0], staffId: 'stf-3', staffName: 'Tapas Das', status: 'Present', checkIn: '10:00 AM', checkOut: '08:00 PM', workingHours: 10, earnedSalary: 650, notes: 'On time' },
      { id: 'att-3', date: new Date().toISOString().split('T')[0], staffId: 'stf-4', staffName: 'Bappi Mondal', status: 'Present', checkIn: '10:15 AM', checkOut: '08:30 PM', workingHours: 10.25, earnedSalary: 450, notes: '' },
      { id: 'att-4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], staffId: 'stf-2', staffName: 'Rahim Khan', status: 'Present', checkIn: '09:30 AM', checkOut: '08:30 PM', workingHours: 11, earnedSalary: 600, notes: '' },
      { id: 'att-5', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], staffId: 'stf-3', staffName: 'Tapas Das', status: 'Present', checkIn: '10:00 AM', checkOut: '08:00 PM', workingHours: 10, earnedSalary: 650, notes: '' },
      { id: 'att-6', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], staffId: 'stf-4', staffName: 'Bappi Mondal', status: 'Half Day', checkIn: '10:00 AM', checkOut: '02:30 PM', workingHours: 4.5, earnedSalary: 225, notes: 'Personal work in afternoon' }
    ],
    salaryPayments: [
      { id: 'sal-1', staffId: 'stf-3', staffName: 'Tapas Das', period: 'Last Week (W39)', totalEarned: 3900, advance: 500, deduction: 0, netSalary: 3400, paidAmount: 3400, remainingAmount: 0, paymentDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], paymentMethod: 'Cash', status: 'Paid', notes: 'Weekly wages settled', createdBy: 'sk abdulmajid' }
    ],
    expenses: [
      { id: 'exp-1', date: new Date().toISOString().split('T')[0], category: 'Tea/Food', amount: 120, paymentMethod: 'Cash', description: 'Morning tea & snacks for staff and visitors', addedBy: 'Rahim Khan' },
      { id: 'exp-2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], category: 'Tools & Equipment', amount: 450, paymentMethod: 'UPI', description: 'Bought 0.08mm LCD cutting wire & anti-static tweezers', addedBy: 'sk abdulmajid' },
      { id: 'exp-3', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], category: 'Electricity', amount: 1650, paymentMethod: 'UPI', description: 'Shop WBSEDCL monthly electric bill', addedBy: 'sk abdulmajid' }
    ],
    auditLogs: [
      { id: 'aud-1', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), action: 'SYSTEM_BOOTSTRAP', entityType: 'SYSTEM', entityId: 'sys', details: 'Initialized Sumaiya telecom database for sk abdulmajid (9679100433)', performedBy: 'System' },
      { id: 'aud-2', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), action: 'REPAIR_CREATED', entityType: 'REPAIR', entityId: 'REP-2026-0001', details: 'Created repair job for Samsung A15 5G - Rahim Mondal', performedBy: 'Rahim Khan' }
    ]
  };
}

// Database helper
class DatabaseManager {
  private db: any = null;

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.db = getInitialDatabase();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        // Ensure all collections exist
        const initial = getInitialDatabase();
        for (const key of Object.keys(initial)) {
          if (!this.db[key]) {
            this.db[key] = (initial as any)[key];
          }
        }
      } catch (err) {
        console.error('Failed reading database file, recreating:', err);
        this.db = getInitialDatabase();
        this.save();
      }
    }
  }

  get data() {
    if (!this.db) {
      this.init();
    }
    return this.db;
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  logAudit(action: string, entityType: string, entityId: string, details: string, performedBy: string) {
    const entry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      performedBy: performedBy || 'System'
    };
    if (!this.db.auditLogs) this.db.auditLogs = [];
    this.db.auditLogs.unshift(entry);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs.pop();
    }
    this.save();
  }
}

const dbManager = new DatabaseManager();
dbManager.init();

// API ROUTES
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Sumaiya Telecom Shop Manager',
    time: new Date().toISOString()
  });
});

// Bootstrap / Full initial data load
app.get('/api/bootstrap', (req: Request, res: Response) => {
  try {
    const data = dbManager.data;
    const today = new Date().toISOString().split('T')[0];

    // Calculate dynamic dashboard stats
    const todayInvoices = data.invoices.filter((inv: any) => inv.createdAt.startsWith(today));
    const todaySales = todayInvoices
      .filter((inv: any) => inv.invoiceType === 'sales')
      .reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);

    const todayRepairIncome = todayInvoices
      .filter((inv: any) => inv.invoiceType === 'repair' || inv.invoiceType === 'combined')
      .reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);

    let todayPaymentsReceived = 0;
    for (const inv of data.invoices) {
      if (Array.isArray(inv.payments)) {
        for (const p of inv.payments) {
          if (p.date && p.date.startsWith(today)) {
            todayPaymentsReceived += p.amount || 0;
          }
        }
      }
    }

    const customerOutstanding = data.invoices.reduce((sum: number, inv: any) => sum + (inv.dueAmount || 0), 0);
    const supplierOutstanding = data.purchases.reduce((sum: number, p: any) => sum + (p.dueAmount || 0), 0);
    const totalStockValue = data.products.reduce((sum: number, p: any) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0);
    const lowStockCount = data.products.filter((p: any) => p.quantity <= (p.minStockLevel || 3)).length;
    const todayExpenses = data.expenses
      .filter((e: any) => e.date === today)
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const todayStaffPresent = data.attendance.filter(
      (a: any) => a.date === today && (a.status === 'Present' || a.status === 'Half Day')
    ).length;

    const pendingRepairs = data.repairs.filter((r: any) =>
      ['Received', 'Checking', 'Estimate Given', 'Customer Approval Pending', 'Repairing', 'Waiting for Spare Part'].includes(r.status)
    ).length;

    const completedRepairs = data.repairs.filter((r: any) => r.status === 'Ready').length;
    const deliveredRepairs = data.repairs.filter((r: any) => r.status === 'Delivered').length;

    const stats = {
      todaySales,
      todayRepairIncome,
      todayPaymentsReceived,
      customerOutstanding,
      supplierOutstanding,
      totalStockValue,
      lowStockCount,
      todayExpenses,
      todayStaffPresent,
      pendingRepairs,
      completedRepairs,
      deliveredRepairs
    };

    res.json({
      settings: data.settings,
      users: data.users,
      customers: data.customers,
      products: data.products,
      repairs: data.repairs,
      invoices: data.invoices,
      stockMovements: data.stockMovements,
      suppliers: data.suppliers,
      purchases: data.purchases,
      supplierReturns: data.supplierReturns,
      supplierPayments: data.supplierPayments,
      staff: data.staff,
      attendance: data.attendance,
      salaryPayments: data.salaryPayments,
      expenses: data.expenses,
      auditLogs: data.auditLogs,
      stats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SETTINGS
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(dbManager.data.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  const data = dbManager.data;
  data.settings = { ...data.settings, ...req.body };
  dbManager.save();
  dbManager.logAudit('SETTINGS_UPDATED', 'SETTINGS', 'settings', 'Updated shop settings', req.body.performedBy || 'Owner');
  res.json({ success: true, settings: data.settings });
});

// USERS & AUTH
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, pin } = req.body;
  const user = dbManager.data.users.find((u: any) => u.username === username && u.pin === pin && u.active);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or PIN' });
  }
  dbManager.logAudit('USER_LOGIN', 'USER', user.id, `User ${user.name} logged in`, user.name);
  res.json({ success: true, user });
});

app.get('/api/users', (req: Request, res: Response) => {
  res.json(dbManager.data.users);
});

app.post('/api/users', (req: Request, res: Response) => {
  const data = dbManager.data;
  const newUser = {
    id: `usr-${Date.now()}`,
    ...req.body,
    active: true
  };
  data.users.push(newUser);
  dbManager.save();
  dbManager.logAudit('USER_CREATED', 'USER', newUser.id, `Created staff account: ${newUser.name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.users.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  data.users[idx] = { ...data.users[idx], ...req.body };
  dbManager.save();
  dbManager.logAudit('USER_UPDATED', 'USER', req.params.id, `Updated staff account ${data.users[idx].name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, user: data.users[idx] });
});

// CUSTOMERS
app.get('/api/customers', (req: Request, res: Response) => {
  res.json(dbManager.data.customers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const data = dbManager.data;
  const existing = data.customers.find((c: any) => c.phone === req.body.phone && c.active);
  if (existing) {
    return res.status(400).json({ error: 'Customer with this phone number already exists', customer: existing });
  }
  const idNum = data.customers.length + 1;
  const newCustomer = {
    id: `CUST-${String(idNum).padStart(4, '0')}`,
    ...req.body,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.customers.push(newCustomer);
  dbManager.save();
  dbManager.logAudit('CUSTOMER_CREATED', 'CUSTOMER', newCustomer.id, `Added customer: ${newCustomer.name} (${newCustomer.phone})`, req.body.performedBy || 'Staff');
  res.json({ success: true, customer: newCustomer });
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.customers.findIndex((c: any) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  data.customers[idx] = { ...data.customers[idx], ...req.body, updatedAt: new Date().toISOString() };
  dbManager.save();
  res.json({ success: true, customer: data.customers[idx] });
});

app.get('/api/customers/:id/ledger', (req: Request, res: Response) => {
  const data = dbManager.data;
  const customerId = req.params.id;
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const invoices = data.invoices.filter((i: any) => i.customerId === customerId);
  const repairs = data.repairs.filter((r: any) => r.customerId === customerId);

  // Build chronological ledger entries
  const entries: any[] = [];
  let runningBalance = 0;

  for (const inv of invoices) {
    // Debit for bill created
    runningBalance += inv.totalAmount;
    entries.push({
      date: inv.createdAt,
      type: 'INVOICE',
      referenceId: inv.id,
      description: `${inv.invoiceType.toUpperCase()} Bill (${inv.items.map((i: any) => i.description).join(', ')})`,
      debit: inv.totalAmount,
      credit: 0,
      balance: runningBalance
    });

    // Credits for each payment made against this invoice
    if (Array.isArray(inv.payments)) {
      for (const p of inv.payments) {
        runningBalance -= p.amount;
        entries.push({
          date: p.date,
          type: 'PAYMENT',
          referenceId: inv.id,
          description: `Payment received via ${p.method}${p.referenceNumber ? ` (${p.referenceNumber})` : ''}`,
          debit: 0,
          credit: p.amount,
          balance: runningBalance
        });
      }
    }
  }

  // Sort by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    customer,
    totalBilled: invoices.reduce((sum: number, i: any) => sum + i.totalAmount, 0),
    totalPaid: invoices.reduce((sum: number, i: any) => sum + i.paidAmount, 0),
    outstandingDue: invoices.reduce((sum: number, i: any) => sum + i.dueAmount, 0),
    invoices,
    repairs,
    ledger: entries
  });
});

// PRODUCTS & INVENTORY
app.get('/api/products', (req: Request, res: Response) => {
  res.json(dbManager.data.products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const data = dbManager.data;
  // Check duplicate SKU or barcode if provided
  if (req.body.sku && data.products.some((p: any) => p.sku === req.body.sku && p.active)) {
    return res.status(400).json({ error: 'Product SKU already exists' });
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    barcode: req.body.barcode || `${Date.now()}`.slice(-8),
    minSellingPrice: req.body.minSellingPrice || req.body.sellingPrice,
    wholesalePrice: req.body.wholesalePrice || req.body.purchasePrice,
    quantity: Number(req.body.quantity) || 0,
    minStockLevel: Number(req.body.minStockLevel) || 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  data.products.push(newProduct);

  // If opening stock > 0, record movement
  if (newProduct.quantity > 0) {
    const movement = {
      id: `stk-${Date.now()}`,
      date: new Date().toISOString(),
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'OPENING',
      quantityIn: newProduct.quantity,
      quantityOut: 0,
      balance: newProduct.quantity,
      referenceId: 'OPENING-STOCK',
      reason: 'Initial Opening Stock Entry',
      user: req.body.performedBy || 'Owner'
    };
    data.stockMovements.unshift(movement);
  }

  dbManager.save();
  dbManager.logAudit('PRODUCT_CREATED', 'PRODUCT', newProduct.id, `Created product: ${newProduct.name} (${newProduct.sku})`, req.body.performedBy || 'Admin');
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.products.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  data.products[idx] = { ...data.products[idx], ...req.body, updatedAt: new Date().toISOString() };
  dbManager.save();
  dbManager.logAudit('PRODUCT_UPDATED', 'PRODUCT', req.params.id, `Updated product: ${data.products[idx].name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, product: data.products[idx] });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.products.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  // Soft delete
  data.products[idx].active = false;
  data.products[idx].updatedAt = new Date().toISOString();
  dbManager.save();
  dbManager.logAudit('PRODUCT_ARCHIVED', 'PRODUCT', req.params.id, `Soft deleted product: ${data.products[idx].name}`, req.body.performedBy || 'Admin');
  res.json({ success: true });
});

// Bulk Import Products
app.post('/api/products/import', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { items, performedBy } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided for import' });
  }

  let importedCount = 0;
  for (const item of items) {
    if (!item.name) continue;
    const sku = item.sku || `SKU-${Date.now()}-${importedCount}`;
    const newProduct = {
      id: `prod-${Date.now()}-${importedCount}`,
      sku,
      barcode: item.barcode || `${Date.now()}`.slice(-8) + importedCount,
      name: item.name,
      category: item.category || 'Accessories',
      subcategory: item.subcategory || 'General',
      brand: item.brand || 'Generic',
      compatibleModels: item.compatibleModels || 'All Models',
      purchasePrice: Number(item.purchasePrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      minSellingPrice: Number(item.minSellingPrice) || Number(item.sellingPrice) || 0,
      wholesalePrice: Number(item.wholesalePrice) || Number(item.purchasePrice) || 0,
      quantity: Number(item.quantity) || 0,
      minStockLevel: Number(item.minStockLevel) || 3,
      unit: item.unit || 'Pcs',
      rackLocation: item.rackLocation || 'Shelf 1',
      warranty: item.warranty || 'Testing Warranty',
      taxPercent: 0,
      description: item.description || '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.products.push(newProduct);

    if (newProduct.quantity > 0) {
      data.stockMovements.unshift({
        id: `stk-${Date.now()}-${importedCount}`,
        date: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'OPENING',
        quantityIn: newProduct.quantity,
        quantityOut: 0,
        balance: newProduct.quantity,
        referenceId: 'BULK-IMPORT',
        reason: 'Bulk CSV / Excel Import',
        user: performedBy || 'Admin'
      });
    }
    importedCount++;
  }

  dbManager.save();
  dbManager.logAudit('PRODUCT_BULK_IMPORT', 'PRODUCT', 'bulk', `Imported ${importedCount} products`, performedBy || 'Admin');
  res.json({ success: true, count: importedCount });
});

// STOCK ADJUSTMENT (Manual Stock In / Stock Out)
app.post('/api/stock/adjust', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { productId, type, quantity, reason, referenceId, performedBy } = req.body;
  const product = data.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });

  if (type === 'OUT' || type === 'DAMAGE') {
    if (!data.settings.allowNegativeStock && product.quantity < qty) {
      return res.status(400).json({
        error: `Insufficient stock! Current stock is ${product.quantity}, cannot reduce by ${qty}`
      });
    }
    product.quantity -= qty;
  } else {
    product.quantity += qty;
  }
  product.updatedAt = new Date().toISOString();

  const movement = {
    id: `stk-${Date.now()}`,
    date: new Date().toISOString(),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    type: type === 'OUT' ? 'ADJUSTMENT' : (type === 'DAMAGE' ? 'DAMAGE' : 'ADJUSTMENT'),
    quantityIn: type === 'IN' ? qty : 0,
    quantityOut: (type === 'OUT' || type === 'DAMAGE') ? qty : 0,
    balance: product.quantity,
    referenceId: referenceId || 'MANUAL-ADJUSTMENT',
    reason: reason || 'Manual stock adjustment',
    user: performedBy || 'Staff'
  };
  data.stockMovements.unshift(movement);
  dbManager.save();
  dbManager.logAudit('STOCK_ADJUSTMENT', 'STOCK', product.id, `Stock ${type} ${qty} for ${product.name}. New balance: ${product.quantity}`, performedBy || 'Staff');
  res.json({ success: true, product, movement });
});

app.get('/api/stock/movements', (req: Request, res: Response) => {
  res.json(dbManager.data.stockMovements);
});

// REPAIR JOBS
app.get('/api/repairs', (req: Request, res: Response) => {
  res.json(dbManager.data.repairs);
});

app.post('/api/repairs', (req: Request, res: Response) => {
  const data = dbManager.data;
  const repairPrefix = data.settings.repairPrefix || 'REP';
  const year = new Date().getFullYear();
  const nextNum = data.repairs.length + 1;
  const repairId = `${repairPrefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  const estimatedCost = Number(req.body.estimatedCost) || 0;
  const advancePaid = Number(req.body.advancePaid) || 0;
  const remainingAmount = Math.max(0, estimatedCost - advancePaid);

  // Link or create customer
  let customerId = req.body.customerId;
  if (!customerId && req.body.customerPhone) {
    const existing = data.customers.find((c: any) => c.phone === req.body.customerPhone && c.active);
    if (existing) {
      customerId = existing.id;
    } else {
      const cIdNum = data.customers.length + 1;
      const newCust = {
        id: `CUST-${String(cIdNum).padStart(4, '0')}`,
        name: req.body.customerName,
        phone: req.body.customerPhone,
        whatsapp: req.body.customerWhatsapp || req.body.customerPhone,
        address: req.body.customerAddress || '',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.customers.push(newCust);
      customerId = newCust.id;
    }
  }

  const initialStatus = 'Received';
  const newRepair = {
    id: repairId,
    customerId,
    customerName: req.body.customerName,
    customerPhone: req.body.customerPhone,
    customerWhatsapp: req.body.customerWhatsapp || req.body.customerPhone,
    customerAddress: req.body.customerAddress || '',
    brand: req.body.brand,
    model: req.body.model,
    imei1: req.body.imei1 || '',
    imei2: req.body.imei2 || '',
    color: req.body.color || '',
    deviceCondition: Array.isArray(req.body.deviceCondition) ? req.body.deviceCondition : [],
    lockCode: req.body.lockCode || '',
    simReceived: Boolean(req.body.simReceived),
    sdCardReceived: Boolean(req.body.sdCardReceived),
    chargerReceived: Boolean(req.body.chargerReceived),
    batteryCondition: req.body.batteryCondition || 'Normal',
    otherAccessories: req.body.otherAccessories || '',
    problemDescription: req.body.problemDescription || '',
    technicianNotes: req.body.technicianNotes || '',
    estimatedCost,
    advancePaid,
    remainingAmount,
    expectedDeliveryDate: req.body.expectedDeliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignedTechnician: req.body.assignedTechnician || 'sk abdulmajid',
    priority: req.body.priority || 'Normal',
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        date: new Date().toISOString(),
        staffName: req.body.performedBy || 'Staff',
        note: `Device received in shop. Advance paid: ₹${advancePaid}`
      }
    ],
    partsUsed: [],
    photos: Array.isArray(req.body.photos) ? req.body.photos : [],
    warrantyDays: Number(req.body.warrantyDays) || 30,
    createdAt: new Date().toISOString(),
    createdBy: req.body.performedBy || 'Staff',
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.performedBy || 'Staff',
    active: true
  };

  data.repairs.unshift(newRepair);

  // If advance was paid, create invoice/receipt for advance
  if (advancePaid > 0) {
    const invPrefix = data.settings.invoicePrefix || 'INV';
    const invNum = data.invoices.length + 1;
    const invoiceId = `${invPrefix}-${year}-${String(invNum).padStart(4, '0')}`;
    const invoice = {
      id: invoiceId,
      invoiceType: 'repair',
      repairId: newRepair.id,
      customerId,
      customerName: newRepair.customerName,
      customerPhone: newRepair.customerPhone,
      items: [
        {
          id: `item-${Date.now()}`,
          type: 'repair',
          repairId: newRepair.id,
          description: `Repair Intake Advance - ${newRepair.brand} ${newRepair.model} (${newRepair.problemDescription})`,
          quantity: 1,
          unitPrice: estimatedCost,
          discount: 0,
          total: estimatedCost
        }
      ],
      subtotal: estimatedCost,
      discount: 0,
      taxAmount: 0,
      taxPercent: 0,
      totalAmount: estimatedCost,
      paidAmount: advancePaid,
      dueAmount: remainingAmount,
      paymentStatus: remainingAmount === 0 ? 'Paid' : 'Partially Paid',
      payments: [
        {
          id: `pay-${Date.now()}`,
          date: new Date().toISOString(),
          amount: advancePaid,
          method: req.body.advancePaymentMethod || 'Cash',
          referenceNumber: 'INTAKE-ADVANCE',
          notes: 'Advance at job intake',
          recordedBy: req.body.performedBy || 'Staff'
        }
      ],
      dueDate: newRepair.expectedDeliveryDate,
      notes: `Repair Job Card ${newRepair.id}`,
      createdAt: new Date().toISOString(),
      createdBy: req.body.performedBy || 'Staff',
      updatedAt: new Date().toISOString()
    };
    data.invoices.unshift(invoice);
  }

  dbManager.save();
  dbManager.logAudit('REPAIR_CREATED', 'REPAIR', newRepair.id, `Created repair job for ${newRepair.brand} ${newRepair.model} (${newRepair.customerName})`, req.body.performedBy || 'Staff');
  res.json({ success: true, repair: newRepair });
});

// Update repair details
app.put('/api/repairs/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.repairs.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Repair job not found' });

  const repair = data.repairs[idx];
  const oldRemaining = repair.remainingAmount;

  data.repairs[idx] = {
    ...repair,
    ...req.body,
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.performedBy || repair.updatedBy
  };

  // Recalculate remaining
  const est = Number(data.repairs[idx].estimatedCost) || 0;
  const adv = Number(data.repairs[idx].advancePaid) || 0;
  data.repairs[idx].remainingAmount = Math.max(0, est - adv);

  dbManager.save();
  dbManager.logAudit('REPAIR_UPDATED', 'REPAIR', req.params.id, `Updated repair ${req.params.id}`, req.body.performedBy || 'Staff');
  res.json({ success: true, repair: data.repairs[idx] });
});

// Update repair status
app.post('/api/repairs/:id/status', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { status, note, staffName } = req.body;
  const repair = data.repairs.find((r: any) => r.id === req.params.id);
  if (!repair) return res.status(404).json({ error: 'Repair not found' });

  repair.status = status;
  repair.updatedAt = new Date().toISOString();
  repair.updatedBy = staffName || 'Staff';

  if (!repair.statusHistory) repair.statusHistory = [];
  repair.statusHistory.unshift({
    status,
    date: new Date().toISOString(),
    staffName: staffName || 'Staff',
    note: note || `Status changed to ${status}`
  });

  dbManager.save();
  dbManager.logAudit('REPAIR_STATUS_CHANGED', 'REPAIR', repair.id, `Status changed to ${status} by ${staffName}`, staffName || 'Staff');
  res.json({ success: true, repair });
});

// Add parts used in repair (reduces inventory automatically)
app.post('/api/repairs/:id/parts', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { productId, quantity, isIncludedInRepairPrice, performedBy } = req.body;
  const repair = data.repairs.find((r: any) => r.id === req.params.id);
  if (!repair) return res.status(404).json({ error: 'Repair not found' });

  const product = data.products.find((p: any) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantity) || 1;
  if (!data.settings.allowNegativeStock && product.quantity < qty) {
    return res.status(400).json({ error: `Not enough stock! Available: ${product.quantity}` });
  }

  // Deduct stock
  product.quantity -= qty;
  product.updatedAt = new Date().toISOString();

  // Record stock movement
  const movement = {
    id: `stk-${Date.now()}`,
    date: new Date().toISOString(),
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    type: 'REPAIR',
    quantityIn: 0,
    quantityOut: qty,
    balance: product.quantity,
    referenceId: repair.id,
    reason: `Used in repair job ${repair.id} (${repair.brand} ${repair.model})`,
    user: performedBy || 'Technician'
  };
  data.stockMovements.unshift(movement);

  if (!repair.partsUsed) repair.partsUsed = [];
  repair.partsUsed.push({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: qty,
    costPrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    isIncludedInRepairPrice: Boolean(isIncludedInRepairPrice)
  });

  // If not included in price, add to estimated cost
  if (!isIncludedInRepairPrice) {
    repair.estimatedCost += product.sellingPrice * qty;
    repair.remainingAmount = Math.max(0, repair.estimatedCost - repair.advancePaid);
  }

  repair.updatedAt = new Date().toISOString();
  repair.updatedBy = performedBy || 'Technician';

  dbManager.save();
  dbManager.logAudit('REPAIR_PART_USED', 'REPAIR', repair.id, `Added part ${product.name} (Qty: ${qty}) to ${repair.id}`, performedBy || 'Technician');
  res.json({ success: true, repair, product });
});

// Deliver repair
app.post('/api/repairs/:id/deliver', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { paymentAmount, paymentMethod, referenceNumber, notes, performedBy } = req.body;
  const repair = data.repairs.find((r: any) => r.id === req.params.id);
  if (!repair) return res.status(404).json({ error: 'Repair not found' });

  const amt = Number(paymentAmount) || 0;
  const currentRemaining = repair.remainingAmount;

  if (!data.settings.allowDeliveryWithDue && (currentRemaining - amt) > 0) {
    return res.status(400).json({ error: 'Delivery prevented: Shop setting requires full payment before delivery!' });
  }

  // Update remaining
  repair.advancePaid += amt;
  repair.remainingAmount = Math.max(0, repair.estimatedCost - repair.advancePaid);
  repair.status = 'Delivered';
  repair.deliveredAt = new Date().toISOString();
  repair.deliveredBy = performedBy || 'Staff';

  const warrantyDays = repair.warrantyDays || 30;
  repair.warrantyExpiresAt = new Date(Date.now() + warrantyDays * 86400000).toISOString();

  if (!repair.statusHistory) repair.statusHistory = [];
  repair.statusHistory.unshift({
    status: 'Delivered',
    date: new Date().toISOString(),
    staffName: performedBy || 'Staff',
    note: `Device delivered. Final payment of ₹${amt} received via ${paymentMethod || 'Cash'}. Remaining due: ₹${repair.remainingAmount}`
  });

  // Create or update final invoice
  const year = new Date().getFullYear();
  let invoice = data.invoices.find((i: any) => i.repairId === repair.id);
  if (!invoice) {
    const invPrefix = data.settings.invoicePrefix || 'INV';
    const invNum = data.invoices.length + 1;
    invoice = {
      id: `${invPrefix}-${year}-${String(invNum).padStart(4, '0')}`,
      invoiceType: 'repair',
      repairId: repair.id,
      customerId: repair.customerId,
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      items: [
        {
          id: `item-${Date.now()}`,
          type: 'repair',
          repairId: repair.id,
          description: `${repair.brand} ${repair.model} Repair: ${repair.problemDescription}`,
          quantity: 1,
          unitPrice: repair.estimatedCost,
          discount: 0,
          total: repair.estimatedCost
        }
      ],
      subtotal: repair.estimatedCost,
      discount: 0,
      taxAmount: 0,
      taxPercent: 0,
      totalAmount: repair.estimatedCost,
      paidAmount: repair.advancePaid,
      dueAmount: repair.remainingAmount,
      paymentStatus: repair.remainingAmount === 0 ? 'Paid' : (repair.advancePaid > 0 ? 'Partially Paid' : 'Unpaid'),
      payments: [],
      notes: notes || 'Delivery completed',
      createdAt: new Date().toISOString(),
      createdBy: performedBy || 'Staff',
      updatedAt: new Date().toISOString()
    };
    data.invoices.unshift(invoice);
  } else {
    invoice.paidAmount = repair.advancePaid;
    invoice.dueAmount = repair.remainingAmount;
    invoice.paymentStatus = repair.remainingAmount === 0 ? 'Paid' : 'Partially Paid';
    invoice.updatedAt = new Date().toISOString();
  }

  if (amt > 0) {
    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
      amount: amt,
      method: paymentMethod || 'Cash',
      referenceNumber: referenceNumber || 'DELIVERY-PAYMENT',
      notes: notes || 'Payment at delivery',
      recordedBy: performedBy || 'Staff'
    });
  }

  dbManager.save();
  dbManager.logAudit('REPAIR_DELIVERED', 'REPAIR', repair.id, `Delivered ${repair.id} to ${repair.customerName}. Payment ₹${amt}`, performedBy || 'Staff');
  res.json({ success: true, repair, invoice });
});

// INVOICES & POS BILLING
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json(dbManager.data.invoices);
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const data = dbManager.data;
  const invPrefix = data.settings.invoicePrefix || 'INV';
  const year = new Date().getFullYear();
  const invNum = data.invoices.length + 1;
  const invoiceId = `${invPrefix}-${year}-${String(invNum).padStart(4, '0')}`;

  const {
    invoiceType,
    customerId,
    customerName,
    customerPhone,
    repairId,
    items,
    discount,
    taxPercent,
    paidAmount,
    paymentMethod,
    referenceNumber,
    dueDate,
    notes,
    performedBy
  } = req.body;

  // Process items & update stock for product items
  let subtotal = 0;
  const processedItems: any[] = [];

  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const itemDisc = Number(item.discount) || 0;
    const itemTotal = (price * qty) - itemDisc;
    subtotal += itemTotal;

    processedItems.push({
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: item.type || 'product',
      productId: item.productId,
      repairId: item.repairId,
      description: item.description,
      quantity: qty,
      unitPrice: price,
      discount: itemDisc,
      total: itemTotal
    });

    // If it's a product, reduce inventory
    if (item.type === 'product' && item.productId) {
      const prod = data.products.find((p: any) => p.id === item.productId);
      if (prod) {
        if (!data.settings.allowNegativeStock && prod.quantity < qty) {
          return res.status(400).json({ error: `Not enough stock for ${prod.name}! In stock: ${prod.quantity}` });
        }
        prod.quantity -= qty;
        prod.updatedAt = new Date().toISOString();

        data.stockMovements.unshift({
          id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'SALE',
          quantityIn: 0,
          quantityOut: qty,
          balance: prod.quantity,
          referenceId: invoiceId,
          reason: `Sale on Bill #${invoiceId} to ${customerName}`,
          user: performedBy || 'Staff'
        });
      }
    }
  }

  const overallDiscount = Number(discount) || 0;
  const taxPct = Number(taxPercent) || 0;
  const taxable = Math.max(0, subtotal - overallDiscount);
  const taxAmount = (taxable * taxPct) / 100;
  const totalAmount = Math.round((taxable + taxAmount) * 100) / 100;

  const paid = Math.min(totalAmount, Number(paidAmount) || 0);
  const due = Math.max(0, totalAmount - paid);

  let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
  if (due === 0 && paid > 0) paymentStatus = 'Paid';
  else if (paid > 0) paymentStatus = 'Partially Paid';

  const payments: any[] = [];
  if (paid > 0) {
    payments.push({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
      amount: paid,
      method: paymentMethod || 'Cash',
      referenceNumber: referenceNumber || '',
      notes: 'Initial invoice payment',
      recordedBy: performedBy || 'Staff'
    });
  }

  // Ensure customer exists
  let finalCustId = customerId;
  if (!finalCustId && customerPhone) {
    const existing = data.customers.find((c: any) => c.phone === customerPhone && c.active);
    if (existing) {
      finalCustId = existing.id;
    } else {
      const cIdNum = data.customers.length + 1;
      const newCust = {
        id: `CUST-${String(cIdNum).padStart(4, '0')}`,
        name: customerName,
        phone: customerPhone,
        whatsapp: customerPhone,
        address: '',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.customers.push(newCust);
      finalCustId = newCust.id;
    }
  }

  const invoice = {
    id: invoiceId,
    invoiceType: invoiceType || 'sales',
    repairId,
    customerId: finalCustId,
    customerName,
    customerPhone,
    items: processedItems,
    subtotal,
    discount: overallDiscount,
    taxAmount,
    taxPercent: taxPct,
    totalAmount,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus,
    payments,
    dueDate: dueDate || (due > 0 ? new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] : undefined),
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: performedBy || 'Staff',
    updatedAt: new Date().toISOString()
  };

  data.invoices.unshift(invoice);
  dbManager.save();
  dbManager.logAudit('INVOICE_CREATED', 'INVOICE', invoice.id, `Created bill ${invoice.id} for ${customerName} (Total: ₹${totalAmount}, Paid: ₹${paid})`, performedBy || 'Staff');
  res.json({ success: true, invoice });
});

// Record payment on invoice / customer due
app.post('/api/invoices/:id/payment', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { amount, method, referenceNumber, notes, performedBy } = req.body;
  const invoice = data.invoices.find((i: any) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0' });
  }

  if (payAmt > invoice.dueAmount) {
    return res.status(400).json({ error: `Amount ₹${payAmt} exceeds outstanding due of ₹${invoice.dueAmount}` });
  }

  invoice.paidAmount += payAmt;
  invoice.dueAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
  invoice.paymentStatus = invoice.dueAmount === 0 ? 'Paid' : 'Partially Paid';
  invoice.updatedAt = new Date().toISOString();

  if (!invoice.payments) invoice.payments = [];
  invoice.payments.push({
    id: `pay-${Date.now()}`,
    date: new Date().toISOString(),
    amount: payAmt,
    method: method || 'Cash',
    referenceNumber: referenceNumber || '',
    notes: notes || 'Due clearance payment',
    recordedBy: performedBy || 'Staff'
  });

  // If tied to repair, sync repair remaining amount
  if (invoice.repairId) {
    const repair = data.repairs.find((r: any) => r.id === invoice.repairId);
    if (repair) {
      repair.advancePaid += payAmt;
      repair.remainingAmount = Math.max(0, repair.estimatedCost - repair.advancePaid);
      repair.updatedAt = new Date().toISOString();
    }
  }

  dbManager.save();
  dbManager.logAudit('PAYMENT_RECEIVED', 'INVOICE', invoice.id, `Payment received ₹${payAmt} on ${invoice.id} via ${method}`, performedBy || 'Staff');
  res.json({ success: true, invoice });
});

// Update invoice (supports full edit for wholesale & sales invoices)
app.put('/api/invoices/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.invoices.findIndex((i: any) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });

  const existing = data.invoices[idx];
  const total = req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : existing.totalAmount;
  const paid = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : existing.paidAmount;
  const due = Math.max(0, total - paid);
  let status = req.body.paymentStatus;
  if (!status) {
    status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
  }

  data.invoices[idx] = {
    ...existing,
    ...req.body,
    totalAmount: total,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus: status,
    updatedAt: new Date().toISOString()
  };

  dbManager.save();
  dbManager.logAudit('INVOICE_UPDATED', 'INVOICE', req.params.id, `Updated invoice ${req.params.id} (Total: ₹${total}, Paid: ₹${paid}, Status: ${status})`, req.body.performedBy || 'Staff');
  res.json({ success: true, invoice: data.invoices[idx] });
});

// Delete / Void invoice
app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.invoices.findIndex((i: any) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });
  const deleted = data.invoices.splice(idx, 1)[0];
  dbManager.save();
  dbManager.logAudit('INVOICE_DELETED', 'INVOICE', req.params.id, `Deleted invoice ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, deleted });
});

// CUSTOMER DUES (Filtered outstanding view)
app.get('/api/dues', (req: Request, res: Response) => {
  const data = dbManager.data;
  const dueInvoices = data.invoices.filter((inv: any) => inv.dueAmount > 0);
  res.json(dueInvoices);
});

// SUPPLIERS
app.get('/api/suppliers', (req: Request, res: Response) => {
  res.json(dbManager.data.suppliers);
});

app.post('/api/suppliers', (req: Request, res: Response) => {
  const data = dbManager.data;
  const newSupplier = {
    id: `sup-${Date.now()}`,
    ...req.body,
    active: true,
    createdAt: new Date().toISOString()
  };
  data.suppliers.push(newSupplier);
  dbManager.save();
  dbManager.logAudit('SUPPLIER_CREATED', 'SUPPLIER', newSupplier.id, `Added supplier: ${newSupplier.companyName || newSupplier.name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, supplier: newSupplier });
});

app.put('/api/suppliers/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.suppliers.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Supplier not found' });
  data.suppliers[idx] = { ...data.suppliers[idx], ...req.body };
  dbManager.save();
  dbManager.logAudit('SUPPLIER_UPDATED', 'SUPPLIER', req.params.id, `Updated supplier: ${data.suppliers[idx].companyName || data.suppliers[idx].name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, supplier: data.suppliers[idx] });
});

app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.suppliers.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Supplier not found' });
  data.suppliers[idx].active = false;
  dbManager.save();
  dbManager.logAudit('SUPPLIER_ARCHIVED', 'SUPPLIER', req.params.id, `Archived supplier: ${data.suppliers[idx].companyName || data.suppliers[idx].name}`, req.body.performedBy || 'Admin');
  res.json({ success: true });
});

app.get('/api/suppliers/:id/ledger', (req: Request, res: Response) => {
  const data = dbManager.data;
  const supplierId = req.params.id;
  const supplier = data.suppliers.find((s: any) => s.id === supplierId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const purchases = data.purchases.filter((p: any) => p.supplierId === supplierId);
  const returns = data.supplierReturns.filter((r: any) => r.supplierId === supplierId);
  const payments = data.supplierPayments.filter((p: any) => p.supplierId === supplierId);

  const totalPurchased = purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
  const totalReturned = returns.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const outstandingBalance = totalPurchased - totalReturned - totalPaid;

  res.json({
    supplier,
    totalPurchased,
    totalReturned,
    totalPaid,
    outstandingBalance,
    purchases,
    returns,
    payments
  });
});

// SUPPLIER PURCHASES (Stock in automatically)
app.get('/api/purchases', (req: Request, res: Response) => {
  res.json(dbManager.data.purchases);
});

app.post('/api/purchases', (req: Request, res: Response) => {
  const data = dbManager.data;
  const year = new Date().getFullYear();
  const purNum = data.purchases.length + 1;
  const purchaseId = `PUR-${year}-${String(purNum).padStart(4, '0')}`;

  const { supplierId, supplierName, invoiceNumber, date, items, totalAmount, paidAmount, paymentMethod, notes, performedBy } = req.body;

  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  const due = Math.max(0, total - paid);
  const status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

  // Increase stock for each purchased product
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    let prod = item.productId ? data.products.find((p: any) => p.id === item.productId) : null;
    
    // If product doesn't exist yet (manual product name added during purchase inward)
    if (!prod && item.productName) {
      const newProdId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const sku = `SKU-${Date.now().toString().slice(-4)}`;
      prod = {
        id: newProdId,
        name: item.productName,
        sku,
        category: item.category || 'Spare Parts',
        type: item.category === 'Accessories' ? 'Accessory' : 'Spare Part',
        quantity: 0,
        unit: 'pcs',
        purchasePrice: Number(item.purchasePrice) || 0,
        sellingPrice: Number(item.sellingPrice) || Math.round((Number(item.purchasePrice) || 0) * 1.3),
        wholesalePrice: Math.round((Number(item.purchasePrice) || 0) * 1.15),
        minStockAlert: 2,
        location: 'Main Shelf',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.products.push(prod);
      item.productId = newProdId;
    }

    if (prod) {
      prod.quantity += qty;
      if (item.purchasePrice) prod.purchasePrice = Number(item.purchasePrice);
      if (item.sellingPrice) prod.sellingPrice = Number(item.sellingPrice);
      prod.updatedAt = new Date().toISOString();

      data.stockMovements.unshift({
        id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'PURCHASE',
        quantityIn: qty,
        quantityOut: 0,
        balance: prod.quantity,
        referenceId: purchaseId,
        reason: `Supplier Purchase #${purchaseId} (${supplierName})`,
        user: performedBy || 'Admin'
      });
    }
  }

  const purchase = {
    id: purchaseId,
    supplierId,
    supplierName,
    invoiceNumber: invoiceNumber || '',
    date: date || new Date().toISOString().split('T')[0],
    items: items || [],
    totalAmount: total,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus: status,
    paymentMethod: paymentMethod || 'Cash',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: performedBy || 'Admin'
  };

  data.purchases.unshift(purchase);

  // If payment made, record in supplier payments
  if (paid > 0) {
    data.supplierPayments.unshift({
      id: `SPAY-${Date.now()}`,
      supplierId,
      supplierName,
      purchaseId,
      amount: paid,
      paymentMethod: paymentMethod || 'Cash',
      referenceNumber: `PURCHASE-${purchaseId}`,
      date: date || new Date().toISOString().split('T')[0],
      notes: `Purchase payment on invoice ${invoiceNumber}`,
      createdBy: performedBy || 'Admin'
    });
  }

  dbManager.save();
  dbManager.logAudit('PURCHASE_CREATED', 'PURCHASE', purchase.id, `Created purchase ${purchase.id} from ${supplierName} (Total: ₹${total})`, performedBy || 'Admin');
  res.json({ success: true, purchase });
});

app.put('/api/purchases/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.purchases.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Purchase not found' });

  const existing = data.purchases[idx];
  const total = req.body.totalAmount !== undefined ? Number(req.body.totalAmount) : existing.totalAmount;
  const paid = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : existing.paidAmount;
  const due = Math.max(0, total - paid);
  let status = req.body.paymentStatus;
  if (!status) {
    status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
  }

  data.purchases[idx] = {
    ...existing,
    ...req.body,
    totalAmount: total,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus: status,
    updatedAt: new Date().toISOString()
  };

  dbManager.save();
  dbManager.logAudit('PURCHASE_UPDATED', 'PURCHASE', req.params.id, `Updated purchase ${req.params.id} (Paid: ₹${paid}, Due: ₹${due}, Status: ${status})`, req.body.performedBy || 'Admin');
  res.json({ success: true, purchase: data.purchases[idx] });
});

app.post('/api/purchases/:id/payment', (req: Request, res: Response) => {
  const data = dbManager.data;
  const purchase = data.purchases.find((p: any) => p.id === req.params.id);
  if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

  const { paidAmount, paymentStatus, paymentMethod, referenceNumber, notes, performedBy } = req.body;

  if (paymentStatus === 'Paid') {
    purchase.paidAmount = purchase.totalAmount;
    purchase.dueAmount = 0;
    purchase.paymentStatus = 'Paid';
  } else if (paymentStatus === 'Unpaid') {
    purchase.paidAmount = 0;
    purchase.dueAmount = purchase.totalAmount;
    purchase.paymentStatus = 'Unpaid';
  } else if (paidAmount !== undefined) {
    const pAmt = Number(paidAmount);
    purchase.paidAmount = Math.max(0, Math.min(purchase.totalAmount, pAmt));
    purchase.dueAmount = Math.max(0, purchase.totalAmount - purchase.paidAmount);
    purchase.paymentStatus = purchase.dueAmount === 0 ? 'Paid' : (purchase.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
  }

  // Also log payment record if incremental payment made
  if (req.body.amountPaidNow && Number(req.body.amountPaidNow) > 0) {
    data.supplierPayments.unshift({
      id: `SPAY-${Date.now()}`,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      purchaseId: purchase.id,
      amount: Number(req.body.amountPaidNow),
      paymentMethod: paymentMethod || 'Cash',
      referenceNumber: referenceNumber || '',
      date: new Date().toISOString().split('T')[0],
      notes: notes || `Payment against ${purchase.id}`,
      createdBy: performedBy || 'Admin'
    });
  }

  purchase.updatedAt = new Date().toISOString();
  dbManager.save();
  dbManager.logAudit('PURCHASE_PAYMENT_UPDATED', 'PURCHASE', purchase.id, `Updated payment on purchase ${purchase.id} to ${purchase.paymentStatus} (Paid: ₹${purchase.paidAmount}, Due: ₹${purchase.dueAmount})`, performedBy || 'Admin');
  res.json({ success: true, purchase });
});

app.delete('/api/purchases/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.purchases.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Purchase not found' });
  const deleted = data.purchases.splice(idx, 1)[0];
  dbManager.save();
  dbManager.logAudit('PURCHASE_DELETED', 'PURCHASE', req.params.id, `Deleted purchase order ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, deleted });
});

// SUPPLIER RETURNS (Reduces stock automatically)
app.get('/api/supplier-returns', (req: Request, res: Response) => {
  res.json(dbManager.data.supplierReturns);
});

app.post('/api/supplier-returns', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { supplierId, supplierName, purchaseId, productId, productName, quantity, purchasePrice, reason, date, notes, performedBy } = req.body;

  const qty = Number(quantity) || 1;
  const price = Number(purchasePrice) || 0;
  const total = qty * price;

  const product = data.products.find((p: any) => p.id === productId);
  if (product) {
    if (!data.settings.allowNegativeStock && product.quantity < qty) {
      return res.status(400).json({ error: `Cannot return ${qty}. Current stock is only ${product.quantity}` });
    }
    product.quantity -= qty;
    product.updatedAt = new Date().toISOString();

    data.stockMovements.unshift({
      id: `stk-${Date.now()}`,
      date: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'RETURN',
      quantityIn: 0,
      quantityOut: qty,
      balance: product.quantity,
      referenceId: `RET-${Date.now()}`,
      reason: `Supplier Return: ${reason || 'Defective part returned'}`,
      user: performedBy || 'Admin'
    });
  }

  const ret = {
    id: `RET-${String(data.supplierReturns.length + 1).padStart(4, '0')}`,
    supplierId,
    supplierName,
    purchaseId,
    productId,
    productName,
    quantity: qty,
    purchasePrice: price,
    totalAmount: total,
    reason: reason || 'Defective part return',
    date: date || new Date().toISOString().split('T')[0],
    status: req.body.status || 'Credited to Ledger',
    notes: notes || '',
    createdBy: performedBy || 'Admin'
  };

  data.supplierReturns.unshift(ret);
  dbManager.save();
  dbManager.logAudit('SUPPLIER_RETURN', 'RETURN', ret.id, `Returned ${qty}x ${productName} to ${supplierName}`, performedBy || 'Admin');
  res.json({ success: true, returnRecord: ret });
});

app.put('/api/supplier-returns/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.supplierReturns.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Return record not found' });
  data.supplierReturns[idx] = { ...data.supplierReturns[idx], ...req.body };
  dbManager.save();
  dbManager.logAudit('SUPPLIER_RETURN_UPDATED', 'RETURN', req.params.id, `Updated return ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, returnRecord: data.supplierReturns[idx] });
});

app.delete('/api/supplier-returns/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.supplierReturns.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Return record not found' });
  const deleted = data.supplierReturns.splice(idx, 1)[0];
  dbManager.save();
  dbManager.logAudit('SUPPLIER_RETURN_DELETED', 'RETURN', req.params.id, `Deleted return ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, deleted });
});

// SUPPLIER PAYMENTS
app.get('/api/supplier-payments', (req: Request, res: Response) => {
  res.json(dbManager.data.supplierPayments);
});

app.post('/api/supplier-payments', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { supplierId, supplierName, purchaseId, amount, paymentMethod, referenceNumber, date, notes, performedBy } = req.body;

  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) return res.status(400).json({ error: 'Invalid payment amount' });

  const payment = {
    id: `SPAY-${Date.now()}`,
    supplierId,
    supplierName,
    purchaseId,
    amount: payAmt,
    paymentMethod: paymentMethod || 'Cash',
    referenceNumber: referenceNumber || '',
    date: date || new Date().toISOString().split('T')[0],
    notes: notes || '',
    createdBy: performedBy || 'Admin'
  };

  data.supplierPayments.unshift(payment);

  // If purchaseId specified, reduce due amount on purchase
  if (purchaseId) {
    const purchase = data.purchases.find((p: any) => p.id === purchaseId);
    if (purchase) {
      purchase.paidAmount += payAmt;
      purchase.dueAmount = Math.max(0, purchase.totalAmount - purchase.paidAmount);
      purchase.paymentStatus = purchase.dueAmount === 0 ? 'Paid' : 'Partially Paid';
    }
  }

  dbManager.save();
  dbManager.logAudit('SUPPLIER_PAYMENT', 'PAYMENT', payment.id, `Paid ₹${payAmt} to supplier ${supplierName} via ${paymentMethod}`, performedBy || 'Admin');
  res.json({ success: true, payment });
});

app.put('/api/supplier-payments/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.supplierPayments.findIndex((sp: any) => sp.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Payment record not found' });
  data.supplierPayments[idx] = { ...data.supplierPayments[idx], ...req.body };
  dbManager.save();
  dbManager.logAudit('SUPPLIER_PAYMENT_UPDATED', 'PAYMENT', req.params.id, `Updated supplier payment ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, payment: data.supplierPayments[idx] });
});

app.delete('/api/supplier-payments/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.supplierPayments.findIndex((sp: any) => sp.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Payment record not found' });
  const deleted = data.supplierPayments.splice(idx, 1)[0];
  dbManager.save();
  dbManager.logAudit('SUPPLIER_PAYMENT_DELETED', 'PAYMENT', req.params.id, `Deleted supplier payment ${req.params.id}`, req.body.performedBy || 'Admin');
  res.json({ success: true, deleted });
});

// STAFF & ATTENDANCE
app.get('/api/staff', (req: Request, res: Response) => {
  res.json(dbManager.data.staff);
});

app.post('/api/staff', (req: Request, res: Response) => {
  const data = dbManager.data;
  const newStaff = {
    id: `stf-${Date.now()}`,
    ...req.body,
    dailySalary: Number(req.body.dailySalary) || 0,
    monthlySalary: Number(req.body.monthlySalary) || 0,
    status: req.body.status || 'active'
  };
  data.staff.push(newStaff);
  dbManager.save();
  dbManager.logAudit('STAFF_CREATED', 'STAFF', newStaff.id, `Created staff member: ${newStaff.name}`, req.body.performedBy || 'Admin');
  res.json({ success: true, staff: newStaff });
});

app.put('/api/staff/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  const idx = data.staff.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });
  data.staff[idx] = { ...data.staff[idx], ...req.body };
  dbManager.save();
  res.json({ success: true, staff: data.staff[idx] });
});

app.get('/api/attendance', (req: Request, res: Response) => {
  res.json(dbManager.data.attendance);
});

// Bulk Attendance Marking
app.post('/api/attendance/bulk', (req: Request, res: Response) => {
  const data = dbManager.data;
  const { date, records, performedBy } = req.body;
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid attendance submission' });
  }

  // Remove existing records for this date
  data.attendance = data.attendance.filter((a: any) => a.date !== date);

  for (const rec of records) {
    const staff = data.staff.find((s: any) => s.id === rec.staffId);
    let earned = 0;
    if (staff) {
      const daily = staff.dailySalary || (staff.monthlySalary ? staff.monthlySalary / 30 : 0);
      if (rec.status === 'Present') earned = Math.round(daily * (data.settings.dailySalaryPresentPercent / 100));
      else if (rec.status === 'Half Day') earned = Math.round(daily * (data.settings.dailySalaryHalfDayPercent / 100));
      else if (rec.status === 'Paid Leave') earned = Math.round(daily * (data.settings.dailySalaryLeavePercent / 100));
      else earned = 0;
    }

    data.attendance.unshift({
      id: `att-${Date.now()}-${rec.staffId}`,
      date,
      staffId: rec.staffId,
      staffName: rec.staffName,
      status: rec.status,
      checkIn: rec.checkIn || '10:00 AM',
      checkOut: rec.checkOut || '08:00 PM',
      workingHours: rec.status === 'Half Day' ? 5 : (rec.status === 'Present' ? 10 : 0),
      earnedSalary: earned,
      notes: rec.notes || ''
    });
  }

  dbManager.save();
  dbManager.logAudit('ATTENDANCE_RECORDED', 'ATTENDANCE', date, `Marked attendance for date ${date} (${records.length} staff)`, performedBy || 'Admin');
  res.json({ success: true, attendance: data.attendance });
});

// Salary Payments
app.get('/api/salary-payments', (req: Request, res: Response) => {
  res.json(dbManager.data.salaryPayments);
});

app.post('/api/salary-payments', (req: Request, res: Response) => {
  const data = dbManager.data;
  const newPayment = {
    id: `sal-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    createdBy: req.body.performedBy || 'Admin'
  };
  data.salaryPayments.unshift(newPayment);

  // Also add as shop expense automatically
  data.expenses.unshift({
    id: `exp-${Date.now()}`,
    date: newPayment.paymentDate || new Date().toISOString().split('T')[0],
    category: 'Staff Salary',
    amount: newPayment.paidAmount,
    paymentMethod: newPayment.paymentMethod || 'Cash',
    description: `Salary payment to ${newPayment.staffName} for ${newPayment.period}`,
    addedBy: req.body.performedBy || 'Admin'
  });

  dbManager.save();
  dbManager.logAudit('SALARY_PAID', 'SALARY', newPayment.id, `Paid salary of ₹${newPayment.paidAmount} to ${newPayment.staffName}`, req.body.performedBy || 'Admin');
  res.json({ success: true, payment: newPayment });
});

// EXPENSES
app.get('/api/expenses', (req: Request, res: Response) => {
  res.json(dbManager.data.expenses);
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const data = dbManager.data;
  const newExp = {
    id: `exp-${Date.now()}`,
    date: req.body.date || new Date().toISOString().split('T')[0],
    category: req.body.category || 'Other',
    amount: Number(req.body.amount) || 0,
    paymentMethod: req.body.paymentMethod || 'Cash',
    description: req.body.description || '',
    addedBy: req.body.performedBy || 'Staff'
  };
  data.expenses.unshift(newExp);
  dbManager.save();
  dbManager.logAudit('EXPENSE_RECORDED', 'EXPENSE', newExp.id, `Added expense ₹${newExp.amount} for ${newExp.category} (${newExp.description})`, req.body.performedBy || 'Staff');
  res.json({ success: true, expense: newExp });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const data = dbManager.data;
  data.expenses = data.expenses.filter((e: any) => e.id !== req.params.id);
  dbManager.save();
  res.json({ success: true });
});

// AUDIT LOGS
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(dbManager.data.auditLogs);
});

// BACKUP & RESTORE
app.get('/api/backup', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="sumaiya_telecom_backup_${Date.now()}.json"`);
  res.json(dbManager.data);
});

app.post('/api/restore', (req: Request, res: Response) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.settings || !backupData.products) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }
    // Deep clone and write
    const current = dbManager.data;
    Object.assign(current, backupData);
    dbManager.save();
    dbManager.logAudit('DATABASE_RESTORED', 'SYSTEM', 'restore', 'Database restored from backup file', req.body.performedBy || 'Admin');
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start server with Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
