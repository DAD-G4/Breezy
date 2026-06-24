import express from 'express';
import cookieParser from 'cookie-parser';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start notification service:', err);
    process.exit(1);
  }
}

start();
