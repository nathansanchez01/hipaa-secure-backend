import fs from 'fs';
import path from 'path';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';
import app from '../..';

// At the top of your test file
const testDbPath = path.resolve(process.cwd(), 'dev.test.sqlite3');

// Remove the test DB file if it exists (clean slate)
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Now create the DB connection and Drizzle instance
const sqlite = new Database(testDbPath);
const db = drizzle(sqlite, { schema });

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
  // Recreate the DB connection and Drizzle instance after file removal
  sqlite.exec('PRAGMA foreign_keys = ON');
  await migrate(db, { migrationsFolder: './drizzle' });

  // Clean up tables before inserting new data
  await db.delete(schema.patients);
  await db.delete(schema.users);

  // Insert clinician and admin users
  const hashedClinician = await bcrypt.hash(clinician.password, 10);
  const hashedAdmin = await bcrypt.hash(admin.password, 10);

  const insertedUsers = await db.insert(schema.users).values([
    { username: clinician.username, passwordHash: hashedClinician, role: clinician.role },
    { username: admin.username, passwordHash: hashedAdmin, role: admin.role }
  ]).returning();

  clinicianId = insertedUsers.find((u: any) => u.role === 'clinician')!.id;

  // Login to get tokens
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

afterAll(() => {
  sqlite.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Patient RBAC and SSN Masking', () => {
  it('should not allow non-clinician to create patient', async () => {
    const res = await request(app)
      .post('/api/patients/create')
      .set('Authorization', adminToken)
      .send({ ...basePatient, creatorId: clinicianId });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only clinicians/);
  });

  it('should allow clinician to create patient', async () => {
    const res = await request(app)
      .post('/api/patients/create')
      .set('Authorization', clinicianToken)
      .send({ ...basePatient, creatorId: clinicianId });
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
