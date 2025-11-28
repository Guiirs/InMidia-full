// src/services/apiClient.js
/**
 * Configuração centralizada do Axios
 * Contém apenas a instância do apiClient e interceptors
 */

import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import { showToastGlobal } from '../components/ToastNotification/ToastNotification';

// -----------------------------------------------------------------------------
// Configuração do Cliente Axios
// -----------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------------------------------------------------------
// Interceptors Axios (para gestão de tokens e erros)
// -----------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token && !config.headers.Authorization && !config.isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove a flag isPublic antes de enviar
    delete config.isPublic;

    // Remove Content-Type para FormData (deixa o browser definir)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Sucesso, apenas retorna a resposta
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Lógica 401 - Sessão expirada
      if (status === 401) {
        // Mostra aviso de sessão expirada
        showToastGlobal('Sua sessão expirou. Faça login novamente.', 'error');
        
        // Pequeno delay para o usuário ver o toast antes de redirecionar
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 2000); // 2 segundos
        
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
      }
      
      let errorMessage = 'Ocorreu um erro desconhecido.';
      let errorData = data;

      // Tratamento especial para Blobs (PDFs/Excel com erro)
      if (data instanceof Blob && data.type === "application/json") {
        try {
          const errorText = await data.text();
          errorData = JSON.parse(errorText);
          errorMessage = errorData?.message || 'Erro ao processar o arquivo.';
        } catch (e) {
          errorMessage = 'Erro ao ler a resposta de erro (Blob).';
        }
      } else if (data) {
        errorMessage = data?.message || error.message || `Erro ${status}`;
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.response.data = errorData;
      
      return Promise.reject(enhancedError);

    } else if (error.request) {
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique a sua conexão.'));
    } else {
      return Promise.reject(new Error('Erro ao preparar a requisição: ' + error.message));
    }
  }
);

export default apiClient;
