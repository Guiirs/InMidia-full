// src/services/relatorioService.js
/**
 * Serviço de Relatórios
 * Responsável por: Geração de relatórios, Downloads
 */

import apiClient from './apiClient';
import { handleBlobDownload } from '../utils/downloadHelper';

/**
 * Busca relatório de placas por região
 * @returns {Promise<Object>} Dados do relatório
 */
export const fetchPlacasPorRegiaoReport = async () => {
    const response = await apiClient.get('/relatorios/placas-por-regiao');
    return response.data;
};

/**
 * Busca resumo do dashboard
 * @returns {Promise<Object>} Dados do dashboard
 */
export const fetchDashboardSummary = async () => {
    const response = await apiClient.get('/relatorios/dashboard-summary');
    return response.data;
};

/**
 * Busca relatório de ocupação por período
 * @param {string} data_inicio - Data inicial (YYYY-MM-DD)
 * @param {string} data_fim - Data final (YYYY-MM-DD)
 * @returns {Promise<Object>} Dados do relatório
 */
export const fetchRelatorioOcupacao = async (data_inicio, data_fim) => {
    const params = new URLSearchParams({ data_inicio, data_fim });
    const response = await apiClient.get(`/relatorios/ocupacao-por-periodo?${params.toString()}`);
    return response.data;
};

/**
 * Download PDF do relatório de ocupação
 * @param {string} data_inicio - Data inicial (YYYY-MM-DD)
 * @param {string} data_fim - Data final (YYYY-MM-DD)
 * @returns {Promise<Object>} { blob, filename }
 */
export const downloadRelatorioOcupacaoPDF = async (data_inicio, data_fim) => {
    const params = new URLSearchParams({ data_inicio, data_fim });
    const response = await apiClient.get(
        `/relatorios/export/ocupacao-por-periodo?${params.toString()}`,
        { responseType: 'blob' }
    );
    return handleBlobDownload(response);
};
