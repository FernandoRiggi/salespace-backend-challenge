import { OrderService } from './order.service';
import { AppError } from '../errors/AppError';
import { quoteStore } from '../data/quote.store';
import { OrderItemInput } from '../types';

beforeEach(() => {
  quoteStore.clear();
});

describe('OrderService - Bónus de Cotação', () => {
  let orderService: OrderService;
  const mockOrderItems: { items: OrderItemInput[] } = {
    items: [{ productId: 'sku-roupa-001', quantity: 2 }],
  };

  beforeEach(() => {
    orderService = new OrderService();
  });

  describe('createQuote', () => {
    it('deve criar uma cotação com sucesso e guardá-la na store', () => {
      const quoteResponse = orderService.createQuote(mockOrderItems);

      expect(quoteResponse).toHaveProperty('idempotencyKey');
      expect(quoteResponse).toHaveProperty('expiresAt');
      expect(quoteResponse.total).toBe(379.8); 

      const storedQuote = quoteStore.get(quoteResponse.idempotencyKey);
      expect(storedQuote).toBeDefined();
      expect(storedQuote?.id).toBe(quoteResponse.idempotencyKey);
    });

    it('deve lançar um erro 422 se a lista de itens estiver vazia', () => {
      expect(() => {
        orderService.createQuote({ items: [] });
      }).toThrow(new AppError('O campo "items" é obrigatório e não pode estar vazio.', 422));
    });
  });

  describe('finalizeOrder', () => {
    it('deve finalizar um pedido com sucesso usando uma chave de cotação válida', () => {
      const { idempotencyKey } = orderService.createQuote(mockOrderItems);
      
      const finalizedOrder = orderService.finalizeOrder(idempotencyKey);

      expect(finalizedOrder.message).toBe('Pedido finalizado com sucesso!');
      expect(finalizedOrder).toHaveProperty('orderId');

      const storedQuote = quoteStore.get(idempotencyKey);
      expect(storedQuote).toBeUndefined();
    });

    it('deve lançar um erro 404 se a chave de cotação não existir', () => {
      expect(() => {
        orderService.finalizeOrder('chave-invalida-123');
      }).toThrow(new AppError('Cotação não encontrada. Por favor, gere uma nova cotação.', 404));
    });

    it('deve lançar um erro 422 se a cotação estiver expirada e gerar uma nova cotação', () => {
      jest.useFakeTimers();

      const { idempotencyKey } = orderService.createQuote(mockOrderItems);
      jest.advanceTimersByTime(16 * 60 * 1000);

      try {
        orderService.finalizeOrder(idempotencyKey);
        fail('Deveria ter lançado um erro de cotação expirada');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.statusCode).toBe(422);
        expect(appError.message).toContain('Cotação expirada. Uma nova cotação foi gerada:');
        expect(appError.data).toHaveProperty('newQuote');
      }

      jest.useRealTimers();
    });

    it('deve lançar um erro 422 se a chave de idempotência não for fornecida', () => {
        // @ts-ignore - Testando intencionalmente com um argumento inválido (undefined)
        expect(() => orderService.finalizeOrder(undefined)).toThrow(
            new AppError('A chave de idempotência (idempotencyKey) é obrigatória.', 422)
        );
    });
  });

  describe('Validação de Erros de Itens', () => {
    it('deve lançar um erro 404 se um productId não for encontrado', () => {
        const invalidItems = {
            items: [{ productId: 'produto-que-nao-existe', quantity: 1 }]
        };

        expect(() => {
            orderService.createQuote(invalidItems);
        }).toThrow(new AppError("Produto com ID 'produto-que-nao-existe' não encontrado.", 404));
    });

    it('deve lançar um erro 422 se a quantidade de um item for inválida (zero)', () => {
        const invalidItems = {
            items: [{ productId: 'sku-roupa-001', quantity: 0 }]
        };

        expect(() => {
            orderService.createQuote(invalidItems);
        }).toThrow(new AppError('Item inválido: {"productId":"sku-roupa-001","quantity":0}.', 422));
    });

    it('deve lançar um erro 422 se um item não tiver productId', () => {
        const invalidItems = {
            items: [{ quantity: 1 }]
        };
        
        expect(() => {
            orderService.createQuote(invalidItems as any);
        }).toThrow(new AppError('Item inválido: {"quantity":1}.', 422));
    });
  });
});
