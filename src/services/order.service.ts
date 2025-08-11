import { OrderItemInput, Product, OrderItemOutput, QuoteResponse, Quote, FinalizedOrderResponse } from '../types';
import { products } from '../data/products';
import { quoteStore } from '../data/quote.store';
import { DiscountEngine } from './discount.service';
import { AppError } from '../errors/AppError';
import { randomUUID } from 'crypto';

export class OrderService {
    private productMap: Map<string, Product>;
    private discountEngine: DiscountEngine;
    private QUOTE_VALIDITY_IN_MINUTES = 15;

    constructor() {
        this.productMap = new Map(products.map((p) => [p.id, p]));
        this.discountEngine = new DiscountEngine();
    }

    public createQuote(data: { items: OrderItemInput[] }): QuoteResponse {
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw new AppError('O campo "items" é obrigatório e não pode estar vazio.', 422);
        }

        const { items: initialItems, subtotal, totalQuantity } = this.processItems(data.items);

        const {
            itemsWithDiscounts,
            cartDiscounts,
            finalTotal
        } = this.discountEngine.calculateDiscounts({
            items: initialItems,
            subtotal,
            totalQuantity
        });

        const idempotencyKey = randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.QUOTE_VALIDITY_IN_MINUTES * 60000);

        const quote: Quote = {
            id: idempotencyKey,
            items: itemsWithDiscounts, 
            discounts: cartDiscounts,
            total: finalTotal,
            createdAt: now,
            expiresAt,
        };
        quoteStore.set(idempotencyKey, quote);
        console.log(`Cotação criada: ${idempotencyKey}, expira em: ${expiresAt.toLocaleTimeString()}`);

        const publicResponse = {
            currency: 'BRL',
            items: itemsWithDiscounts.map(({ category, ...rest }) => rest), 
            discounts: cartDiscounts,
            total: finalTotal,
        };

        return {
            idempotencyKey,
            expiresAt: expiresAt.toISOString(),
            ...publicResponse
        };
    }

    public finalizeOrder(idempotencyKey: string): FinalizedOrderResponse {
        if (!idempotencyKey) {
            throw new AppError('A chave de idempotência (idempotencyKey) é obrigatória.', 422);
        }

        const quote = quoteStore.get(idempotencyKey);

        if (!quote) {
            throw new AppError('Cotação não encontrada. Por favor, gere uma nova cotação.', 404);
        }

        const now = new Date();
        if (now > quote.expiresAt) {
            console.log(`Tentativa de finalizar cotação expirada: ${idempotencyKey}`);
            const originalItemsInput: OrderItemInput[] = quote.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
            const newQuoteResponse = this.createQuote({ items: originalItemsInput });
            throw new AppError(`Cotação expirada. Uma nova cotação foi gerada com o ID: ${newQuoteResponse.idempotencyKey}`, 422, { newQuote: newQuoteResponse });
        }

        console.log(`Pedido finalizado com sucesso a partir da cotação: ${idempotencyKey}`);
        
        quoteStore.delete(idempotencyKey);

        return {
            message: 'Pedido finalizado com sucesso!',
            orderId: randomUUID(), 
            order: {
                idempotencyKey: quote.id,
                expiresAt: quote.expiresAt.toISOString(),
                currency: 'BRL',
                items: quote.items.map(({ category, ...rest }) => rest),
                discounts: quote.discounts,
                total: quote.total,
            }
        };
    }
    
    private processItems(inputItems: OrderItemInput[]): { items: OrderItemOutput[], subtotal: number, totalQuantity: number } {
        const items: OrderItemOutput[] = [];
        let subtotal = 0;
        let totalQuantity = 0;

        for (const item of inputItems) {
            if (!item.productId || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new AppError(`Item inválido: ${JSON.stringify(item)}.`, 422);
            }
            const product = this.productMap.get(item.productId);
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
        return { items, subtotal: parseFloat(subtotal.toFixed(2)), totalQuantity };
    }
}