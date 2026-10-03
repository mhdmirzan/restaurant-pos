/* eslint-disable @typescript-eslint/no-require-imports */
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}
const mongoose = require('mongoose');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI || !MONGODB_DB_NAME) {
  console.error('❌ Missing MONGODB_URI or MONGODB_DB_NAME in environment variables.');
  console.error('   Make sure you have a .env file with these values.');
  process.exit(1);
}

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const initialItems = [
  { name: 'Chicken Fried Rice - Regular', category: 'Fried Rice', price: 650, active: true },
  { name: 'Chicken Fried Rice - Large', category: 'Fried Rice', price: 850, active: true },
  { name: 'Veg Fried Rice - Regular', category: 'Fried Rice', price: 500, active: true },
  { name: 'Beef Fried Rice - Regular', category: 'Fried Rice', price: 750, active: true },
  { name: 'Special Fried Rice', category: 'Fried Rice', price: 950, active: true },
  { name: 'Chicken Biryani - Regular', category: 'Biryani', price: 800, active: true },
  { name: 'Chicken Biryani - Large', category: 'Biryani', price: 1050, active: true },
  { name: 'Mutton Biryani', category: 'Biryani', price: 1200, active: true },
  { name: 'Chicken Kothu - Regular', category: 'Kothu', price: 600, active: true },
  { name: 'Chicken Kothu - Large', category: 'Kothu', price: 800, active: true },
  { name: 'Idiyappa Kothu', category: 'Kothu', price: 550, active: true },
  { name: 'Mini Submarine', category: 'Submarine', price: 450, active: true },
  { name: 'Regular Submarine', category: 'Submarine', price: 650, active: true },
  { name: 'Devel Chicken', category: 'Chicken', price: 900, active: true },
  { name: 'Fried Chicken - 2pcs', category: 'Chicken', price: 500, active: true },
  { name: 'Fried Chicken - 4pcs', category: 'Chicken', price: 950, active: true },
  { name: 'Grilled Chicken', category: 'Chicken', price: 1100, active: true },
  { name: 'Coca-Cola', category: 'Beverages', price: 200, active: true },
  { name: 'Fresh Lime Juice', category: 'Beverages', price: 250, active: true },
  { name: 'Mineral Water', category: 'Beverages', price: 100, active: true },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log('✅ Connected to MongoDB');

    const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

    let created = 0;
    let skipped = 0;

    for (const item of initialItems) {
      const existing = await MenuItem.findOne({ name: item.name });
      if (!existing) {
        await MenuItem.create(item);
        console.log(`  ✓ Created: ${item.name} — LKR ${item.price}`);
        created++;
      } else {
        console.log(`  ⊘ Skipped (exists): ${item.name}`);
        skipped++;
      }
    }

    console.log(`\n✅ Seed complete! Created ${created}, Skipped ${skipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message || error);
    process.exit(1);
  }
}

seed();
