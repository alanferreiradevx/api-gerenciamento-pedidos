/**
 * Camada de controle (HTTP).
 * Traduz a requisição em chamada ao service e o resultado em resposta HTTP.
 * Não contém regra de negócio; erros são repassados ao middleware com next().
 */
const pedidoService = require('../services/pedidoService');

function criar(req, res, next) {
  try {
    const pedido = pedidoService.criarPedido(req.body);
    res.status(201).json(pedido);
  } catch (err) {
    next(err);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(pedidoService.listarPedidos());
  } catch (err) {
    next(err);
  }
}

function buscarPorId(req, res, next) {
  try {
    res.status(200).json(pedidoService.buscarPedido(req.params.id));
  } catch (err) {
    next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const pedido = pedidoService.atualizarStatus(req.params.id, req.body);
    res.status(200).json(pedido);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
