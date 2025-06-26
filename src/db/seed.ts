import bcrypt from 'bcrypt';
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'adminpassword';

async function seed() {
  console.log('Seeding database...');

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, ADMIN_USERNAME),
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Seeding skipped.');
      return;
    }

    console.log(`Creating admin user: ${ADMIN_USERNAME}`);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    await db.insert(users).values({
      username: ADMIN_USERNAME,
      passwordHash,
      role: 'admin',
    });

    console.log('Admin user created successfully.');
    console.log(`\nUsername: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}\n`);

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    console.log('Seeding process finished.');
  }
}

seed(); 