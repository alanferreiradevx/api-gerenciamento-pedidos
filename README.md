# API de Gerenciamento de Pedidos

API REST para gerenciar os pedidos de uma pequena loja, desenvolvida em **Node.js + Express** com arquitetura em camadas, validação de dados, tratamento centralizado de erros e testes automatizados com **Jest**.

Projeto prático avaliativo — *Tópicos Avançados em Sistemas de Informação II*.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Instalação e execução](#instalação-e-execução)
- [Rotas](#rotas)
- [Regras de validação](#regras-de-validação)
- [Fluxo de status (transições)](#fluxo-de-status-transições)
- [Formato dos erros](#formato-dos-erros)
- [Arquitetura](#arquitetura)
- [Padrão implementado](#padrão-implementado)
- [Testes](#testes)
- [Evidências (Postman)](#evidências-postman)
- [Uso de IA](#uso-de-ia)

---

## Tecnologias

| Ferramenta | Uso |
|---|---|
| Node.js (>= 18) | Ambiente de execução |
| Express 4 | Servidor HTTP e rotas |
| Jest | Testes automatizados |
| Supertest | Requisições HTTP nos testes de integração |
| Postman | Testes manuais e evidências |

Os dados ficam **em memória** (não há banco de dados). Ao reiniciar a API, a lista de pedidos volta a ficar vazia e os IDs recomeçam em 1.

## Instalação e execução

Pré-requisito: Node.js 18 ou superior.

```bash
git clone <url-do-repositorio>
cd api-gerenciamento-pedidos
npm install
npm start
```

A API sobe em `http://localhost:3000`. Para usar outra porta: `PORT=4000 npm start` (no Windows PowerShell: `$env:PORT=4000; npm start`).

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | Roda todos os testes automatizados |
| `npm run dev` | Sobe a API reiniciando sozinha a cada alteração de arquivo |

## Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 – pedido criado | 400 – dados inválidos |
| GET | `/pedidos` | 200 – lista de pedidos | — |
| GET | `/pedidos/:id` | 200 – pedido encontrado | 404 – pedido inexistente |
| PATCH | `/pedidos/:id/status` | 200 – status atualizado | 400 – status inválido ou transição não permitida; 404 – pedido inexistente |

### Exemplos

**Criar pedido**

```http
POST /pedidos
Content-Type: application/json

{
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal"
}
```

Resposta `201 Created`:

```json
{
  "id": 1,
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "recebido"
}
```

Todo pedido novo começa com status `recebido`; o cliente não escolhe o status na criação (se enviar, é ignorado). Campos extras no corpo também são ignorados.

**Listar pedidos** — `GET /pedidos` → `200 OK` com um array (vazio se não houver pedidos).

**Consultar pedido** — `GET /pedidos/1` → `200 OK` com o pedido. `GET /pedidos/999` → `404 Not Found`.

**Atualizar status**

```http
PATCH /pedidos/1/status
Content-Type: application/json

{ "status": "em_preparacao" }
```

Resposta `200 OK`: o pedido completo com o novo status.

## Regras de validação

| Campo | Regra | Valores aceitos |
|---|---|---|
| `cliente` | Obrigatório, texto, não pode ficar vazio depois de remover espaços das extremidades. É salvo já sem esses espaços (`"  Ana "` → `"Ana"`). | qualquer texto |
| `tipo` | Obrigatório, deve ser um valor reconhecido | `entrega`, `retirada` |
| `valor` | Obrigatório, deve ser do tipo número (JSON number) e maior que zero. O texto `"350"` é rejeitado. | ex.: `350`, `19.9` |
| `prioridade` | Obrigatória, deve ser um valor reconhecido | `baixa`, `normal`, `alta` |
| `status` (PATCH) | Obrigatório, deve ser um status conhecido **e** a transição deve ser permitida | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

Os valores são sensíveis a maiúsculas/minúsculas (`"Entrega"` é rejeitado).

**IDs:** qualquer `:id` que não corresponda a um pedido cadastrado retorna **404** — inclusive IDs em formato inválido como `abc` ou `-1`, já que nunca poderão existir.

**Ordem das verificações no PATCH:** primeiro verifica se o pedido existe (404); só depois valida o corpo (400). Assim, `PATCH /pedidos/999/status` com qualquer corpo responde 404.

## Fluxo de status (transições)

```
recebido ──► em_preparacao ──► enviado ──► entregue
   │               │
   └──► cancelado ◄┘
```

| Status atual | Pode ir para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | — (status final) |
| `cancelado` | — (status final) |

Justificativa das regras:

- **Não é possível pular etapas** (ex.: `recebido` → `entregue`): um pedido não pode ser entregue sem ter sido preparado e enviado.
- **Cancelamento só antes do envio**: depois que o pedido saiu da loja, cancelar não faz mais sentido operacionalmente (seria um caso de devolução, fora do escopo).
- **`entregue` e `cancelado` são finais**: não podem voltar atrás nem mudar.
- **Não é permitido "atualizar" para o mesmo status** (ex.: `recebido` → `recebido`), pois não representa uma mudança real.

Transição não permitida responde **400** com a explicação do que é possível:

```json
{
  "erro": "Transição de \"recebido\" para \"entregue\" não é permitida.",
  "detalhes": ["A partir de \"recebido\" só é possível ir para: em_preparacao, cancelado."]
}
```

## Formato dos erros

Todas as respostas de erro são JSON com a chave `erro` (mensagem geral) e, quando há mais informações, `detalhes` (lista):

```json
{
  "erro": "Dados do pedido inválidos.",
  "detalhes": [
    "cliente é obrigatório e deve ser um texto não vazio.",
    "valor é obrigatório e deve ser um número maior que zero."
  ]
}
```

| Código | Quando acontece |
|---|---|
| 400 | Dados inválidos, transição não permitida ou corpo que não é JSON válido |
| 404 | Pedido inexistente ou rota que não existe |
| 500 | Erro inesperado no servidor. A resposta é genérica (`"Erro interno do servidor."`) e o detalhe só aparece no log do servidor, para não expor informações internas nem confundir falha do sistema com erro do usuário. |

Todas as validações reportam **todos** os problemas de uma vez, para o cliente da API corrigir tudo numa única tentativa.

## Arquitetura

```
src/
├── server.js                  # Sobe o servidor (app.listen)
├── app.js                     # Monta o Express: JSON, rotas e middlewares de erro
├── routes/
│   └── pedidoRoutes.js        # Associa método + caminho ao controller
├── controllers/
│   └── pedidoController.js    # Lê req, chama o service, devolve res com o código HTTP
├── services/
│   └── pedidoService.js       # Regras de negócio: criação, busca, transições de status
├── validators/
│   └── pedidoValidator.js     # Valores aceitos e validação dos dados de entrada
├── repositories/
│   └── pedidoRepository.js    # Armazenamento em memória
├── errors/
│   └── AppError.js            # Erros de domínio (ValidationError 400, NotFoundError 404)
└── middlewares/
    └── errorHandler.js        # Converte erros em respostas JSON (400/404/500)
tests/
├── pedidoService.test.js      # Testes unitários das regras de negócio
└── pedidos.api.test.js        # Testes de integração das rotas HTTP
postman/
└── api-pedidos.postman_collection.json
evidencias/                    # Prints do Postman
```

Caminho de uma requisição:

```
Requisição → routes → controller → service → (validator) → repository
                                       │
                         erro lançado  ▼
                  controller → next(err) → errorHandler → resposta JSON
```

**Responsabilidade de cada camada**

- **routes** — só define *quais* URLs existem e qual função do controller atende cada uma.
- **controllers** — camada HTTP: pega `req.body`/`req.params`, chama o service e escolhe o código de sucesso (201, 200). Não tem regra de negócio; qualquer erro é repassado com `next(err)`.
- **services** — o "cérebro": valida os dados (usando o validator), aplica o status inicial, verifica transições e lança `ValidationError`/`NotFoundError`. Não conhece Express, por isso pode ser testado sem HTTP.
- **validators** *(pasta adicional)* — separa as listas de valores aceitos e as funções de validação, que são puras e fáceis de testar. Deixa o service focado no fluxo.
- **repositories** *(pasta adicional)* — isola o armazenamento. Hoje é um array em memória; para trocar por um banco de dados, só este arquivo mudaria. Devolve cópias dos objetos para que ninguém altere os dados guardados por fora.
- **errors** e **middlewares** *(pastas adicionais)* — centralizam o tratamento de erros em um único lugar, garantindo o mesmo formato de resposta em toda a API e a separação entre erro do usuário (400/404) e erro inesperado (500).

`app.js` e `server.js` são separados para que os testes importem o `app` sem precisar abrir uma porta de rede.

## Padrão implementado

**Arquitetura em camadas (Layered Architecture)** no estilo *Routes → Controller → Service → Repository*, com:

- **Separação de responsabilidades**: cada camada só conversa com a camada logo abaixo.
- **Repository Pattern**: o acesso aos dados fica escondido atrás de funções (`criar`, `listar`, `buscarPorId`, `atualizar`).
- **Tratamento centralizado de erros**: erros de domínio tipados (`AppError` com `statusCode`) + um middleware de erro do Express.
- **Máquina de estados simples** para o status do pedido (tabela `TRANSICOES` em `pedidoValidator.js`).

## Testes

```bash
npm test
```

São 34 testes em dois arquivos:

- **`tests/pedidoService.test.js`** (unitários) — criação com status inicial e ID sequencial, remoção de espaços do cliente, cada regra de validação (cliente vazio/só espaços/não texto, valor zero/negativo/texto, tipo e prioridade desconhecidos), busca inexistente e todas as regras de transição (fluxo completo, cancelamento, pular etapa, cancelar após envio, alterar status final).
- **`tests/pedidos.api.test.js`** (integração, com Supertest) — os códigos HTTP de cada rota (201, 200, 400, 404), JSON malformado (400), rota inexistente (404) e erro inesperado (500, simulando uma falha no service com `jest.spyOn`).

O repositório é limpo antes de cada teste (`beforeEach`), então os testes não dependem uns dos outros.

## Evidências (Postman)

A pasta [`evidencias/`](evidencias/) contém os prints dos testes manuais:

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido → 201 |
| `02-validacao.png` | POST inválido → 400 |
| `03-listagem.png` | GET da lista → 200 |
| `04-consulta-inexistente.png` | GET de ID inexistente → 404 |
| `05-atualizacao.png` | PATCH de status válido → 200 |

A coleção usada está em [`postman/api-pedidos.postman_collection.json`](postman/api-pedidos.postman_collection.json) (Postman → *Import*). As requisições estão numeradas na mesma ordem dos prints e já têm testes automáticos de código HTTP. A variável `baseUrl` vale `http://localhost:3000`.

## Uso de IA

> ⚠️ **Alan: revise e reescreva esta seção com as suas palavras antes de entregar.** Ela precisa refletir o que você realmente fez e decidiu.

Utilizei IA (Claude, da Anthropic) como apoio no desenvolvimento deste projeto, nas seguintes tarefas:

- geração da estrutura inicial em camadas e do código das rotas, controllers, services e repositório;
- escrita dos testes automatizados com Jest e Supertest;
- montagem da coleção do Postman e do rascunho deste README.

Depois disso, li todo o código, executei a API e os testes localmente e conferi cada cenário no Postman.

**Sugestões avaliadas:**

- **Aceita — separar `app.js` de `server.js`:** permite que os testes de integração importem a aplicação sem abrir uma porta, o que deixa os testes mais rápidos e evita conflito de porta.
- **Rejeitada — responder 422 (Unprocessable Entity) para transição de status não permitida:** o enunciado do projeto define 400 para dados inválidos no PATCH, então mantive 400 para seguir o requisito publicado e não surpreender quem testar a API.
- **Modificada — IDs em formato inválido (ex.: `/pedidos/abc`):** a primeira ideia era responder 400; optei por 404, porque um ID nesse formato nunca pode corresponder a um pedido e o enunciado associa ID inexistente a 404. A decisão está documentada em [Regras de validação](#regras-de-validação).
