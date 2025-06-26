import request from 'supertest';
import app from '../..';
import { db } from '../../db/index';
import { users, patients } from '../../db/schema';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const clinician = { username: 'clinician1', password: 'testpass', role: 'clinician' };
const admin = { username: 'admin1', password: 'adminpass', role: 'admin' };

const basePatient = {
  fullName: 'John Doe',
  dob: '1990-01-01',
  ssn: '123-45-6789',
  symptoms: 'Cough',
  clinicalNotes: 'No fever.'
};

let clinicianToken: string;
let adminToken: string;
let clinicianId: number;

beforeAll(async () => {
  // 1. Run DB migrations
  migrate(db, { migrationsFolder: './drizzle' });

  // 2. Clean up tables
  await db.delete(patients);
  await db.delete(users);

  // 3. Insert clinician and admin
  const hashedClinician = await bcrypt.hash(clinician.password, 10);
  const hashedAdmin = await bcrypt.hash(admin.password, 10);

  const insertedUsers = await db.insert(users).values([
    { username: clinician.username, passwordHash: hashedClinician, role: clinician.role },
    { username: admin.username, passwordHash: hashedAdmin, role: admin.role }
  ]).returning();

  // 4. Save clinician ID for patient creation
  clinicianId = insertedUsers.find(u => u.role === 'clinician')!.id;

  // 5. Login to get tokens
  const clinRes = await request(app).post('/api/auth/login').send({
    username: clinician.username,
    password: clinician.password
  });

  const adminRes = await request(app).post('/api/auth/login').send({
    username: admin.username,
    password: admin.password
  });

  clinicianToken = `${clinRes.body.id}:${clinRes.body.role}`;
  adminToken = `${adminRes.body.id}:${adminRes.body.role}`;
});

describe('Patient RBAC and SSN Masking', () => {
  it('should not allow non-clinician to create patient', async () => {
    const res = await request(app)
      .post('/api/patients/create')
      .set('Authorization', adminToken)
      .send({ ...basePatient, creator_id: clinicianId }); // still needs valid creator_id
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only clinicians/);
  });

  it('should allow clinician to create patient', async () => {
    const res = await request(app)
      .post('/api/patients/create')
      .set('Authorization', clinicianToken)
      .send({ ...basePatient, creator_id: clinicianId }); // required by FK constraint
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Patient created');
  });

  it('should mask SSN for clinician', async () => {
    const res = await request(app)
      .get('/api/patients/data')
      .set('Authorization', clinicianToken);
    expect(res.status).toBe(200);
    expect(res.body[0].ssn).toBe('***-**-6789');
  });

  it('should show full SSN for admin', async () => {
    const res = await request(app)
      .get('/api/patients/data')
      .set('Authorization', adminToken);
    expect(res.status).toBe(200);
    expect(res.body[0].ssn).toBe('123-45-6789');
  });
});
