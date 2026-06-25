import express from 'express';
import cookieParser from 'cookie-parser';
import { connectPostgres, connectMongo, errorHandler, notFound, healthRouter } from '@breezy/shared';
import publicPosts from './routes/publicPosts';
import postRoutes from './routes/posts';
import feedRoutes from './routes/feed';
import likeRoutes from './routes/likes';
import commentRoutes from './routes/comments';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);

app.use('/api/posts', publicPosts);
app.use('/api/posts', postRoutes);
app.use('/api/posts', feedRoutes);
app.use('/api/posts', likeRoutes);
app.use('/api/posts', commentRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectPostgres();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`Post service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start post service:', err);
    process.exit(1);
  }
}

start();
