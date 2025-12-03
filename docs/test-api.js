const axios = require('axios');

async function testAPI() {
  try {
    const baseURL = 'http://localhost:4000';
    // Você precisa de um token válido - ajuste conforme necessário
    const token = '3300020004505005660';

    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const dataInicio = hoje.toISOString().split('T')[0];
    const dataFim = amanha.toISOString().split('T')[0];

    console.log('Testando API /placas/disponiveis');
    console.log('Período:', dataInicio, 'a', dataFim);

    const response = await axios.get(`${baseURL}/api/v1/placas/disponiveis?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', response.status);
    console.log('Placas retornadas:', response.data.data?.length || 0);

    if (response.data.data?.length > 0) {
      console.log('Primeiras placas:', response.data.data.slice(0, 3).map(p => p.numero_placa));
    }

  } catch (error) {
    console.error('Erro na API:', error.response?.status, error.response?.data || error.message);
  }
}

testAPI();