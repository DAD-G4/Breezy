import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import mediaRoutes from './routes/media';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files statically (public — <img>/<video> tags can't send auth headers)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/health', healthRouter);
app.use('/api/media', mediaRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Media service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start media service:', err);
    process.exit(1);
  }
}

start();
