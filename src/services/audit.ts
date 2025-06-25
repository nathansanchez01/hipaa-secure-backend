import { db } from '../db/index';
import { auditLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuditLogData {
  userId: number;
  role: string;
  action: string;
  patientId?: number;
  details?: string;
}

export async function logAuditAction(data: AuditLogData) {
  try {
    const estTimestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    await db.insert(auditLogs).values({
      userId: data.userId,
      role: data.role,
      action: data.action,
      patientId: data.patientId ?? null,
      timestamp: estTimestamp,
    });
    console.log(`Audit log: User ${data.userId} (${data.role}) performed ${data.action}${data.patientId ? ` on patient ${data.patientId}` : ''}`);
  } catch (error) {
    console.error('Failed to log audit action:', error);

  }
}

export async function getAuditLogs() {
  return await db.select().from(auditLogs).orderBy(auditLogs.timestamp);
}

export async function getAuditLogsByUser(userId: number) {
  return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(auditLogs.timestamp);
}

export async function getAuditLogsByPatient(patientId: number) {
  return await db.select().from(auditLogs).where(eq(auditLogs.patientId, patientId)).orderBy(auditLogs.timestamp);
} 