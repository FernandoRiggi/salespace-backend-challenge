# API de Cálculo de Pedidos - Desafio de Estágio Salespace

Esta é uma API REST desenvolvida em Node.js e TypeScript como parte do desafio de estágio backend da Salespace. A API calcula o valor total de um pedido, aplicando um conjunto de regras de desconto progressivas e, adicionalmente, implementa um fluxo de cotação e finalização de pedidos.

## Funcionalidades Principais

* **Cálculo de Subtotal:** Calcula o valor base do pedido a partir da quantidade e do preço unitário dos produtos.
* **Motor de Descontos Progressivos:** Aplica descontos na seguinte ordem:
    1.  **Desconto por Categoria:** Aplica 5% de desconto em cada item da categoria "acessorios" se o pedido contiver 5 ou mais unidades dessa categoria.
    2.  **Desconto por Volume:** Aplica um desconto percentual sobre o valor total do pedido com base na quantidade total de itens (10% para ≥ 10 itens, 15% para ≥ 20, 20% para ≥ 50).
    3.  **Desconto por Valor do Carrinho:** Aplica um desconto de valor fixo com base no valor remanescente do pedido (R$ 50 para ≥ R$ 1.000, R$ 150 para ≥ R$ 2.000).
* **Resposta Detalhada:** Retorna o valor final do pedido, uma lista detalhada dos itens (com descontos individuais) e uma lista dos descontos globais aplicados.
* **Tratamento de Erros:** Implementa tratamento de erros para payloads inválidos (422), produtos não encontrados (404) e erros internos do servidor (500).
* **Observabilidade:** Inclui logs detalhados durante o processo de cálculo para facilitar a depuração.

## Funcionalidades (Bônus)

* **Fluxo de Cotação e Finalização:** A API expõe duas rotas para simular um ambiente de vendas B2B:
    * `POST /v1/orders/quote`: Gera uma cotação com um preço "congelado" e retorna uma chave de idempotência com validade de 15 minutos.
    * `POST /v1/orders`: Finaliza um pedido utilizando a chave de idempotência, garantindo o preço da cotação original.
* **Gestão de Cotações Expiradas:** Se uma tentativa de finalização ocorrer com uma chave expirada, a API retorna um erro e, proativamente, gera uma nova cotação para o cliente.

## Tecnologias Utilizadas

* **Node.js:** Ambiente de execução JavaScript.
* **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
* **Express:** Framework web para a criação da API.
* **Jest & ts-jest:** Framework e preset para a execução de testes automatizados.
* **Supertest:** Biblioteca para testes de integração de APIs HTTP.

## Como Executar o Projeto

### Pré-requisitos

* Node.js (v18 ou superior)
* npm (geralmente vem com o Node.js)

### Passos para Execução

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/FernandoRiggi/salespace-backend-challenge.git](https://github.com/FernandoRiggi/salespace-backend-challenge.git)
    cd salespace-backend-challenge
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute em modo de desenvolvimento:**
    O servidor irá iniciar com recarregamento automático em `http://localhost:3000`.
    ```bash
    npm run dev
    ```

## Como Testar

### Testes Automatizados

Para executar a suíte completa de testes, que garante **100% de cobertura** da lógica de negócio, utilize o comando:
```bash
npm test
```

### Testes Manuais com a API

#### 1. Criar uma Cotação

**Requisição:**
```bash
curl -X POST http://localhost:3000/v1/orders/quote \
-H "Content-Type: application/json" \
-d '{
  "items": [
    { "productId": "sku-intimo-001", "quantity": 15 },
    { "productId": "sku-acc-001", "quantity": 6 }
  ]
}'
```

**Exemplo de Resposta:**
```json
{
    "idempotencyKey": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    "expiresAt": "2025-08-11T00:30:00.000Z",
    "currency": "BRL",
    "items": [
        {
            "productId": "sku-intimo-001",
            "unitPrice": 119.9,
            "quantity": 15,
            "subtotal": 1798.5,
            "itemDiscounts": [],
            "total": 1798.5
        },
        {
            "productId": "sku-acc-001",
            "unitPrice": 59.9,
            "quantity": 6,
            "subtotal": 359.4,
            "itemDiscounts": [
                {
                    "code": "CAT_ACC_5PCT",
                    "name": "Categoria acessórios 5%",
                    "basis": 359.4,
                    "amount": 17.97,
                    "metadata": { "category": "acessorios", "threshold": 5 }
                }
            ],
            "total": 341.43
        }
    ],
    "discounts": [
        {
            "code": "QTY_TIER_15PCT",
            "name": "Desconto por volume 15%",
            "basis": 2139.93,
            "amount": 320.99,
            "metadata": { "totalItems": 21, "tier": ">= 20" }
        },
        {
            "code": "CART_VALUE_FIXED_50",
            "name": "Desconto por valor do carrinho",
            "basis": 1818.94,
            "amount": 50,
            "metadata": { "threshold": 1000 }
        }
    ],
    "total": 1768.94
}
```

#### 2. Finalizar um Pedido

Copie a `idempotencyKey` da resposta anterior e use-a na requisição abaixo.

**Requisição:**
```bash
curl -X POST http://localhost:3000/v1/orders \
-H "Content-Type: application/json" \
-d '{
  "idempotencyKey": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
}'
```

## Estrutura do Projeto

O projeto segue os princípios de uma **Arquitetura em Camadas (Layered Architecture)** para garantir a separação de responsabilidades, coesão e legibilidade.

* `src/`
    * `controllers/`: Responsável por receber as requisições HTTP e orquestrar a resposta.
    * `data/`: Contém os dados mockados e o armazenamento em memória.
    * `errors/`: Define a classe de erro customizada `AppError`.
    * `routes/`: Define as rotas da API.
    * `services/`: Contém toda a lógica de negócio da aplicação.
    * `types.ts`: Define todas as interfaces e tipos do projeto.
