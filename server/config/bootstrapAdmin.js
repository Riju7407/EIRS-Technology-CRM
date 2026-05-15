const User = require('../models/User');

const ADMIN_ALIAS_EMAIL = 'admin@eirtech.com';

const upsertAdminAccount = async ({ email, name, password }) => {
  let adminUser = await User.findOne({ email }).select('+password');

  if (!adminUser) {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isAdmin: true,
      isActive: true,
    });
    console.log(`Admin bootstrap: created admin user ${email}`);
    return;
  }

  let shouldSave = false;

  if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    shouldSave = true;
  }

  if (!adminUser.isAdmin) {
    adminUser.isAdmin = true;
    shouldSave = true;
  }

  if (!adminUser.isActive) {
    adminUser.isActive = true;
    shouldSave = true;
  }

  if (name && adminUser.name !== name) {
    adminUser.name = name;
    shouldSave = true;
  }

  const passwordMatches = await adminUser.matchPassword(password);
  if (!passwordMatches) {
    adminUser.password = password;
    shouldSave = true;
  }

  if (shouldSave) {
    await adminUser.save();
    console.log(`Admin bootstrap: updated admin user ${email}`);
  } else {
    console.log(`Admin bootstrap: admin user ${email} already up to date`);
  }
};

const bootstrapAdminFromEnv = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const adminName = (process.env.ADMIN_NAME || 'System Admin').trim();

  if (!adminEmail || !adminPassword) {
    console.warn('Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing');
    return;
  }

  await upsertAdminAccount({ email: adminEmail, name: adminName, password: adminPassword });

  if (adminEmail !== ADMIN_ALIAS_EMAIL) {
    await upsertAdminAccount({ email: ADMIN_ALIAS_EMAIL, name: adminName, password: adminPassword });
  }
};

module.exports = bootstrapAdminFromEnv;