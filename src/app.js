const express = require('express');
const pedidoRoutes = require('./routes/pedidoRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.use('/pedidos', pedidoRoutes);

// Rota não encontrada (404) e tratamento centralizado de erros
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
