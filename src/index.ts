import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import inferenceRoutes from './routes/inferenceRoutes.js';
import healthcheckRoutes from './routes/healthcheckRoutes.js';
import employmentIndustriesRoutes from './routes/employmentIndustriesRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/ai', inferenceRoutes);
app.use('/api/health', healthcheckRoutes);
app.use('/api/fields/industries', employmentIndustriesRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
