// src/services/authService.js
/**
 * Serviço de Autenticação
 * Responsável por: Login, Register, Password Reset
 */

import apiClient from './apiClient';

/**
 * Registra uma nova empresa
 * @param {Object} empresaData - Dados da empresa
 * @returns {Promise<Object>} Dados da empresa criada
 */
export const registerEmpresa = async (empresaData) => {
    const response = await apiClient.post('/empresas/register', empresaData, { isPublic: true });
    return response.data;
};

/**
 * Faz login do usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<Object>} Token e dados do usuário
 */
export const loginUser = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password }, { isPublic: true });
    return response.data;
};

/**
 * Solicita reset de senha
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Mensagem de confirmação
 */
export const requestPasswordReset = async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email }, { isPublic: true });
    return response.data;
};

/**
 * Reseta a senha com token
 * @param {string} token - Token de reset
 * @param {string} newPassword - Nova senha
 * @returns {Promise<Object>} Mensagem de confirmação
 */
export const resetPassword = async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword }, { isPublic: true });
    return response.data;
};
