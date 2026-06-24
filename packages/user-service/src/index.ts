import express from 'express';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import publicUsers from './routes/publicUsers';
import userRoutes from './routes/users';
import followRoutes from './routes/follows';
import blockRoutes from './routes/blocks';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/users', publicUsers);
app.use('/api/users', userRoutes);
app.use('/api/users', followRoutes);
app.use('/api/users', blockRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`User service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start user service:', err);
    process.exit(1);
  }
}

start();
