import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import inferenceRoutes from './routes/inferenceRoutes.js';
import healthcheckRoutes from './routes/healthcheckRoutes.js';
import employmentIndustriesRoutes from './routes/employmentIndustriesRoutes.js';
import incomeTypesRoutes from './routes/incomeTypesRoutes.js';
import offersRoutes from './routes/offersRoutes.js';
import configRoutes from './routes/configRoutes.js';
import countriesRoutes from './routes/countriesRoutes.js';
import viewChatRoutes from './routes/viewChatRoutes.js';
import testRoutes from './routes/testRoutes.js';


dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.resolve(__dirname, 'static');

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
  '/static',
  express.static(staticDir, {
    setHeaders: res => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

app.use('/api/ai', inferenceRoutes);
app.use('/api/health', healthcheckRoutes);
app.use('/api/fields/industries', employmentIndustriesRoutes);
app.use('/api/fields/income-types', incomeTypesRoutes);
app.use('/api/offer', offersRoutes);
app.use('/api/config', configRoutes)
app.use('/api/countries', countriesRoutes);
app.use('/api/view', viewChatRoutes);
app.use('/api/test', testRoutes);

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'N/A';
};

app.listen(port, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Network access: http://${localIp}:${port}`);
});
