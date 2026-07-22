import request from 'supertest';
import app from '../app.js'; // Separamos o app do listen para testar de forma limpa

describe('🧪 Testes da API de Máquinas (EcoFactory)', () => {

  it('GET /api/maquinas - Deve retornar status 200 e uma lista', async () => {
    const res = await request(app).get('/api/maquinas');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('POST /api/maquinas - Deve rejeitar cadastro sem o campo "nome"', async () => {
    const res = await request(app)
      .post('/api/maquinas')
      .send({ setor: 'Usinagem', temp: 50 });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('erro');
  });

});