import { OrderItemOutput, Discount } from '../types';

export class DiscountEngine {
    public calculateDiscounts(
        orderData: { items: OrderItemOutput[]; subtotal: number; totalQuantity: number }
    ): { itemsWithDiscounts: OrderItemOutput[]; cartDiscounts: Discount[]; finalTotal: number } {
        const { items, subtotal, totalQuantity } = orderData;
        
        const cartDiscounts: Discount[] = [];

        console.log('--- Iniciando Cálculo de Descontos ---');
        console.log(`Subtotal Bruto: ${subtotal.toFixed(2)} | Quantidade Total: ${totalQuantity}`);

        this.applyCategoryDiscount(items);

        let currentTotal = items.reduce((sum, item) => sum + item.total, 0);
        console.log(`Total após descontos por item: ${currentTotal.toFixed(2)}`);

        const volumeBasis = currentTotal;
        const volumeDiscount = this.applyVolumeDiscount(volumeBasis, totalQuantity);
        if (volumeDiscount) {
            cartDiscounts.push(volumeDiscount);
            currentTotal = this.applyAmountSafely(currentTotal, volumeDiscount.amount);
            console.log(`Desconto de Volume aplicado: -${volumeDiscount.amount.toFixed(2)} | Novo Total: ${currentTotal.toFixed(2)}`);
        }

        const cartValueBasis = currentTotal;
        const cartValueDiscount = this.applyCartValueDiscount(cartValueBasis);
        if (cartValueDiscount) {
            cartDiscounts.push(cartValueDiscount);
            currentTotal = this.applyAmountSafely(currentTotal, cartValueDiscount.amount);
            console.log(`Desconto de Valor Fixo aplicado: -${cartValueDiscount.amount.toFixed(2)} | Novo Total: ${currentTotal.toFixed(2)}`);
        }

        console.log('--- Fim do Cálculo de Descontos ---');

        return {
            itemsWithDiscounts: items,
            cartDiscounts: cartDiscounts,
            finalTotal: parseFloat(currentTotal.toFixed(2)),
        };
    }

    private applyCategoryDiscount(items: OrderItemOutput[]): void {
        const accessoryItems = items.filter(item => item.category === 'acessorios');
        const totalAccessoryQuantity = accessoryItems.reduce((sum, item) => sum + item.quantity, 0);

        if (totalAccessoryQuantity >= 5) {
            console.log(`Aplicando 5% de desconto em ${accessoryItems.length} item(ns) de acessórios.`);

            for (const item of accessoryItems) {
                const discountValue = parseFloat((item.subtotal * 0.05).toFixed(2));
                const safeDiscount = Math.min(discountValue, item.subtotal);

                item.itemDiscounts.push({
                    code: 'CAT_ACC_5PCT',
                    name: 'Categoria acessórios 5%',
                    basis: parseFloat(item.subtotal.toFixed(2)),
                    amount: safeDiscount,
                    metadata: { category: 'acessorios', threshold: 5 },
                });

                item.total = parseFloat((item.subtotal - safeDiscount).toFixed(2));
            }
        }
    }

    private applyVolumeDiscount(basis: number, totalQuantity: number): Discount | null {
        let discountPercentage = 0;
        let tier = '';

        if (totalQuantity >= 50) {
            discountPercentage = 0.20;
            tier = '>= 50';
        } else if (totalQuantity >= 20) {
            discountPercentage = 0.15;
            tier = '>= 20';
        } else if (totalQuantity >= 10) {
            discountPercentage = 0.10;
            tier = '>= 10';
        }

        if (discountPercentage > 0) {
            const discountAmount = parseFloat((basis * discountPercentage).toFixed(2));
            return {
                code: `QTY_TIER_${discountPercentage * 100}PCT`,
                name: `Desconto por volume ${discountPercentage * 100}%`,
                basis: parseFloat(basis.toFixed(2)),
                amount: discountAmount,
                metadata: { totalItems: totalQuantity, tier },
            };
        }
        return null;
    }

    private applyCartValueDiscount(basis: number): Discount | null {
        let discountAmount = 0;
        let threshold = 0;

        if (basis >= 2000) {
            discountAmount = 150.00;
            threshold = 2000;
        } else if (basis >= 1000) {
            discountAmount = 50.00;
            threshold = 1000;
        }

        if (discountAmount > 0) {
            return {
                code: `CART_VALUE_FIXED_${discountAmount}`,
                name: 'Desconto por valor do carrinho',
                basis: parseFloat(basis.toFixed(2)),
                amount: discountAmount,
                metadata: { threshold },
            };
        }
        return null;
    }

    private applyAmountSafely(total: number, discount: number): number {
        return parseFloat(Math.max(0, total - discount).toFixed(2));
    }
}