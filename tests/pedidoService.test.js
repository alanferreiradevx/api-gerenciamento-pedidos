const pedidoService = require('../src/services/pedidoService');
const repository = require('../src/repositories/pedidoRepository');
const { ValidationError, NotFoundError } = require('../src/errors/AppError');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => {
  repository.limpar();
});

describe('pedidoService.criarPedido', () => {
  test('cria pedido com status inicial "recebido" e id sequencial', () => {
    const p1 = pedidoService.criarPedido(pedidoValido);
    const p2 = pedidoService.criarPedido(pedidoValido);

    expect(p1).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
    expect(p2.id).toBe(2);
  });

  test('remove espaços das extremidades do nome do cliente', () => {
    const p = pedidoService.criarPedido({ ...pedidoValido, cliente: '  Ana  ' });
    expect(p.cliente).toBe('Ana');
  });

  test.each([
    ['cliente ausente', { ...pedidoValido, cliente: undefined }],
    ['cliente só com espaços', { ...pedidoValido, cliente: '   ' }],
    ['cliente não é texto', { ...pedidoValido, cliente: 123 }],
    ['valor zero', { ...pedidoValido, valor: 0 }],
    ['valor negativo', { ...pedidoValido, valor: -10 }],
    ['valor como texto', { ...pedidoValido, valor: '350' }],
    ['tipo desconhecido', { ...pedidoValido, tipo: 'drone' }],
    ['prioridade desconhecida', { ...pedidoValido, prioridade: 'urgentissima' }],
    ['corpo não é objeto', null],
  ])('rejeita %s com ValidationError', (_, dados) => {
    expect(() => pedidoService.criarPedido(dados)).toThrow(ValidationError);
  });

  test('lista todos os erros encontrados de uma vez', () => {
    try {
      pedidoService.criarPedido({});
    } catch (err) {
      expect(err.detalhes).toHaveLength(4);
    }
    expect.assertions(1);
  });
});

describe('pedidoService.buscarPedido', () => {
  test('lança NotFoundError para id inexistente', () => {
    expect(() => pedidoService.buscarPedido('999')).toThrow(NotFoundError);
  });

  test('lança NotFoundError para id em formato inválido', () => {
    expect(() => pedidoService.buscarPedido('abc')).toThrow(NotFoundError);
  });
});

describe('pedidoService.atualizarStatus (transições)', () => {
  test('segue o fluxo completo recebido → em_preparacao → enviado → entregue', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    expect(pedidoService.atualizarStatus(id, { status: 'em_preparacao' }).status).toBe('em_preparacao');
    expect(pedidoService.atualizarStatus(id, { status: 'enviado' }).status).toBe('enviado');
    expect(pedidoService.atualizarStatus(id, { status: 'entregue' }).status).toBe('entregue');
  });

  test('permite cancelar pedido recebido', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    expect(pedidoService.atualizarStatus(id, { status: 'cancelado' }).status).toBe('cancelado');
  });

  test('não permite pular etapas (recebido → entregue)', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    expect(() => pedidoService.atualizarStatus(id, { status: 'entregue' })).toThrow(ValidationError);
  });

  test('não permite cancelar pedido já enviado', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    pedidoService.atualizarStatus(id, { status: 'em_preparacao' });
    pedidoService.atualizarStatus(id, { status: 'enviado' });
    expect(() => pedidoService.atualizarStatus(id, { status: 'cancelado' })).toThrow(ValidationError);
  });

  test('não permite alterar pedido cancelado (estado final)', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    pedidoService.atualizarStatus(id, { status: 'cancelado' });
    expect(() => pedidoService.atualizarStatus(id, { status: 'em_preparacao' })).toThrow(ValidationError);
  });

  test('rejeita status desconhecido', () => {
    const { id } = pedidoService.criarPedido(pedidoValido);
    expect(() => pedidoService.atualizarStatus(id, { status: 'perdido' })).toThrow(ValidationError);
  });

  test('id inexistente tem prioridade: 404 mesmo com corpo inválido', () => {
    expect(() => pedidoService.atualizarStatus(999, { status: 'xyz' })).toThrow(NotFoundError);
  });
});
