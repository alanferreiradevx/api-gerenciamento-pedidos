/**
 * Valores aceitos e funções de validação dos dados de entrada.
 * Funções puras: recebem dados e devolvem uma lista de mensagens de erro
 * (lista vazia = dados válidos). Quem decide o que fazer é o service.
 */

const TIPOS = ['entrega', 'retirada'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

/**
 * Transições de status permitidas: estado atual -> próximos estados possíveis.
 * "entregue" e "cancelado" são estados finais.
 */
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

function ehObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validarCriacao(dados) {
  if (!ehObjeto(dados)) {
    return ['O corpo da requisição deve ser um objeto JSON.'];
  }

  const erros = [];
  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio.');
  }

  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    erros.push('valor é obrigatório e deve ser um número maior que zero.');
  }

  if (!TIPOS.includes(tipo)) {
    erros.push(`tipo é obrigatório e deve ser um destes: ${TIPOS.join(', ')}.`);
  }

  if (!PRIORIDADES.includes(prioridade)) {
    erros.push(`prioridade é obrigatória e deve ser uma destas: ${PRIORIDADES.join(', ')}.`);
  }

  return erros;
}

function validarStatus(dados) {
  if (!ehObjeto(dados)) {
    return ['O corpo da requisição deve ser um objeto JSON.'];
  }
  if (!STATUS.includes(dados.status)) {
    return [`status é obrigatório e deve ser um destes: ${STATUS.join(', ')}.`];
  }
  return [];
}

function transicaoPermitida(statusAtual, novoStatus) {
  return (TRANSICOES[statusAtual] || []).includes(novoStatus);
}

module.exports = {
  TIPOS,
  PRIORIDADES,
  STATUS,
  TRANSICOES,
  validarCriacao,
  validarStatus,
  transicaoPermitida,
};
