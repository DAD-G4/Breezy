import express from 'express';
import cookieParser from 'cookie-parser';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import moderationRoutes from './routes/moderation';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/moderation', moderationRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`Moderation service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start moderation service:', err);
    process.exit(1);
  }
}

start();
