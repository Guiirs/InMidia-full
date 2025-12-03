// src/components/PITable/PITable.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ToastNotification/ToastNotification';
import {
    queuePDFJob,
    // createContrato, // Removido, pois é tratado pela PIsPage
} from '../../services';
import Spinner from '../Spinner/Spinner';

// O export é 'function', então a importação com { PIsTable } está correta.
export function PIsTable({ 
    pis, 
    onEdit, 
    onDelete, 
    onGenerateContrato, 
    isGeneratingContrato, 
    processingPIId, 
    onStatusChange, 
    currentJobStatus, 
    isPolling, 
    onGeneratePDF,
    onDownloadPDF,
    onDownloadExcel,
    downloadingPIId
}) {
    
    const navigate = useNavigate();
    const showToast = useToast();
    const { user } = useAuth();
    
    const [generatingPDFId, setGeneratingPDFId] = React.useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        if (openDropdownId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdownId]);

    const toggleDropdown = (piId) => {
        setOpenDropdownId(openDropdownId === piId ? null : piId);
    };

    const handleDownloadOption = (piId, action) => {
        setOpenDropdownId(null);
        action(piId);
    };
    // O 'isGeneratingContrato' agora é uma prop vinda do 'PIsPage'

    const handleGeneratePDFClick = async (piId) => {
        setGeneratingPDFId(piId);
        try {
            if (onGeneratePDF) {
                await onGeneratePDF(piId);
            } else {
                // Fallback to direct queue call
                await queuePDFJob(piId, 'pi');
                showToast('PDF da PI está sendo gerado e será enviado via WhatsApp...', 'info');
            }
        } catch (error) {
            showToast(error.message || 'Erro ao iniciar geração do PDF.', 'error');
        } finally {
            setGeneratingPDFId(null);
        }
    };

    const handleCreateContratoClick = async (piId) => {
        // A lógica de confirmação e mutação agora está na PIsPage
        onGenerateContrato(piId);
    };
    
    if (!pis || pis.length === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" className="table-no-data">
                        Nenhuma proposta interna (PI) encontrada.
                    </td>
                </tr>
            </tbody>
        );
    }

    const formatShortDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yy', { locale: ptBR });
        } catch (e) {
            return 'Inválida';
        }
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ -';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <tbody>
            {pis.map((pi) => {
                const isVencida = pi.status === 'vencida';
                const isConcluida = pi.status === 'concluida';
                
                const isThisPIGeneratingPDF = generatingPDFId === pi._id;
                // Verifica se *esta* PI é a que está gerando um contrato
                const isThisPIProcessingContrato = processingPIId === pi._id;
                // Check if this PI is the current job
                const isCurrentJob = currentJobStatus && currentJobStatus.piId === pi._id;
                // Check if this PI is downloading
                const isThisPIDownloading = downloadingPIId === pi._id;
                // Desabilita botões se QUALQUER geração de PDF ou contrato estiver ativa
                const isDisabled = isThisPIGeneratingPDF || isGeneratingContrato || (isCurrentJob && isPolling) || isThisPIDownloading;
                const isDropdownOpen = openDropdownId === pi._id;

                return (
                    <tr key={pi._id} className={isVencida ? 'pi-vencida' : ''}>
                        <td>
                            <span 
                                className={`pi-status-badge pi-status--${pi.status}`}
                            >
                                {pi.status.replace('_', ' ')}
                            </span>
                        </td>
                        <td data-label="Descrição">{pi.descricao}</td>
                        <td data-label="Cliente">{pi.clienteId?.nome || 'Cliente não encontrado'}</td>
                        <td data-label="Período">
                            {formatShortDate(pi.dataInicio)} - {formatShortDate(pi.dataFim)}
                        </td>
                        <td data-label="Valor">{formatCurrency(pi.valorTotal)}</td>
                        <td data-label="Ações" className="table-actions">
                            
                            {/* --- CORREÇÃO DO TYPEERROR AQUI --- */}
                            <button 
                                className="table-action-button" 
                                title="Editar PI"
                                onClick={() => onEdit(pi)} // CORRIGIDO: de onEditClick para onEdit
                                disabled={isConcluida || isVencida || isDisabled}
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            {/* --- FIM DA CORREÇÃO --- */}
                            
                            {/* --- CORREÇÃO DO TYPEERROR AQUI --- */}
                            <button 
                                className="table-action-button action-delete" 
                                title="Apagar PI"
                                onClick={() => onDelete(pi)} // CORRIGIDO: de onDeleteClick para onDelete
                                disabled={isDisabled}
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                            {/* --- FIM DA CORREÇÃO --- */}
                            
                            {/* Dropdown para Downloads */}
                            <div 
                                className="action-dropdown" 
                                style={{ position: 'relative', display: 'inline-block' }}
                                ref={isDropdownOpen ? dropdownRef : null}
                            >
                                <button 
                                    className="table-action-button" 
                                    title="Download"
                                    onClick={() => toggleDropdown(pi._id)}
                                    disabled={isDisabled}
                                >
                                    {isThisPIDownloading ? (
                                        <Spinner mini />
                                    ) : (
                                        <>
                                            <i className="fas fa-download"></i>
                                            <i className="fas fa-caret-down" style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                                        </>
                                    )}
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="dropdown-menu" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: '0',
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                        minWidth: '200px',
                                        marginTop: '4px'
                                    }}>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => handleDownloadOption(pi._id, onDownloadExcel)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 15px',
                                                border: 'none',
                                                background: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                        >
                                            <i className="fas fa-file-excel" style={{ marginRight: '8px', color: '#27ae60' }}></i>
                                            Excel (.xlsx) ⭐
                                        </button>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => handleDownloadOption(pi._id, onDownloadPDF)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 15px',
                                                border: 'none',
                                                background: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                        >
                                            <i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#e74c3c' }}></i>
                                            PDF
                                        </button>
                                        <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }}></div>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => handleDownloadOption(pi._id, () => handleGeneratePDFClick(pi._id))}
                                            style={{
                                                width: '100%',
                                                padding: '10px 15px',
                                                border: 'none',
                                                background: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                        >
                                            <i className="fas fa-paper-plane" style={{ marginRight: '8px', color: '#3498db' }}></i>
                                            Enviar PDF via WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                className="table-action-button action-contrato" 
                                title="Gerar Contrato"
                                onClick={() => handleCreateContratoClick(pi._id)}
                                disabled={isDisabled} // Desabilita se qualquer ação estiver ocorrendo
                            >
                                {isThisPIProcessingContrato ? <Spinner mini /> : <i className="fas fa-file-signature"></i>}
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    );
}

PIsTable.propTypes = {
    pis: PropTypes.array.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onGenerateContrato: PropTypes.func.isRequired,
    isGeneratingContrato: PropTypes.bool,
    processingPIId: PropTypes.string, // ID da PI sendo processada
    onStatusChange: PropTypes.func,
    currentJobStatus: PropTypes.object,
    isPolling: PropTypes.bool,
    onGeneratePDF: PropTypes.func,
    onDownloadPDF: PropTypes.func,
    onDownloadExcel: PropTypes.func,
    downloadingPIId: PropTypes.string,
};
