// src/components/PIModalForm/Pages/Page3Valores.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCurrencyInput } from '../../../hooks/useCurrencyInput';

// --- Helpers (Específicos deste componente) ---

// Helper para calcular a data final baseado no tipo de período
function calcularDataFim(inicio, tipoPeriodo) {
    if (!inicio || !tipoPeriodo) return '';
    
    // Trata a data como local (fuso -03:00) para evitar bugs de um dia a menos
    const data = new Date(inicio + 'T00:00:00-03:00'); 
    
    switch (tipoPeriodo) {
        case 'quinzenal':
            data.setDate(data.getDate() + 14); // 15 dias (14 noites)
            break;
        case 'mensal':
            data.setMonth(data.getMonth() + 1);
            data.setDate(data.getDate() - 1); // Ajusta para o dia anterior
            break;
        case 'bimestral':
            data.setMonth(data.getMonth() + 2);
            data.setDate(data.getDate() - 1);
            break;
        case 'semestral':
            data.setMonth(data.getMonth() + 6);
            data.setDate(data.getDate() - 1);
            break;
        case 'anual':
            data.setFullYear(data.getFullYear() + 1);
            data.setDate(data.getDate() - 1);
            break;
        default:
            return ''; // Retorna vazio se o tipo for 'outro' ou inválido
    }
    
    return data.toISOString().split('T')[0];
}
// --- Fim Helpers ---


