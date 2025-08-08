
import { OrderItemInput, Product, OrderItemOutput, Discount, OrderResponse } from '../types';
import { products } from '../data/products';
import { DiscountEngine } from './discount.service';
import { AppError } from '../errors/AppError';

export class OrderService{
    private productMap: Record<string, Product>;
    private discountEngine: DiscountEngine;

    constructor(){
        this.productMap = products.reduce((map, product) => {
            map[product.id] = product;
            return map;
        }, {} as Record<string, Product>);
        this.discountEngine = new DiscountEngine();
    }

    public procesOrder(data: { items: OrderItemInput[] }): OrderResponse{
        if(!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw new AppError('O campo "items" é obrigatório e não pode estar vazio.', 422);
        }
        
        const items: OrderItemOutput[] = [];
        let subtotal: number = 0;
        let totalQuantity: number = 0;

        for(const item of data.items){
            if (!item.productId || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new AppError(`Item inválido: ${JSON.stringify(item)}. Cada item deve ter "productId" e "quantity" (inteiro positivo).`, 422);
            }
            const product = this.productMap[item.productId];
            if (!product) {
                throw new AppError(`Produto com ID '${item.productId}' não encontrado.`, 404);
            }

        const itemTotal = product.price * item.quantity;

        items.push({
            productId: product.id,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal: parseFloat(itemTotal.toFixed(2)),
            itemDiscounts: [],
            total: parseFloat(itemTotal.toFixed(2)),
            category: product.category
        });

        subtotal += itemTotal;
        totalQuantity += item.quantity;
        }

        const { discounts, total} = this.discountEngine.calculateDiscounts({items, subtotal, totalQuantity});

    return{
        currency: 'BRL',
        items: items.map(({ category, ...rest }) => rest), 
        discounts,
        total
        };
    }
}