import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import inferenceRoutes from './routes/inferenceRoutes.js';
import healthcheckRoutes from './routes/healthcheckRoutes.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

app.use('/api/rag', inferenceRoutes);
app.use('/api/health', healthcheckRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
