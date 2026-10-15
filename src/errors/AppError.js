/**
 * Erros de domínio da aplicação.
 *
 * Erros "esperados" (dados inválidos, recurso inexistente) são lançados
 * como subclasses de AppError e carregam o código HTTP correspondente.
 * Qualquer outro erro é tratado como inesperado pelo middleware e vira HTTP 500.
 */
class AppError extends Error {
  constructor(message, statusCode, detalhes) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}

class ValidationError extends AppError {
  constructor(message, detalhes) {
    super(message, 400, detalhes);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
