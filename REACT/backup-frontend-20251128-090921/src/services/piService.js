// src/services/piService.js
/**
 * Serviço de Propostas Internas (PI)
 * Responsável por: CRUD PIs, Geração de PDFs
 */

import apiClient from './apiClient';
import { handleBlobDownload } from '../utils/downloadHelper';

/**
 * Busca PIs com filtros
 * @param {URLSearchParams} params - Parâmetros de busca
 * @returns {Promise<Object>} Lista de PIs paginada
 */
export const fetchPIs = async (params) => {
    const response = await apiClient.get(`/pis?${params.toString()}`);
    return response.data;
};

/**
 * Cria nova PI
 * @param {Object} piData - Dados da PI
 * @returns {Promise<Object>} PI criada
 */
export const createPI = async (piData) => {
    const response = await apiClient.post('/pis', piData);
    return response.data;
};

/**
 * Atualiza PI existente
 * @param {string} id - ID da PI
 * @param {Object} piData - Dados atualizados
 * @returns {Promise<Object>} PI atualizada
 */
export const updatePI = async (id, piData) => {
    const response = await apiClient.put(`/pis/${id}`, piData);
    return response.data;
};

/**
 * Deleta PI
 * @param {string} id - ID da PI
 * @returns {Promise<void>}
 */
export const deletePI = async (id) => {
    await apiClient.delete(`/pis/${id}`);
};

/**
 * Download PDF da PI
 * @param {string} id - ID da PI
 * @returns {Promise<Object>} { blob, filename }
 */
export const downloadPI_PDF = async (id) => {
    const response = await apiClient.get(`/pis/${id}/download`, {
        responseType: 'blob'
    });
    return handleBlobDownload(response);
};

/**
 * Download Excel da PI
 * @param {string} id - ID da PI
 * @returns {Promise<Object>} { blob, filename }
 */
export const downloadPI_Excel = async (id) => {
    const response = await apiClient.get(`/pis/${id}/download-excel`, {
        responseType: 'blob'
    });
    return handleBlobDownload(response);
};