export default function Page3Valores({ 
    register, 
    errors, 
    isSubmitting, 
    dataInicio, 
    setValue, 
    watch 
}) {
    
    const tipoPeriodo = watch('tipoPeriodo');

    // Hooks para inputs monetários
    const valorTotal = useCurrencyInput(
        watch('valorTotal') || 0,
        (value) => setValue('valorTotal', value, { shouldValidate: true })
    );
    
    const valorProducao = useCurrencyInput(
        watch('valorProducao') || 0,
        (value) => setValue('valorProducao', value, { shouldValidate: true })
    );

    // Efeito para calcular e definir a data final automaticamente
    useEffect(() => {
        if (tipoPeriodo !== 'outro') {
            const dataFimCalculada = calcularDataFim(dataInicio, tipoPeriodo);
            setValue('dataFim', dataFimCalculada, { shouldValidate: true });
        } else {
             setValue('dataFim', '', { shouldValidate: true }); // Limpa se for 'outro'
        }
    }, [dataInicio, tipoPeriodo, setValue]);

    return (
        <>
            {/* Tipo de Período */}
            <div className="modal-form__input-group">
                <label htmlFor="tipoPeriodo">Tipo de Período</label>
                <select
                    id="tipoPeriodo"
                    className={`modal-form__input ${errors.tipoPeriodo ? 'modal-form__input--error' : ''}`}
                    {...register('tipoPeriodo', { required: 'Selecione o período.' })}
                    disabled={isSubmitting}
                >
                    <option value="mensal">Mensal (30 dias)</option>
                    <option value="quinzenal">Quinzenal (15 dias)</option>
                    <option value="bimestral">Bimestral (60 dias)</option>
                    <option value="semestral">Semestral (6 meses)</option>
                    <option value="anual">Anual (12 meses)</option>
                    <option value="outro">Outro (Manual)</option>
                </select>
                {errors.tipoPeriodo && <div className="modal-form__error-message">{errors.tipoPeriodo.message}</div>}
            </div>

            {/* Data Início */}
            <div className="modal-form__input-group">
                <label htmlFor="dataInicio">Data Início</label>
                <input
                    type="date"
                    id="dataInicio"
                    className={`modal-form__input ${errors.dataInicio ? 'modal-form__input--error' : ''}`}
                    {...register('dataInicio', { required: 'A data de início é obrigatória.' })}
                    disabled={isSubmitting}
                />
                {errors.dataInicio && <div className="modal-form__error-message">{errors.dataInicio.message}</div>}
            </div>

            {/* Data Fim */}
            <div className="modal-form__input-group">
                <label htmlFor="dataFim">Data Fim</label>
                <input
                    type="date"
                    id="dataFim"
                    className={`modal-form__input ${errors.dataFim ? 'modal-form__input--error' : ''}`}
                    {...register('dataFim', { required: 'A data de fim é obrigatória.' })}
                    disabled={isSubmitting || tipoPeriodo !== 'outro'} // Desabilita se não for 'outro'
                    readOnly={tipoPeriodo !== 'outro'}
                />
                {errors.dataFim && <div className="modal-form__error-message">{errors.dataFim.message}</div>}
            </div>

            {/* Valor Total */}
            <div className="modal-form__input-group">
                <label htmlFor="valorTotal">Valor Total (R$)</label>
                <input
                    type="text"
                    id="valorTotal"
                    className={`modal-form__input ${errors.valorTotal ? 'modal-form__input--error' : ''}`}
                    placeholder="R$ 0,00"
                    value={valorTotal.displayValue}
                    onChange={valorTotal.handleChange}
                    disabled={isSubmitting}
                />
                <input
                    type="hidden"
                    {...register('valorTotal', { 
                        valueAsNumber: true,
                        validate: value => (value > 0) || 'O valor deve ser maior que zero.' 
                    })}
                />
                {errors.valorTotal && <div className="modal-form__error-message">{errors.valorTotal.message}</div>}
            </div>

            {/* Forma de Pagamento */}
            <div className="modal-form__input-group modal-form__input-group--full">
                <label htmlFor="formaPagamento">Forma de Pagamento</label>
                <input
                    type="text"
                    id="formaPagamento"
                    placeholder="Ex: Boleto bancário, PIX, etc."
                    className={`modal-form__input ${errors.formaPagamento ? 'modal-form__input--error' : ''}`}
                    {...register('formaPagamento', { required: 'A forma de pagamento é obrigatória.' })}
                    disabled={isSubmitting}
                />
                {errors.formaPagamento && <div className="modal-form__error-message">{errors.formaPagamento.message}</div>}
            </div>

            {/* === NOVOS CAMPOS PARA PDF === */}
            
            {/* Produto */}
            <div className="modal-form__input-group">
                <label htmlFor="produto">Produto/Tipo</label>
                <input
                    type="text"
                    id="produto"
                    placeholder="Ex: OUTDOOR, PAINEL, etc."
                    className={`modal-form__input ${errors.produto ? 'modal-form__input--error' : ''}`}
                    {...register('produto')}
                    disabled={isSubmitting}
                />
                {errors.produto && <div className="modal-form__error-message">{errors.produto.message}</div>}
                <small style={{ color: '#666', fontSize: '0.85rem' }}>Padrão: OUTDOOR</small>
            </div>

            {/* Descrição do Período */}
            <div className="modal-form__input-group">
                <label htmlFor="descricaoPeriodo">Descrição do Período</label>
                <input
                    type="text"
                    id="descricaoPeriodo"
                    placeholder="Ex: BISEMANA 26, MENSAL - MARÇO/2025"
                    className={`modal-form__input ${errors.descricaoPeriodo ? 'modal-form__input--error' : ''}`}
                    {...register('descricaoPeriodo')}
                    disabled={isSubmitting}
                />
                {errors.descricaoPeriodo && <div className="modal-form__error-message">{errors.descricaoPeriodo.message}</div>}
                <small style={{ color: '#666', fontSize: '0.85rem' }}>Opcional - Aparecerá no PDF</small>
            </div>

            {/* Valor Produção */}
            <div className="modal-form__input-group">
                <label htmlFor="valorProducao">Valor Produção (R$)</label>
                <input
                    type="text"
                    id="valorProducao"
                    className={`modal-form__input ${errors.valorProducao ? 'modal-form__input--error' : ''}`}
                    placeholder="R$ 0,00"
                    value={valorProducao.displayValue}
                    onChange={valorProducao.handleChange}
                    disabled={isSubmitting}
                />
                <input
                    type="hidden"
                    {...register('valorProducao', { 
                        valueAsNumber: true,
                        validate: value => (value >= 0) || 'O valor não pode ser negativo.' 
                    })}
                />
                {errors.valorProducao && <div className="modal-form__error-message">{errors.valorProducao.message}</div>}
                <small style={{ color: '#666', fontSize: '0.85rem' }}>Separado do valor de veiculação</small>
            </div>
        </>
    );
}

Page3Valores.propTypes = {
    register: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    setValue: PropTypes.func.isRequired,
    watch: PropTypes.func.isRequired,
};