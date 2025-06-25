import request from 'supertest';
import app from '../..';
import { db } from '../../db/index';
import { users, patients } from '../../db/schema';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const clinician = { username: 'clinician1', password: 'testpass', role: 'clinician' };
const admin = { username: 'admin1', password: 'adminpass', role: 'admin' };
const patient = {
  fullName: 'John Doe',
  dob: '1990-01-01',
  ssn: '123-45-6789',
  symptoms: 'Cough',
  clinicalNotes: 'No fever.'
};

let clinicianToken: string;
let adminToken: string;

beforeAll(async () => {
  // 1. Run migrations
  migrate(db, { migrationsFolder: './drizzle' });

  // 2. Clean up
  await db.delete(patients);
  await db.delete(users);

  // 3. Insert users
  const hashedClinician = await bcrypt.hash(clinician.password, 10);
  const hashedAdmin = await bcrypt.hash(admin.password, 10);
  await db.insert(users).values([
    { username: clinician.username, passwordHash: hashedClinician, role: clinician.role },
    { username: admin.username, passwordHash: hashedAdmin, role: admin.role }
  ]);

  // 4. Login to get tokens
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
      .send(patient);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only clinicians/);
  });

  it('should allow clinician to create patient', async () => {
    const res = await request(app)
      .post('/api/patients/create')
      .set('Authorization', clinicianToken)
      .send(patient);
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