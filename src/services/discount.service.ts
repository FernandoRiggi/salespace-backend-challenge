import { OrderItemOutput, Discount } from '../types';

export class DiscountEngine {
  public calculateDiscounts(
    orderData: { items: OrderItemOutput[]; subtotal: number; totalQuantity: number }
  ): { discounts: Discount[]; total: number } {
    const { items, subtotal, totalQuantity } = orderData;
    const appliedDiscounts: Discount[] = [];

    console.log('--- Iniciando Cálculo de Descontos ---');
    console.log(`Subtotal Bruto: ${subtotal.toFixed(2)} | Quantidade Total: ${totalQuantity}`);

    this.applyCategoryDiscount(items);

    let currentTotal = items.reduce((sum, item) => sum + item.total, 0);
    console.log(`Total após descontos por item (Regra 3): ${currentTotal.toFixed(2)}`);

    const volumeDiscount = this.applyVolumeDiscount(currentTotal, totalQuantity);
    if (volumeDiscount) {
      appliedDiscounts.push(volumeDiscount);
      currentTotal -= volumeDiscount.amount; 
      console.log(`Aplicado Desconto de Volume: -${volumeDiscount.amount.toFixed(2)}. Novo Total: ${currentTotal.toFixed(2)}`);
    }

    const cartValueDiscount = this.applyCartValueDiscount(currentTotal);
    if (cartValueDiscount) {
      appliedDiscounts.push(cartValueDiscount);
      currentTotal -= cartValueDiscount.amount; 
      console.log(`Aplicado Desconto de Valor Fixo: -${cartValueDiscount.amount.toFixed(2)}. Novo Total: ${currentTotal.toFixed(2)}`);
    }
    
    console.log('--- Fim do Cálculo de Descontos ---');

    return {
      discounts: appliedDiscounts,
      total: parseFloat(currentTotal.toFixed(2)),
    };
  }

  private applyCategoryDiscount(items: OrderItemOutput[]): void {
    const accessoryItems = items.filter(item => item.category === 'acessorios');
    const totalAccessoryQuantity = accessoryItems.reduce((sum, item) => sum + item.quantity, 0);

    if (totalAccessoryQuantity > 5) {
      console.log(`REGRA 3: Aplicando 5% de desconto em ${accessoryItems.length} item(ns) de acessórios.`);
      
      for (const item of accessoryItems) {
        const discountValue = item.subtotal * 0.05;
        item.itemDiscounts.push({
          code: 'CAT_ACC_5PCT',
          name: 'Categoria acessórios 5%',
          basis: item.subtotal,
          amount: parseFloat(discountValue.toFixed(2)),
          metadata: { category: 'acessorios', threshold: 5, appliedTo: item.productId },
        });
        item.total -= discountValue;
      }
    }
  }

  private applyVolumeDiscount(currentTotal: number, totalQuantity: number): Discount | null {
    let discountPercentage = 0;
    let tier = '';

    if (totalQuantity >= 50) {
      discountPercentage = 0.20;
      tier = '>= 50 itens';
    } else if (totalQuantity >= 20) {
      discountPercentage = 0.15;
      tier = '>= 20 itens';
    } else if (totalQuantity >= 10) {
      discountPercentage = 0.10;
      tier = '>= 10 itens';
    }

    if (discountPercentage > 0) {
      const discountAmount = currentTotal * discountPercentage;
      console.log(`REGRA 1: Qualificado para ${discountPercentage * 100}% de desconto por volume.`);
      return {
        code: `QTY_TIER_${discountPercentage * 100}PCT`,
        name: `Desconto por volume ${discountPercentage * 100}%`,
        basis: parseFloat(currentTotal.toFixed(2)),
        amount: parseFloat(discountAmount.toFixed(2)),
        metadata: { totalItems: totalQuantity, tier, justification: `${totalQuantity} itens ⇒ faixa ${discountPercentage * 100}%` },
      };
    }

    return null;
  }

  private applyCartValueDiscount(currentTotal: number): Discount | null {
    let discountAmount = 0;
    let threshold = 0;

    if (currentTotal >= 2000) {
      discountAmount = 150.00;
      threshold = 2000;
    } else if (currentTotal >= 1000) {
      discountAmount = 50.00;
      threshold = 1000;
    }

    if (discountAmount > 0) {
      console.log(`REGRA 2: Qualificado para R$${discountAmount} de desconto por valor do carrinho.`);
      return {
        code: `CART_VALUE_FIXED_${discountAmount}`,
        name: 'Desconto por valor do carrinho',
        basis: parseFloat(currentTotal.toFixed(2)),
        amount: discountAmount,
        metadata: { threshold, justification: `Subtotal R$${currentTotal.toFixed(2)} ≥ R$${threshold}` },
      };
    }

    return null;
  }
}
