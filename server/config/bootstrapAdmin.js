const User = require('../models/User');

const bootstrapAdminFromEnv = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const adminName = (process.env.ADMIN_NAME || 'System Admin').trim();

  if (!adminEmail || !adminPassword) {
    console.warn('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing');
    return;
  }

  let adminUser = await User.findOne({ email: adminEmail }).select('+password');

  if (!adminUser) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });
    console.log(`Admin bootstrap: created admin user ${adminEmail}`);
    return;
  }

  let shouldSave = false;

  if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    shouldSave = true;
  }

  if (!adminUser.isActive) {
    adminUser.isActive = true;
    shouldSave = true;
  }

  if (adminName && adminUser.name !== adminName) {
    adminUser.name = adminName;
    shouldSave = true;
  }

  const passwordMatches = await adminUser.matchPassword(adminPassword);
  if (!passwordMatches) {
    adminUser.password = adminPassword;
    shouldSave = true;
  }

  if (shouldSave) {
    await adminUser.save();
    console.log(`Admin bootstrap: updated admin user ${adminEmail}`);
  } else {
    console.log(`Admin bootstrap: admin user ${adminEmail} already up to date`);
  }
};

module.exports = bootstrapAdminFromEnv;