import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
  private orderService: OrderService;

  constructor(){
    this.orderService = new OrderService;
  }

  public createQuote(req: Request, res: Response): Response {
    const result = this.orderService.createQuote(req.body);
    return res.status(201).json(result);
  }

  public finalizeOrder(req: Request, res:Response): Response{
    const { idempotencyKey } = req.body;
    const result = this.orderService.finalizeOrder(idempotencyKey);
    return res.status(200).json(result);
  }

}