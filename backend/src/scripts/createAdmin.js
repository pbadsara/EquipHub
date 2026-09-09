import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import User, { ROLES } from '../models/User.js';

/**
 * Controlled admin-creation process (brief Section 2 & 6.2): admins cannot
 * self-register through the public API, so the *only* way to create one is
 * this script, run directly on a machine with access to the database
 * credentials — never exposed as an HTTP endpoint.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Reads ADMIN_SEED_NAME / ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD from .env,
 * or accepts overrides as CLI args: node src/scripts/createAdmin.js "Name" email pass
 */
async function main() {
  const [, , argName, argEmail, argPassword] = process.argv;

  const name = argName || process.env.ADMIN_SEED_NAME;
  const email = (argEmail || process.env.ADMIN_SEED_EMAIL || '').toLowerCase().trim();
  const password = argPassword || process.env.ADMIN_SEED_PASSWORD;

  if (!name || !email || !password) {
    console.error('Missing admin details. Set ADMIN_SEED_NAME/EMAIL/PASSWORD in .env, or pass as args.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). No changes made.`);
    await disconnectDB();
    return;
  }

  const admin = await User.create({ name, email, password, role: ROLES.ADMIN });
  console.log(`Admin account created: ${admin.email} (id: ${admin._id.toString()})`);

  await disconnectDB();
}

main().catch(async (err) => {
  console.error('Failed to create admin:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
