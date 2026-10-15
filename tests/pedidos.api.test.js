/**
 * Testes de integração: exercitam a API pelas rotas HTTP (routes → controller → service).
 * O supertest usa o app diretamente, sem precisar subir o servidor.
 */
const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidoRepository');
const pedidoService = require('../src/services/pedidoService');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => {
  repository.limpar();
});

describe('POST /pedidos', () => {
  test('cria pedido válido e retorna 201 com status "recebido"', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('retorna 400 com mensagem JSON para dados inválidos', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ cliente: '   ', tipo: 'entrega', valor: -5, prioridade: 'normal' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
    expect(res.body.detalhes.length).toBe(2);
  });

  test('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": "Ana",');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON/);
  });
});

describe('GET /pedidos', () => {
  test('retorna 200 com lista vazia quando não há pedidos', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('retorna 200 com os pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send({ ...pedidoValido, cliente: 'Ana' });

    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('GET /pedidos/:id', () => {
  test('retorna 200 para pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');

    expect(res.status).toBe(200);
    expect(res.body.cliente).toBe('Carlos Silva');
  });

  test('retorna 404 para pedido inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });
});

describe('PATCH /pedidos/:id/status', () => {
  test('retorna 200 para atualização válida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelado');
  });

  test('retorna 400 para status desconhecido', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'voando' });
    expect(res.status).toBe(400);
  });

  test('retorna 400 para transição não permitida', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não é permitida/);
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('Erros gerais', () => {
  test('rota inexistente retorna 404', async () => {
    const res = await request(app).get('/produtos');
    expect(res.status).toBe(404);
  });

  test('erro inesperado retorna 500 sem expor detalhes internos', async () => {
    const spyService = jest
      .spyOn(pedidoService, 'listarPedidos')
      .mockImplementation(() => {
        throw new Error('falha simulada no armazenamento');
      });
    const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor.' });

    spyService.mockRestore();
    spyConsole.mockRestore();
  });
});
