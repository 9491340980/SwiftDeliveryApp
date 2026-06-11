require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function setAdmin() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'swiftbite' });
  const phone = '9110521354';
  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({ name: 'Super Admin', phone, isAdmin: true, isActive: true });
    user.referralCode = 'ADMIN001';
  } else {
    user.isAdmin = true;
    user.name = user.name || 'Super Admin';
  }
  await user.save();
  console.log(`✅ ${phone} is now a Super Admin (id: ${user._id})`);
  await mongoose.disconnect();
}

setAdmin().catch(err => { console.error(err); process.exit(1); });
