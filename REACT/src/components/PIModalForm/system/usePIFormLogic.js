// src/components/PIModalForm/system/usePIFormLogic.js
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDebounce } from '../../../hooks/useDebounce';
import { PERIOD_TYPES } from '../../../constants/periodos';

function formatDateForInput(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
}

// Helper para calcular dataFim baseado no tipoPeriodo e dataInicio
function calcularDataFimInicial(inicio, tipoPeriodo = PERIOD_TYPES.MENSAL) {
    if (!inicio) {
        // Se não houver dataInicio, calcula para 1 mês a partir de hoje
        const hoje = new Date();
        hoje.setMonth(hoje.getMonth() + 1);
        hoje.setDate(hoje.getDate() - 1);
        return hoje.toISOString().split('T')[0];
    }
    
    // Cria data com timezone explícito para evitar problemas
    const data = new Date(inicio + 'T12:00:00');
    
    switch (tipoPeriodo) {
        case PERIOD_TYPES.QUINZENAL:
            data.setDate(data.getDate() + 14);
            break;
        case PERIOD_TYPES.MENSAL:
            // Vai para o próximo mês, mesmo dia
            data.setMonth(data.getMonth() + 1);
            // Volta 1 dia (último dia do mês atual)
            data.setDate(data.getDate() - 1);
            break;
        case PERIOD_TYPES.BIMESTRAL:
            data.setMonth(data.getMonth() + 2);
            data.setDate(data.getDate() - 1);
            break;
        case PERIOD_TYPES.SEMESTRAL:
            data.setMonth(data.getMonth() + 6);
            data.setDate(data.getDate() - 1);
            break;
        case PERIOD_TYPES.ANUAL:
            data.setFullYear(data.getFullYear() + 1);
            data.setDate(data.getDate() - 1);
            break;
        default:
            data.setMonth(data.getMonth() + 1);
            data.setDate(data.getDate() - 1);
            break;
    }
    
    // Garante formato YYYY-MM-DD
    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, '0');
    const day = String(data.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const usePIFormLogic = (onSubmit, initialData = {}, isSubmitting = false) => {
    const [currentStep, setCurrentStep] = useState(1);

    // Filtros para placas (mantidos aqui para persistência entre renders)
    const [selectedRegiao, setSelectedRegiao] = useState('');
    const [placaSearch, setPlacaSearch] = useState('');
    const debouncedPlacaSearch = useDebounce(placaSearch, 300);

    // React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        trigger,
        formState: { errors: modalErrors },
        setError
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            clienteId: initialData.clienteIdId?._id || initialData.clienteIdId || '',
            // [PERÍODO UNIFICADO] Campo novo - Prioriza novo formato
            period: initialData.periodType ? {
                periodType: initialData.periodType,
                startDate: initialData.startDate ? formatDateForInput(initialData.startDate) : '',
                endDate: initialData.endDate ? formatDateForInput(initialData.endDate) : '',
                biWeekIds: initialData.biWeekIds || [],
                biWeeks: []
            } : (initialData.dataInicio ? {
                // Converte formato legado para novo
                periodType: (initialData.bi_week_ids && initialData.bi_week_ids.length > 0) ? 'bi-week' : 'custom',
                startDate: formatDateForInput(initialData.dataInicio),
                endDate: formatDateForInput(initialData.dataFim),
                biWeekIds: initialData.bi_week_ids || [],
                biWeeks: []
            } : {
                // Padrão: custom com data de hoje
                periodType: 'custom',
                startDate: new Date().toISOString().split('T')[0],
                endDate: calcularDataFimInicial(new Date().toISOString().split('T')[0], 'mensal'),
                biWeekIds: [],
                biWeeks: []
            }),
            // [LEGADO] Mantidos para compatibilidade
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
            dataFim: initialData.dataFim 
                ? formatDateForInput(initialData.dataFim) 
                : calcularDataFimInicial(
                    initialData.dataInicio ? formatDateForInput(initialData.dataInicio) : new Date().toISOString().split('T')[0],
                    initialData.tipoPeriodo || 'mensal'
                ),
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: initialData.clienteIdId?.responsavel || '',
            segmento: initialData.clienteIdId?.segmento || '',
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || [],
            // Novos campos para PDF compatível com XLSX
            produto: initialData.produto || 'OUTDOOR',
            descricaoPeriodo: initialData.descricaoPeriodo || '',
            valorProducao: initialData.valorProducao || 0
        }
    });

    const dataInicio = watch('dataInicio');
    const dataFim = watch('dataFim');
    const watchedClienteId = watch('clienteId');

    useEffect(() => {
        // Sempre que o initialData mudar, reseta o formulário e filtros
        const clienteId = initialData.clienteIdId || {};
        
        // [PERÍODO UNIFICADO] Prepara dados de período
        const periodData = initialData.periodType ? {
            periodType: initialData.periodType,
            startDate: formatDateForInput(initialData.startDate),
            endDate: formatDateForInput(initialData.endDate),
            biWeekIds: initialData.biWeekIds || [],
            biWeeks: []
        } : (initialData.dataInicio ? {
            periodType: (initialData.bi_week_ids && initialData.bi_week_ids.length > 0) ? 'bi-week' : 'custom',
            startDate: formatDateForInput(initialData.dataInicio),
            endDate: formatDateForInput(initialData.dataFim),
            biWeekIds: initialData.bi_week_ids || [],
            biWeeks: []
        } : {
            periodType: 'custom',
            startDate: new Date().toISOString().split('T')[0],
            endDate: calcularDataFimInicial(new Date().toISOString().split('T')[0], 'mensal'),
            biWeekIds: [],
            biWeeks: []
        });
        
        reset({
            clienteId: cliente._id || initialData.clienteIdId || '',
            period: periodData,
            tipoPeriodo: initialData.tipoPeriodo || 'mensal',
            dataInicio: periodData.startDate,
            dataFim: periodData.endDate,
            valorTotal: initialData.valorTotal || 0,
            descricao: initialData.descricao || '',
            responsavel: cliente.responsavel || '',
            segmento: cliente.segmento || '',
            formaPagamento: initialData.formaPagamento || '',
            placas: initialData.placas?.map(p => p._id || p) || [],
            // Novos campos para PDF compatível com XLSX
            produto: initialData.produto || 'OUTDOOR',
            descricaoPeriodo: initialData.descricaoPeriodo || '',
            valorProducao: initialData.valorProducao || 0
        });

        setCurrentStep(1);
        setSelectedRegiao('');
        setPlacaSearch('');
    }, [initialData, reset]);

    const handleFormSubmit = (data) => {
        const { responsavel, segmento, ...piData } = data;
        onSubmit(piData, setError);
    };

    const nextStep = async () => {
        let fieldsToValidate = null;
        
        // Validação por etapa
        if (currentStep === 1) {
            // Etapa 1: Cliente e Descrição
            fieldsToValidate = ['clienteId', 'descricao'];
        }
        if (currentStep === 2) {
            // Etapa 2: Período (Datas/Bi-semanas)
            fieldsToValidate = ['period'];
        }
        if (currentStep === 3) {
            // Etapa 3: Placas
            fieldsToValidate = ['placas'];
        }

        if (fieldsToValidate) {
            const ok = await trigger(fieldsToValidate);
            if (!ok) {
                if (import.meta.env.DEV) {
                    console.log('[usePIFormLogic] Validation failed for step', currentStep, fieldsToValidate);
                }
                return;
            }
        }

        if (import.meta.env.DEV) {
            console.log('[usePIFormLogic] Moving to next step from', currentStep, 'to', currentStep + 1);
        }

        setCurrentStep(s => Math.min(4, s + 1));
    };

    const prevStep = () => setCurrentStep(s => Math.max(1, s - 1));

    return {
        currentStep,
        formControls: {
            register,
            handleSubmit,
            reset,
            watch,
            setValue,
            control,
            trigger,
            errors: modalErrors,
        },
        watchedValues: { dataInicio, dataFim, watchedClienteId },
        placaFilters: { selectedRegiao, setSelectedRegiao, placaSearch, setPlacaSearch, debouncedPlacaSearch },
        navigation: { nextStep, prevStep, handleFormSubmit }
    };
};
