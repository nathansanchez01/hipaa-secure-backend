import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import patientsRouter from './routes/patients';
import auditRouter from './routes/audit';


// Ensure the users table is created before any routes
// await db.select().from(users);

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
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;