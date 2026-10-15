# Evidências

Coloque aqui os prints do Postman (método, URL, corpo da requisição, resposta e código HTTP visíveis):

- `01-criacao.png` — POST /pedidos válido → 201
- `02-validacao.png` — POST /pedidos inválido → 400
- `03-listagem.png` — GET /pedidos → 200
- `04-consulta-inexistente.png` — GET /pedidos/999 → 404
- `05-atualizacao.png` — PATCH /pedidos/1/status → 200

Use a coleção em `postman/api-pedidos.postman_collection.json`, executando as requisições na ordem, logo após um `npm start` novo.
