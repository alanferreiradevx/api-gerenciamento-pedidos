/**
 * Camada de regras de negócio.
 * Não conhece Express (req/res): recebe dados simples, aplica as regras
 * e lança erros de domínio quando algo está errado.
 */
const repository = require('../repositories/pedidoRepository');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const {
  validarCriacao,
  validarStatus,
  transicaoPermitida,
  TRANSICOES,
} = require('../validators/pedidoValidator');

const STATUS_INICIAL = 'recebido';

/**
 * Converte o id recebido na URL. Qualquer id que não seja inteiro positivo
 * não pode existir no sistema, então é tratado como "não encontrado" (404).
 */
function converterId(idBruto) {
  const id = Number(idBruto);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function criarPedido(dados) {
  const erros = validarCriacao(dados);
  if (erros.length > 0) {
    throw new ValidationError('Dados do pedido inválidos.', erros);
  }

  return repository.criar({
    cliente: dados.cliente.trim(),
    tipo: dados.tipo,
    valor: dados.valor,
    prioridade: dados.prioridade,
    status: STATUS_INICIAL,
  });
}

function listarPedidos() {
  return repository.listar();
}

function buscarPedido(idBruto) {
  const id = converterId(idBruto);
  const pedido = id === null ? null : repository.buscarPorId(id);
  if (!pedido) {
    throw new NotFoundError(`Pedido com id ${idBruto} não encontrado.`);
  }
  return pedido;
}

function atualizarStatus(idBruto, dados) {
  // 1º verifica se o pedido existe (404), depois valida o corpo (400)
  const pedido = buscarPedido(idBruto);

  const erros = validarStatus(dados);
  if (erros.length > 0) {
    throw new ValidationError('Status inválido.', erros);
  }

  const novoStatus = dados.status;
  if (!transicaoPermitida(pedido.status, novoStatus)) {
    const permitidos = TRANSICOES[pedido.status];
    const dica = permitidos.length
      ? `A partir de "${pedido.status}" só é possível ir para: ${permitidos.join(', ')}.`
      : `"${pedido.status}" é um status final e não pode mais ser alterado.`;
    throw new ValidationError(
      `Transição de "${pedido.status}" para "${novoStatus}" não é permitida.`,
      [dica],
    );
  }

  return repository.atualizar(pedido.id, { status: novoStatus });
}

module.exports = { criarPedido, listarPedidos, buscarPedido, atualizarStatus };
