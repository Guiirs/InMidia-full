// src/services/placaService.js
/**
 * Serviço de Placas
 * Responsável por: CRUD Placas, Locations, Disponibilidade
 */

import apiClient from './apiClient';

/**
 * Busca placas com filtros
 * @param {URLSearchParams} params - Parâmetros de busca
 * @returns {Promise<Object>} Lista de placas paginada
 */
export const fetchPlacas = async (params) => {
    const response = await apiClient.get(`/placas?${params.toString()}`);
    return response.data;
};

/**
 * Busca placa por ID
 * @param {string} id - ID da placa
 * @returns {Promise<Object>} Dados da placa
 */
export const fetchPlacaById = async (id) => {
    const response = await apiClient.get(`/placas/${id}`);
    return response.data;
};

/**
 * Cria nova placa
 * @param {FormData} formData - Dados da placa
 * @returns {Promise<Object>} Placa criada
 */
export const addPlaca = async (formData) => {
    const response = await apiClient.post('/placas', formData);
    return response.data;
};

/**
 * Atualiza placa existente
 * @param {string} id - ID da placa
 * @param {FormData} formData - Dados atualizados
 * @returns {Promise<Object>} Placa atualizada
 */
export const updatePlaca = async (id, formData) => {
    const response = await apiClient.put(`/placas/${id}`, formData);
    return response.data;
};

/**
 * Deleta placa
 * @param {string} id - ID da placa
 * @returns {Promise<void>}
 */
export const deletePlaca = async (id) => {
    await apiClient.delete(`/placas/${id}`);
};

/**
 * Toggle disponibilidade da placa
 * @param {string} id - ID da placa
 * @returns {Promise<Object>} Placa atualizada
 */
export const togglePlacaDisponibilidade = async (id) => {
    const response = await apiClient.patch(`/placas/${id}/disponibilidade`);
    return response.data;
};

/**
 * Busca localizações de todas as placas
 * @returns {Promise<Object>} Lista de localizações
 */
export const fetchPlacaLocations = async () => {
    const response = await apiClient.get('/placas/locations');
    return response.data;
};

/**
 * Busca placas disponíveis em um período
 * @param {URLSearchParams} params - Parâmetros (dataInicio, dataFim, piId, search, regiao)
 * @returns {Promise<Object>} Lista de placas disponíveis
 */
export const fetchPlacasDisponiveis = async (params) => {
    const response = await apiClient.get(`/placas/disponiveis?${params.toString()}`);
    return response.data;
};
