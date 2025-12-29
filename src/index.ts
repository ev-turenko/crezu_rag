import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import inferenceRoutes from './routes/inferenceRoutes.js';
import inferenceRoutesV2 from './routes/v2/inferenceRoutes.js';
import healthcheckRoutes from './routes/healthcheckRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const swaggerDefinition = {
  info: {
    title: 'Crezu RAG API',
    version: '1.0.0',
    description: 'API documentation for Crezu RAG project',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/routes/v2/*.ts'],
};

const specs = swaggerJSDoc(options);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/ai', inferenceRoutes);
app.use('/api/v2/ai', inferenceRoutesV2);

app.use('/api/health', healthcheckRoutes);

app.listen(port, () => {
  console.log('docs available at http://localhost:%s/api-docs', port);
  console.log(`Server is running on http://localhost:${port}`);
});
