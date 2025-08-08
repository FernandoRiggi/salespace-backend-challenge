import express, { Request, Response, NextFunction } from 'express';
import orderRoutes from './routes/order.routes';
import { AppError } from './errors/AppError';

const app = express();
app.use(express.json());

app.use('/v1/orders', orderRoutes);

app.use((err: Error, request: Request, response: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    if(err.data){
      return response.status(err.statusCode).json({
        message: err.message,
        ...err.data,
      });
    }
    return response.status(err.statusCode).json({
      message: err.message,
    });
  }

  console.error(err);
  return response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export default app;
