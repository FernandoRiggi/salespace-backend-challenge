import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const orderRoutes = Router();
const orderController = new OrderController();

orderRoutes.post('/quote', orderController.createQuote.bind(orderController));

orderRoutes.post('/', orderController.finalizeOrder.bind(orderController));

export default orderRoutes;
