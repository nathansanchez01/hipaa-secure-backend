import express from 'express';
import asyncHandler from 'express-async-handler';
import { db } from '../db/index.js';
import { patients } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { eq, desc } from 'drizzle-orm';
import { logAuditAction } from '../services/audit.js';

const router = express.Router();


function isValidSSN(ssn: string): boolean {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
}


router.post(
  '/create',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (user.role !== 'clinician') {
      return res.status(403).json({ error: 'Only clinicians can create patients' });
    }

    const { fullName, dob, ssn, symptoms, clinicalNotes } = req.body;
    if (!fullName || !dob || !ssn || !symptoms || !clinicalNotes) {
      return res.status(400).json({ error: 'Missing patient fields' });
    }

    
    if (!isValidSSN(ssn)) {
      return res.status(400).json({ error: 'Invalid SSN format. Use XXX-XX-XXXX format.' });
    }

    const existingPatient = await db.select().from(patients).where(eq(patients.ssn, ssn)).get();
    if (existingPatient) {
      return res.status(409).json({ error: 'Patient with this SSN already exists' });
    }

    const result = await db.insert(patients).values({
      fullName,
      dob,
      ssn,
      symptoms,
      clinicalNotes,
      creatorId: user.id,
    });

    const createdPatient = await db.select().from(patients).where(eq(patients.creatorId, user.id)).orderBy(desc(patients.id)).limit(1);
    const patientId = createdPatient[0]?.id;
    await logAuditAction({ userId: user.id, role: user.role, action: 'create_patient', patientId });

    res.status(201).json({ message: 'Patient created' });
  })
);

router.get(
  '/data',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    let result;
    if (user.role === 'admin') {
      result = await db.select().from(patients);
    } else {
      result = await db.select().from(patients).where(eq(patients.creatorId, user.id));
      result = result.map((p) => ({
        ...p,
        ssn: p.ssn.replace(/^[0-9]{3}-[0-9]{2}/, '***-**'),
      }));
    }

    for (const patient of result) {
      await logAuditAction({ userId: user.id, role: user.role, action: 'view_patient', patientId: patient.id });
    }
    res.json(result);
  })
);

export default router;
