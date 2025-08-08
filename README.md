# API de Cálculo de Pedidos - Desafio de Estágio Salespace

Esta é uma API REST desenvolvida em Node.js e TypeScript como parte do desafio de estágio backend da Salespace. A API calcula o valor total de um pedido, aplicando um conjunto de regras de desconto progressivas e combinadas.

## Funcionalidades

-   **Cálculo de Subtotal:** Calcula o valor base do pedido a partir da quantidade e do preço unitário dos produtos.
-   **Motor de Descontos Progressivos:** Aplica descontos na seguinte ordem:
    1.  **Desconto por Categoria (Bónus):** Aplica 5% de desconto em cada item da categoria "acessorios" se o pedido contiver mais de 5 unidades dessa categoria.
    2.  **Desconto por Volume:** Aplica um desconto percentual sobre o valor total do pedido com base na quantidade total de itens (10% para ≥ 10 itens, 15% para ≥ 20, 20% para ≥ 50).
    3.  **Desconto por Valor do Carrinho:** Aplica um desconto de valor fixo com base no valor remanescente do pedido (R$ 50 para ≥ R$ 1.000, R$ 150 para ≥ R$ 2.000).
-   **Resposta Detalhada:** Retorna o valor final do pedido, uma lista detalhada dos itens (com descontos individuais) e uma lista dos descontos globais aplicados, incluindo a base de cálculo e a justificação.
-   **Tratamento de Erros:** Implementa tratamento de erros para payloads inválidos (422), produtos não encontrados (404) e erros internos do servidor (500).
-   **Observabilidade:** Inclui logs detalhados durante o processo de cálculo para facilitar a depuração.

## Tecnologias Utilizadas

-   **Node.js:** Ambiente de execução JavaScript.
-   **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
-   **Express:** Framework web para a criação da API.
-   **Jest & ts-jest:** Framework e preset para a execução de testes automatizados.

## Como Executar o Projeto

### Pré-requisitos

-   Node.js (v18 ou superior)
-   npm (geralmente vem com o Node.js)

### Passos para Execução

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd <NOME_DA_PASTA_DO_PROJETO>
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

O projeto possui uma suíte de testes automatizados que cobrem 100% da lógica de negócio, além de ser possível testar manualmente os endpoints.

### Testes Automatizados

Para executar todos os testes de unidade e de integração, utilize o comando:

```bash
npm test
```

### Testes Manuais (Exemplos com `curl`)

#### 1. Pedido Simples (Sem Descontos)

```bash
curl -X POST http://localhost:3000/v1/orders \
-H "Content-Type: application/json" \
-d '{
  "items": [
    { "productId": "sku-roupa-001", "quantity": 1 }
  ]
}'
```

#### 2. Pedido com Descontos Combinados

```bash
curl -X POST http://localhost:3000/v1/orders \
-H "Content-Type: application/json" \
-d '{
  "items": [
    { "productId": "sku-premium-002", "quantity": 1 },
    { "productId": "sku-acc-001", "quantity": 3 },
    { "productId": "sku-acc-003", "quantity": 3 },
    { "productId": "sku-intimo-001", "quantity": 9 }
  ]
}'
```

#### 3. Erro de Produto Não Encontrado (404)

```bash
curl -i -X POST http://localhost:3000/v1/orders \
-H "Content-Type: application/json" \
-d '{
  "items": [
    { "productId": "sku-invalido-999", "quantity": 1 }
  ]
}'
```

## Estrutura do Projeto

O projeto segue os princípios de uma **Arquitetura em Camadas (Layered Architecture)** para garantir a separação de responsabilidades, coesão e legibilidade.

-   `src/`
    -   `controllers/`: Responsável por receber as requisições HTTP e orquestrar a resposta.
    -   `data/`: Contém os dados mockados dos produtos.
    -   `errors/`: Define a classe de erro customizada `AppError`.
    -   `routes/`: Define as rotas da API.
    -   `services/`: Contém toda a lógica de negócio da aplicação. O `DiscountService` atua como o "DiscountEngine".
    -   `types.ts`: Define todas as interfaces e tipos do projeto.
