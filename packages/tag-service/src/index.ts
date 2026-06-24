import express from 'express';
import cookieParser from 'cookie-parser';
import { connectMongo, connectPostgres, errorHandler, notFound, healthRouter } from '@breezy/shared';
import tagRoutes from './routes/tags';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(cookieParser());

// Health check
app.use('/api/health', healthRouter);

// Routes
app.use('/api/tags', tagRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectMongo();
    // Mongo héberge les posts, mais la recherche masque les bloqués (Postgres).
    await connectPostgres();

    app.listen(PORT, () => {
      console.log(`Tag service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start tag service:', err);
    process.exit(1);
  }
}

start();
