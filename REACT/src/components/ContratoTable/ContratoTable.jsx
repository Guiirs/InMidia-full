// src/components/ContratoTable/ContratoTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/helpers';

function ContratoTable({
    contratos,
    onEditStatusClick,
    onDeleteClick,
    onGeneratePDF,
    isDeleting,
    isGeneratingPDF,
    currentJobStatus,
    isPolling
}) {

    const getStatusClass = (status) => {
        switch (status) {
            case 'ativo': return 'status-badge--ativo'; // Crie esta classe CSS
            case 'concluido': return 'status-badge--concluida';
            case 'cancelado': return 'status-badge--vencida'; // Reutiliza o estilo de 'vencida'
            case 'rascunho':
            default:
                return 'status-badge--em-andamento'; // Reutiliza o estilo de 'em-andamento'
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ativo': return 'Ativo';
            case 'concluido': return 'Concluído';
            case 'cancelado': return 'Cancelado';
            case 'rascunho':
            default:
                return 'Rascunho';
        }
    };

    return contratos.map(contrato => {
        const isThisOneDeleting = isDeleting && isDeleting.contratoId === contrato._id;
        const isThisOneGeneratingPDF = isGeneratingPDF && isGeneratingPDF.contratoId === contrato._id;
        const disableActions = isThisOneDeleting || isThisOneGeneratingPDF;
        
        // Check if this contrato is the one being processed
        const isCurrentJob = currentJobStatus && currentJobStatus.contratoId === contrato._id;
        
        // Os campos 'clienteId' e 'pi' são populados seletivamente pelo backend
        const clienteNome = contrato.clienteId?.nome || 'Cliente Apagado';
        const piValor = contrato.pi?.valorTotal || 0;
        const piDataInicio = contrato.pi?.dataInicio ? formatDate(contrato.pi.dataInicio) : '-';
        const piDataFim = contrato.pi?.dataFim ? formatDate(contrato.pi.dataFim) : '-';

        return (
            <tr key={contrato._id}>
                <td>{clienteNome}</td>
                <td>R$ {piValor.toFixed(2)}</td>
                <td>{piDataInicio}</td>
                <td>{piDataFim}</td>
                <td>
                    <span className={`status-badge ${getStatusClass(contrato.status)}`}>
                        {getStatusText(contrato.status)}
                    </span>
                </td>
                        <td>{formatDate(contrato.createdAt)}</td>
                        <td className="pis-page__actions">
                            {/* Generate PDF do Contrato (Queue-based) */}
                            <button
                                className="pis-page__action-button pis-page__action-button--download"
                                title={isCurrentJob && isPolling ? `Gerando PDF: ${currentJobStatus.status}` : "Gerar PDF do Contrato"}
                                onClick={() => onGeneratePDF(contrato)}
                                disabled={disableActions || (isCurrentJob && isPolling)}
                            >
                                {isThisOneGeneratingPDF || (isCurrentJob && isPolling) ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                    <i className="fas fa-file-pdf"></i>
                                )}
                            </button>
                            {/* Editar Status */}
                            <button
                                className="pis-page__action-button pis-page__action-button--edit"
                                title="Alterar Status"
                                onClick={() => onEditStatusClick(contrato)}
                                disabled={disableActions}
                            >
                                <i className="fas fa-pencil-alt"></i>
                            </button>
                            {/* Apagar Contrato (se for rascunho) */}
                            {contrato.status === 'rascunho' && (
                                <button
                                    className="pis-page__action-button pis-page__action-button--delete"
                                    title="Apagar Rascunho"
                                    onClick={() => onDeleteClick(contrato)}
                                    disabled={disableActions}
                                >
                                    {isThisOneDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                                </button>
                            )}
                        </td>
                    </tr>
                );
            });
}

ContratoTable.propTypes = {
    contratos: PropTypes.array.isRequired,
    onEditStatusClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    onGeneratePDF: PropTypes.func.isRequired,
    isDeleting: PropTypes.object,
    isGeneratingPDF: PropTypes.object,
    currentJobStatus: PropTypes.object,
    isPolling: PropTypes.bool,
};

export default ContratoTable;
