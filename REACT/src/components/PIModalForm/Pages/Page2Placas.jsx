// src/components/PIModalForm/pages/Page2Placas.jsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { fetchRegioes, fetchPlacas, fetchPlacasDisponiveis } from '../../../services';
import Spinner from '../../Spinner/Spinner';
import '../css/PlacaSelector.css';
import PlacaSelectItem from './components/PlacaSelectItem';

const REGIOES_KEY = ['regioes'];
const ALL_PLACAS_KEY = ['placas', 'all'];

/**
 * Page2Placas — seleção de placas para a PI
 * Reescrita com uma visão mais simples e robusta:
 * - Usa cache local por conjunto de filtros para evitar "zerar" a lista quando a API
 *   responde vazia durante refetchs transitórios.
 * - Usa `allPlacas` como fonte de verdade para detalhes das placas selecionadas.
 * - Mantém filtros ativos (desabilita apenas em submit).
 */
export function Page2Placas({ name, control, isSubmitting, dataInicio, dataFim, placaFilters, piId }) {
    const { selectedRegiao, setSelectedRegiao, placaSearch, setPlacaSearch, debouncedPlacaSearch } = placaFilters;

    // Debug togglable via localStorage.PI_DEBUG (set to any value in browser console)
    const isDebug = typeof window !== 'undefined' && !!localStorage.getItem('PI_DEBUG');
    const dbg = (...args) => { if (isDebug && import.meta.env.DEV) console.debug('[Page2Placas]', ...args); };

    // RHF controller para o campo 'placas'
    const { field, fieldState: { error } } = useController({
        name,
        control,
        rules: { validate: value => (value && value.length > 0) || 'Selecione pelo menos uma placa.' }
    });

    // Queries básicas
    const { data: regioes = [], isLoading: isLoadingRegioes } = useQuery({
        queryKey: REGIOES_KEY,
        queryFn: fetchRegioes,
        staleTime: 1000 * 60 * 60,
    });

    const { data: allPlacasData = [], isLoading: isLoadingAllPlacas } = useQuery({
        queryKey: ['placas', selectedRegiao, debouncedPlacaSearch],
        queryFn: () => {
            const params = new URLSearchParams();
            if (selectedRegiao) params.append('regiao', selectedRegiao);
            if (debouncedPlacaSearch) params.append('search', debouncedPlacaSearch);
            return fetchPlacas(params);
        },
        staleTime: 1000 * 60 * 10,
        select: data => data.data ?? []
    });

    const { data: placasDisponiveis = [], isLoading: isLoadingDisponiveis, isFetching: isFetchingDisponiveis } = useQuery({
        queryKey: ['placasDisponiveis', dataInicio, dataFim, selectedRegiao, debouncedPlacaSearch, piId],
        queryFn: async () => {
            if (!dataInicio || !dataFim) {
                dbg('⚠️ Sem datas, não busca placas disponíveis');
                return Promise.resolve({ data: [] });
            }
            const params = new URLSearchParams({ dataInicio, dataFim });
            if (selectedRegiao) params.append('regiao', selectedRegiao);
            if (debouncedPlacaSearch) params.append('search', debouncedPlacaSearch);
            if (piId) params.append('excludePiId', piId); // Exclui a PI atual quando editando
            
            dbg('Fetching placas disponíveis com params:', { dataInicio, dataFim, selectedRegiao, debouncedPlacaSearch, piId });
            
            const response = await fetchPlacasDisponiveis(params);
            dbg('API Response:', response);
            return response;
        },
        enabled: !!dataInicio && !!dataFim,
        staleTime: 1000 * 30,
        select: data => {
            const result = data.data ?? [];
            dbg('Placas disponíveis selecionadas:', result.length);
            return result;
        }
    });

    const isLoading = isLoadingRegioes || isLoadingAllPlacas;

    // Map ID -> Placa para lookup rápido
    const allPlacasMap = useMemo(() => {
        return (allPlacasData || []).reduce((m, p) => {
            const id = p._id || p.id || p.numero_placa;
            m.set(id, p);
            return m;
        }, new Map());
    }, [allPlacasData]);

    // Cache local por filterKey: preserva a última lista útil para os filtros atuais
    const cacheRef = useRef(new Map());
    const filterKey = `${dataInicio || ''}|${dataFim || ''}|${selectedRegiao || ''}|${debouncedPlacaSearch || ''}|${piId || ''}`;

    useEffect(() => {
        if (Array.isArray(placasDisponiveis) && placasDisponiveis.length > 0) {
            cacheRef.current.set(filterKey, placasDisponiveis);
            dbg('cache set', { filterKey, count: placasDisponiveis.length });
        }
    }, [placasDisponiveis, filterKey]);

    const placasDisponiveisSource = (Array.isArray(placasDisponiveis) && placasDisponiveis.length > 0)
        ? placasDisponiveis
        : (cacheRef.current.get(filterKey) || placasDisponiveis || []);
    dbg('placasDisponiveisSource', { filterKey, sourceCount: placasDisponiveisSource.length, apiCount: placasDisponiveis.length });

    const selectedIds = field.value || [];

    // Available = source - selected
    const placasDisponiveisFiltradas = useMemo(() => {
        const s = new Set(selectedIds);
        return placasDisponiveisSource.filter(p => {
            const id = p._id || p.id || p.numero_placa;
            return !s.has(id);
        });
    }, [placasDisponiveisSource, selectedIds]);

    // Aria-live message para leitores de tela (mais descritivo)
    const [ariaMessage, setAriaMessage] = useState('');

    // Helper: verifica se uma placa bate nos filtros atuais (regiao + busca)
    const matchesFilter = (p) => {
        if (!p) return false;
        if (selectedRegiao) {
            const rid = p.regiao?._id || p.regiao?.id;
            if (rid !== selectedRegiao) return false;
        }
        if (debouncedPlacaSearch) {
            const q = debouncedPlacaSearch.toLowerCase();
            const num = (p.numero_placa || '').toLowerCase();
            const rua = (p.nomeDaRua || '').toLowerCase();
            if (!num.includes(q) && !rua.includes(q)) return false;
        }
        return true;
    };

    // Placas indisponíveis (estão no cadastro geral, mas não na lista de disponíveis)
    const placasDisponiveisIds = useMemo(() => {
        const ids = new Set((placasDisponiveisSource || []).map(p => p._id || p.id || p.numero_placa));
        dbg('placasDisponiveisIds:', ids.size);
        return ids;
    }, [placasDisponiveisSource]);

    const placasIndisponiveis = useMemo(() => {
        // Pegamos do allPlacasData apenas as que batem nos filtros e não estão na lista de disponíveis
        const result = (allPlacasData || []).filter(p => {
            const id = p._id || p.id || p.numero_placa;
            if (!matchesFilter(p)) return false;
            if (selectedIds.includes(id)) return false; // já selecionada pelo formulário
            if (placasDisponiveisIds.has(id)) return false; // já disponível
            return true;
        });

        dbg('placasIndisponiveis:', result.length);
        return result;
    }, [allPlacasData, matchesFilter, selectedIds, placasDisponiveisIds]);

    // Selected details (fallback placeholder)
    const placasSelecionadas = useMemo(() => selectedIds.map(id => {
        const placa = allPlacasMap.get(id);
        return placa || { _id: id, numero_placa: id, nomeDaRua: '—', regiao: { nome: '—' } };
    }), [selectedIds, allPlacasMap]);

    const handleSelectPlaca = (placaId) => {
        if (!placaId) return;
        const id = placaId._id || placaId.id || placaId.numero_placa || placaId;
        dbg('select', { id, before: field.value });
        const next = Array.from(new Set([...(field.value || []), id]));
        field.onChange(next);
        try {
            const placaLabel = placaId.numero_placa || id;
            setAriaMessage(`${next.length} placa${next.length !== 1 ? 's' : ''} selecionada${next.length !== 1 ? 's' : ''} — ${placaLabel} adicionada`);
            // limpa após 3s
            setTimeout(() => setAriaMessage(''), 3000);
        } catch (e) { dbg('aria set error', e); }
    };

    const handleDeselectPlaca = (placaId) => {
        const id = placaId._id || placaId.id || placaId.numero_placa || placaId;
        dbg('deselect', { id, before: field.value });
        const next = (field.value || []).filter(i => i !== id);
        field.onChange(next);
        try {
            const placaLabel = placaId.numero_placa || id;
            setAriaMessage(`${next.length} placa${next.length !== 1 ? 's' : ''} selecionada${next.length !== 1 ? 's' : ''} — ${placaLabel} removida`);
            setTimeout(() => setAriaMessage(''), 3000);
        } catch (e) { dbg('aria set error', e); }
    };

    const findRegiaoNome = (placa) => placa?.regiao?.nome || allPlacasMap.get(placa?._id)?.regiao?.nome || 'N/A';

    return (
        <div className="modal-form__input-group modal-form__input-group--full">
            <div className="pi-selector__filters">
                <div className="pi-selector__search">
                    <input
                        type="text"
                        placeholder="Buscar por Nº ou Rua..."
                        className="pi-selector__input"
                        value={placaSearch}
                        onChange={(e) => setPlacaSearch(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="pi-selector__region-filter">
                    <select
                        className="pi-selector__select"
                        value={selectedRegiao}
                        onChange={(e) => setSelectedRegiao(e.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="">Todas as Regiões</option>
                        {regioes.map(r => (
                            <option key={r._id} value={r._id}>{r.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="pi-selector__list-container" style={{ position: 'relative' }}>
                {(isLoading || isFetchingDisponiveis) && (
                    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, pointerEvents: 'none' }}>
                        <Spinner message="A filtrar placas..." />
                    </div>
                )}

                <div className="pi-selector__list">
                    <h4 id="placas-disponiveis-heading">Placas Disponíveis ({placasDisponiveisFiltradas.length})</h4>
                    {placasDisponiveisFiltradas.length > 0 ? (
                        <ul>
                            {placasDisponiveisFiltradas.map(placa => {
                                const id = placa._id || placa.id || placa.numero_placa;
                                return (
                                <li key={id}>
                                    <PlacaSelectItem
                                        placa={placa}
                                        regiaoNome={findRegiaoNome(placa)}
                                        onSelect={() => handleSelectPlaca(placa)}
                                        type="add"
                                        disabled={isSubmitting}
                                    />
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <p className="pi-selector__empty-list">Nenhuma placa disponível (verifique datas ou filtros).</p>
                    )}

                    {placasIndisponiveis.length > 0 && (
                        <>
                            <h4 id="placas-indisponiveis-heading" style={{marginTop: '1rem'}}>Placas Indisponíveis ({placasIndisponiveis.length})</h4>
                            <ul aria-labelledby="placas-indisponiveis-heading">
                                {placasIndisponiveis.map(p => {
                                    const id = p._id || p.id || p.numero_placa;
                                    return (
                                        <li key={`indisponivel-${id}`}>
                                            <PlacaSelectItem
                                                placa={p}
                                                regiaoNome={findRegiaoNome(p)}
                                                onSelect={() => { /* noop - não pode selecionar */ }}
                                                type="add"
                                                disabled={true}
                                                unavailable={true}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </div>

                <div className="pi-selector__list">
                    <h4 id="placas-selecionadas-heading">Placas Selecionadas ({placasSelecionadas.length})</h4>
                    {/* Região para leitores de tela que anuncia mudanças na seleção */}
                    <div aria-live="polite" className="sr-only">{placasSelecionadas.length} placas selecionadas</div>
                    {placasSelecionadas.length > 0 ? (
                        <ul aria-labelledby="placas-selecionadas-heading">
                            {placasSelecionadas.map(placa => {
                                const id = placa._id || placa.id || placa.numero_placa;
                                return (
                                <li key={id}>
                                    <PlacaSelectItem
                                        placa={placa}
                                        regiaoNome={findRegiaoNome(placa)}
                                        onSelect={() => handleDeselectPlaca(placa)}
                                        type="remove"
                                        disabled={isSubmitting}
                                    />
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <p className="pi-selector__empty-list">Selecione placas da lista ao lado.</p>
                    )}
                </div>
            </div>

            {error && <div className="modal-form__error-message" style={{ marginTop: '1rem' }}>{error.message}</div>}
        </div>
    );
}

Page2Placas.propTypes = {
    name: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    dataInicio: PropTypes.string,
    dataFim: PropTypes.string,
    piId: PropTypes.string, // ID da PI quando está editando
    placaFilters: PropTypes.shape({
        selectedRegiao: PropTypes.string.isRequired,
        setSelectedRegiao: PropTypes.func.isRequired,
        placaSearch: PropTypes.string.isRequired,
        setPlacaSearch: PropTypes.func.isRequired,
        debouncedPlacaSearch: PropTypes.string.isRequired,
    }).isRequired,
};

export default Page2Placas;
