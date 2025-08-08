import { DiscountEngine } from './discount.service';
import { OrderItemOutput } from '../types';

describe('discountEngine', () => {
    let discountEngine: DiscountEngine;

    beforeEach(() => {
        discountEngine = new DiscountEngine();
    });

    describe('Regra 1: applyVolumeDiscount', () => {
        it('deve retornar null se a quantidade de itens for menor que 10', () => {
            const result = discountEngine['applyVolumeDiscount'](100, 9);
            expect(result).toBeNull();
        });

        it('deve aplicar 10% de desconto para 10 itens', () => {
            const result = discountEngine['applyVolumeDiscount'](1000, 10);
            expect(result).not.toBeNull();
            expect(result?.amount).toBe(100);
            expect(result?.code).toBe('QTY_TIER_10PCT');
        });

        it('deve aplicar 15% de desconto para 20 itens', () => {
            const result = discountEngine['applyVolumeDiscount'](1000, 20);
            expect(result?.amount).toBe(150);
            expect(result?.code).toBe('QTY_TIER_15PCT');
        });

        it('deve aplicar 20% de desconto para 50 itens', () => {
            const result = discountEngine['applyVolumeDiscount'](1000, 50);
            expect(result?.amount).toBe(200);
            expect(result?.code).toBe('QTY_TIER_20PCT');
        });
    });

    describe('Regra 2: applyCartValueDiscount', () => {
        it('deve retornar null se o valor for menor que 1000', () => {
            const result = discountEngine['applyCartValueDiscount'](999.99);
            expect(result).toBeNull();
        });

        it('deve aplicar R$50 de desconto para valor >= 1000', () => {
            const result = discountEngine['applyCartValueDiscount'](1000);
            expect(result).not.toBeNull();
            expect(result?.amount).toBe(50);
            expect(result?.code).toBe('CART_VALUE_FIXED_50');
        });

        it('deve aplicar R$150 de desconto para valor >= 2000', () => {
            const result = discountEngine['applyCartValueDiscount'](2500);
            expect(result?.amount).toBe(150);
            expect(result?.code).toBe('CART_VALUE_FIXED_150');
        });
    });

    describe('Regra 3: applyCategoryDiscount', () => {
        it('não deve aplicar desconto se a quantidade de acessórios for <= 5', () => {
            const mockItems: OrderItemOutput[] = [
                { productId: 'a1', category: 'acessorios', quantity: 5, total: 100, subtotal: 100, unitPrice: 20, itemDiscounts: [] },
            ];
            discountEngine['applyCategoryDiscount'](mockItems);
            expect(mockItems[0].itemDiscounts.length).toBe(0);
            expect(mockItems[0].total).toBe(100);
        });

        it('deve aplicar 5% de desconto nos itens de acessório se a quantidade total for > 5', () => {
            const mockItems: OrderItemOutput[] = [
                { productId: 'a1', category: 'acessorios', quantity: 4, total: 100, subtotal: 100, unitPrice: 25, itemDiscounts: [] },
                { productId: 'a2', category: 'acessorios', quantity: 3, total: 150, subtotal: 150, unitPrice: 50, itemDiscounts: [] },
                { productId: 'r1', category: 'roupas', quantity: 1, total: 200, subtotal: 200, unitPrice: 200, itemDiscounts: [] },
            ];
            discountEngine['applyCategoryDiscount'](mockItems);

            expect(mockItems[0].itemDiscounts.length).toBe(1);
            expect(mockItems[0].itemDiscounts[0].amount).toBe(5);
            expect(mockItems[0].total).toBe(95);

            expect(mockItems[1].itemDiscounts.length).toBe(1);
            expect(mockItems[1].itemDiscounts[0].amount).toBe(7.5);
            expect(mockItems[1].total).toBe(142.5);

            expect(mockItems[2].itemDiscounts.length).toBe(0);
            expect(mockItems[2].total).toBe(200);
        });

        describe('Orquestração: calculateDiscounts', () => {
            it('não deve aplicar descontos para um pedido simples', () => {
                const mockItems: OrderItemOutput[] = [
                    { productId: 'r1', category: 'roupas', quantity: 1, total: 150, subtotal: 150, unitPrice: 150, itemDiscounts: [] },
                ];
                const result = discountEngine.calculateDiscounts({ items: mockItems, subtotal: 150, totalQuantity: 1 });

                expect(result.discounts.length).toBe(0);
                expect(result.total).toBe(150);
            });

            it('deve aplicar todos os descontos de forma progressiva e correta', () => {
                const mockItems: OrderItemOutput[] = [
                    { productId: 'p1', category: 'roupas', quantity: 1, total: 1250, subtotal: 1250, unitPrice: 1250, itemDiscounts: [] },
                    { productId: 'a1', category: 'acessorios', quantity: 3, total: 179.7, subtotal: 179.7, unitPrice: 59.9, itemDiscounts: [] },
                    { productId: 'a2', category: 'acessorios', quantity: 3, total: 239.7, subtotal: 239.7, unitPrice: 79.9, itemDiscounts: [] },
                    { productId: 'i1', category: 'intimo', quantity: 9, total: 1079.1, subtotal: 1079.1, unitPrice: 119.9, itemDiscounts: [] },
                ];
                const subtotal = 2748.5;
                const totalQuantity = 16;

                const result = discountEngine.calculateDiscounts({ items: mockItems, subtotal, totalQuantity });

                expect(result.discounts.length).toBe(2);
                expect(result.discounts.find(d => d.code === 'QTY_TIER_10PCT')).toBeDefined();
                expect(result.discounts.find(d => d.code === 'CART_VALUE_FIXED_150')).toBeDefined();

                expect(result.total).toBe(2304.78);
            });

            it('deve aplicar apenas o desconto de categoria e de valor, sem o de volume', () => {
                const mockItems: OrderItemOutput[] = [
                    { productId: 'p1', category: 'roupas', quantity: 1, total: 1250, subtotal: 1250, unitPrice: 1250, itemDiscounts: [] },
                    { productId: 'a1', category: 'acessorios', quantity: 6, total: 359.4, subtotal: 359.4, unitPrice: 59.9, itemDiscounts: [] },
                ];
                const subtotal = 1609.4;
                const totalQuantity = 7;

                const result = discountEngine.calculateDiscounts({ items: mockItems, subtotal, totalQuantity });

                expect(result.discounts.length).toBe(1);
                expect(result.discounts.find(d => d.code === 'CART_VALUE_FIXED_50')).toBeDefined();

                const accessoryItem = mockItems.find(i => i.productId === 'a1');
                expect(accessoryItem?.itemDiscounts.length).toBe(1);

                expect(result.total).toBe(1541.43);
            });
        });
    });
});