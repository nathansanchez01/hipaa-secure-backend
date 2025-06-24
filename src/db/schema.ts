import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' or 'clinician'
});

export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fullName: text('full_name').notNull(),
  dob: text('dob').notNull(),
  ssn: text('ssn').notNull(),
  symptoms: text('symptoms').notNull(),
  clinicalNotes: text('clinical_notes').notNull(),
  creatorId: integer('creator_id').notNull().references(() => users.id),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  action: text('action').notNull(),
  patientId: integer('patient_id'),
  timestamp: text('timestamp').notNull(),
});