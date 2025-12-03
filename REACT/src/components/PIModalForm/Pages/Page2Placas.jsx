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

    // Log dos valores recebidos
    console.log('[Page2Placas] Props recebidas:', { dataInicio, dataFim, piId });

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
            // CORREÇÃO: Buscar TODAS as placas sem paginação
            params.append('limit', '1000'); // Limite alto para garantir todas as placas
            if (selectedRegiao) params.append('regiao_id', selectedRegiao); // ✅ CORREÇÃO: usar 'regiao_id'
            if (debouncedPlacaSearch) params.append('search', debouncedPlacaSearch);
            
            console.log('🔍 [Page2Placas] Buscando todas as placas com params:', params.toString());
            return fetchPlacas(params);
        },
        staleTime: 1000 * 60 * 10,
        select: data => {
            const result = data.data ?? [];
            console.log('📦 [Page2Placas] allPlacasData recebeu:', result.length, 'placas');
            return result;
        }
    });

    const { data: placasDisponiveis = [], isLoading: isLoadingDisponiveis, isFetching: isFetchingDisponiveis } = useQuery({
        queryKey: ['placasDisponiveis', dataInicio, dataFim, selectedRegiao, debouncedPlacaSearch, piId],
        queryFn: async () => {
            if (!dataInicio || !dataFim) {
                dbg('⚠️ Sem datas, não busca placas disponíveis');
                return Promise.resolve({ data: [] });
            }
            const params = new URLSearchParams({ dataInicio, dataFim });
            if (selectedRegiao) params.append('regiao_id', selectedRegiao); // ✅ CORREÇÃO: usar 'regiao_id'
            if (debouncedPlacaSearch) params.append('search', debouncedPlacaSearch);
            if (piId) params.append('excludePiId', piId);
            
            console.log('🔍 [Page2Placas] Buscando placas disponíveis (para referência):', { 
                dataInicio, 
                dataFim, 
                regiao: selectedRegiao || 'todas',
                search: debouncedPlacaSearch || 'sem filtro',
                excludePiId: piId || 'N/A'
            });
            
            const response = await fetchPlacasDisponiveis(params);
            
            console.log('📦 [Page2Placas] API retornou (para referência):', {
                total: response?.data?.length || 0,
                primeiras: response?.data?.slice(0, 3).map(p => p.numero_placa).join(', ') || 'nenhuma'
            });
            
            return response;
        },
        enabled: false, // Desabilitada pois não usamos mais para determinar disponibilidade
        staleTime: 0,
        gcTime: 0,
        select: data => {
            const result = data.data ?? [];
            console.log('✅ [Page2Placas] Placas da API (não usadas):', result.length);
            return result;
        }
    });

    const isLoading = isLoadingRegioes || isLoadingAllPlacas;
    const allPlacasMap = useMemo(() => {
        return (allPlacasData || []).reduce((m, p) => {
            const id = p._id || p.id || p.numero_placa;
            m.set(id, p);
            return m;
        }, new Map());
    }, [allPlacasData]);

    // Cache local por filterKey: não usado mais, mas mantido para compatibilidade
    const cacheRef = useRef(new Map());
    const filterKey = `${dataInicio || ''}|${dataFim || ''}|${selectedRegiao || ''}|${debouncedPlacaSearch || ''}|${piId || ''}`;

    // Não usamos mais placasDisponiveisSource
    // const placasDisponiveisSource = ...
    // dbg('placasDisponiveisSource', ...);

    const selectedIds = field.value || [];

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

    // Available = source - selected
    const placasDisponiveisFiltradas = useMemo(() => {
        const s = new Set(selectedIds);

        // CORREÇÃO: Sempre usa todas as placas filtradas como disponíveis
        // A verificação de disponibilidade por data será feita no backend durante o submit
        const sourcePlacas = (allPlacasData || []).filter(matchesFilter);
        console.log('🔄 [Page2Placas] Usando allPlacasData filtrado como disponíveis:', sourcePlacas.length);

        const result = sourcePlacas.filter(p => {
            const id = p._id || p.id || p.numero_placa;
            return !s.has(id);
        });

        console.log('✅ [Page2Placas] Placas disponíveis filtradas (após remover selecionadas):', result.length);
        return result;
    }, [allPlacasData, matchesFilter, selectedIds]);

    // Aria-live message para leitores de tela (mais descritivo)
    const [ariaMessage, setAriaMessage] = useState('');

    // Placas indisponíveis: não existem mais nesta implementação
    // const placasDisponiveisIds = ...

    const placasIndisponiveis = useMemo(() => {
        // CORREÇÃO: Como todas as placas são consideradas disponíveis,
        // não há placas indisponíveis nesta implementação
        console.log('🚫 [Page2Placas] Nenhuma placa é considerada indisponível nesta implementação');
        return [];
    }, []);

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
                {/* Indicador visual de carregamento removido pois não usamos mais a API de disponibilidade */}
                {false && (
                    <div style={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        zIndex: 20, 
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        color: '#666'
                    }}>
                        <i className="fas fa-sync fa-spin" style={{ fontSize: '12px' }}></i>
                        <span>Atualizando...</span>
                    </div>
                )}

                {isLoading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}>
                        <Spinner message="A carregar placas..." />
                    </div>
                )}

                <div className="pi-selector__list" style={{ 
                    opacity: 1, // Removido o efeito de fetching
                    transition: 'opacity 0.3s ease'
                }}>
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
