const { AppError } = require('../errors/AppError');

/** Rotas que não existem na API. */
function notFoundHandler(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

/**
 * Tratamento centralizado de erros.
 * - AppError (validação / não encontrado): devolve o código e a mensagem do próprio erro.
 * - JSON malformado no corpo: 400 (erro do cliente, não do servidor).
 * - Qualquer outro erro: 500, sem expor detalhes internos ao cliente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const corpo = { erro: err.message };
    if (err.detalhes) corpo.detalhes = err.detalhes;
    return res.status(err.statusCode).json(corpo);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido.' });
  }

  console.error('[erro inesperado]', err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { notFoundHandler, errorHandler };
