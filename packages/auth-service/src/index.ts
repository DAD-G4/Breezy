import express from 'express';
import cookieParser from 'cookie-parser';
import { connectPostgres, errorHandler, notFound, healthRouter } from '@breezy/shared';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start auth service:', err);
    process.exit(1);
  }
}

start();
