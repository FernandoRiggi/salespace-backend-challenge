import request from 'supertest';
import app from '../app'; 
import { quoteStore } from '../data/quote.store';

describe('Order Routes - Integration Tests', () => {

    beforeEach(() => {
        quoteStore.clear();
        jest.restoreAllMocks();
    });

    describe('POST /v1/orders/quote', () => {
        it('deve retornar 422 (Unprocessable Entity) para uma lista de itens vazia', async () => {
            const response = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [] });

            expect(response.status).toBe(422);
            expect(response.body.message).toBe('O campo "items" é obrigatório e não pode estar vazio.');
        });

        it('deve retornar 422 (Unprocessable Entity) para um item com quantidade inválida', async () => {
            const response = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'sku-roupa-001', quantity: 0 }] });

            expect(response.status).toBe(422);
            expect(response.body.message).toContain('Item inválido');
        });

        it('deve retornar 404 (Not Found) para um ID de produto que não existe', async () => {
            const response = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'non-existent-sku', quantity: 1 }] });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Produto com ID 'non-existent-sku' não encontrado.");
        });

        it('deve retornar 201 (Created) para uma requisição válida', async () => {
            const response = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'sku-roupa-001', quantity: 1 }] });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('idempotencyKey');
            expect(response.body).toHaveProperty('total');
        });
    });

    describe('POST /v1/orders (Finalize)', () => {
        it('deve retornar 200 (OK) e finalizar um pedido com sucesso', async () => {
            const quoteResponse = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'sku-roupa-001', quantity: 1 }] });
            
            const { idempotencyKey } = quoteResponse.body;

            const finalizeResponse = await request(app)
                .post('/v1/orders')
                .send({ idempotencyKey });

            expect(finalizeResponse.status).toBe(200);
            expect(finalizeResponse.body.message).toBe('Pedido finalizado com sucesso!');
            expect(finalizeResponse.body).toHaveProperty('orderId');
        });

        it('deve retornar 422 (Unprocessable Entity) se a idempotencyKey estiver em falta', async () => {
            const response = await request(app)
                .post('/v1/orders')
                .send({}); 

            expect(response.status).toBe(422);
            expect(response.body.message).toBe('A chave de idempotência (idempotencyKey) é obrigatória.');
        });

        it('deve retornar 404 (Not Found) para uma idempotencyKey que não existe', async () => {
            const response = await request(app)
                .post('/v1/orders')
                .send({ idempotencyKey: 'non-existent-key' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cotação não encontrada. Por favor, gere uma nova cotação.');
        });

        it('deve retornar 422 (Unprocessable Entity) para uma cotação expirada e incluir uma nova cotação', async () => {
            const quoteResponse = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'sku-roupa-001', quantity: 1 }] });

            const { idempotencyKey } = quoteResponse.body;

            const futureTime = new Date(Date.now() + 16 * 60 * 1000); 
            jest.spyOn(global, 'Date').mockImplementation(() => futureTime);

            const finalizeResponse = await request(app)
                .post('/v1/orders')
                .send({ idempotencyKey });

            expect(finalizeResponse.status).toBe(422);
            expect(finalizeResponse.body.message).toContain('Cotação expirada. Uma nova cotação foi gerada com o ID:');
            expect(finalizeResponse.body).toHaveProperty('newQuote');
        });

        it('deve retornar 500 (Internal Server Error) para um erro inesperado', async () => {
            jest.spyOn(quoteStore, 'set').mockImplementation(() => {
                throw new Error('Erro inesperado de banco de dados!');
            });

            const response = await request(app)
                .post('/v1/orders/quote')
                .send({ items: [{ productId: 'sku-roupa-001', quantity: 1 }] });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal server error');
        });
    });
});
