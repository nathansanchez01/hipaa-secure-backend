import express from 'express';
import asyncHandler from 'express-async-handler';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAuditLogs, getAuditLogsByUser, getAuditLogsByPatient } from '../services/audit.js';

const router = express.Router();

// Get all audit logs (admin only)
router.get(
  '/logs',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const logs = await getAuditLogs();
    res.json(logs);
  })
);

// Get audit logs for a specific user (admin only)
router.get(
  '/logs/user/:userId',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    const logs = await getAuditLogsByUser(userId);
    res.json(logs);
  })
);

// Get audit logs for a specific patient (admin only)
router.get(
  '/logs/patient/:patientId',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const patientId = Number(req.params.patientId);
    const logs = await getAuditLogsByPatient(patientId);
    res.json(logs);
  })
);

export default router; 