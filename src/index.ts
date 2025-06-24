import express from 'express';
import cors from 'cors';
import authRouter from './api/auth.js';
import patientsRouter from './api/patients.js';
import auditRouter from './api/audit.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Secure Patient Intake Backend is running!');
});

app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/audit', auditRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 