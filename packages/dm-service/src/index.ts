import express from 'express';
import cookieParser from 'cookie-parser';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import dmRoutes from './routes/dms';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/dms', dmRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`DM service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start DM service:', err);
    process.exit(1);
  }
}

start();
