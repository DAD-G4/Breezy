import express, { Router } from 'express';
import { errorHandler } from '../middleware/errorHandler';
import notFound from '../middleware/notFound';

export function buildTestApp(routePath: string, router: Router): express.Application {
  const app = express();
  app.use(express.json());
  app.use(routePath, router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
