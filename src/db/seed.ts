import bcrypt from 'bcrypt';
import { db } from './index';
import { users } from './schema';

async function seedUsers() {
  const existing = await db.select().from(users);
  if (existing.length > 0) {
    console.log('Users already seeded.');
    return;
  }

  const adminPassword = await bcrypt.hash('adminpass', 10);
  const clinicianPassword = await bcrypt.hash('clinicianpass', 10);

  await db.insert(users).values([
    { username: 'admin1', passwordHash: adminPassword, role: 'admin' },
    { username: 'clinician1', passwordHash: clinicianPassword, role: 'clinician' }
  ]);
  console.log('Seeded users.');
}

seedUsers(); 