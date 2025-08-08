import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
  public create(req: Request, res: Response): Response {
    const orderService = new OrderService();
    
    const result = orderService.procesOrder(req.body);
    
    return res.status(200).json(result);
  }
}