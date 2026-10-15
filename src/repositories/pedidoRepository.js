/**
 * Camada de acesso a dados — armazenamento em memória.
 * Só guarda e recupera pedidos; não conhece regras de negócio.
 * Se um dia trocar por banco de dados, só este arquivo muda.
 */
let pedidos = [];
let proximoId = 1;

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return { ...pedido };
}

function listar() {
  return pedidos.map((p) => ({ ...p }));
}

function buscarPorId(id) {
  const pedido = pedidos.find((p) => p.id === id);
  return pedido ? { ...pedido } : null;
}

function atualizar(id, campos) {
  const pedido = pedidos.find((p) => p.id === id);
  if (!pedido) return null;
  Object.assign(pedido, campos);
  return { ...pedido };
}

/** Usado apenas nos testes, para cada teste começar do zero. */
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizar, limpar };
