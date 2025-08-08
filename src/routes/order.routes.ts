import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const orderRoutes = Router();
const orderController = new OrderController();

orderRoutes.post('/', orderController.create.bind(orderController));

export default orderRoutes;
