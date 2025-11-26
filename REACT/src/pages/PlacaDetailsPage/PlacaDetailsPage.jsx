// src/pages/PlacaDetailsPage/PlacaDetailsPage.jsx
import React, { useState, useEffect } from 'react'; // Removido useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Importa hooks
import { fetchPlacaById, fetchClientes, createAluguel } from '../../services';
import { useToast } from '../../components/ToastNotification/ToastNotification';
import Spinner from '../../components/Spinner/Spinner';
import Modal from '../../components/Modal/Modal';
import { getImageUrl, formatDate } from '../../utils/helpers';
import PlacaDetailsInfo from '../../components/PlacaDetailsInfo/PlacaDetailsInfo';
import PlacaMap from '../../components/PlacaMap/PlacaMap';
import PlacaAluguelHistory from '../../components/PlacaAluguelHistory/PlacaAluguelHistory';
import PeriodSelector from '../../components/PeriodSelector/PeriodSelector'; // [PERÍODO UNIFICADO]
import './PlacaDetailsPage.css';

const placaQueryKey = (id) => ['placa', id];
const clientesQueryKey = ['clientes'];

function PlacaDetailsPage() {
  const { id: placaId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const queryClient = useQueryClient();

  // --- Estado ---
  const [isAluguelModalOpen, setIsAluguelModalOpen] = useState(false);

  // --- Validação inicial do ID ---
  useEffect(() => {
    if (!placaId || String(placaId).trim() === '' || String(placaId) === 'undefined') {
        showToast('ID da placa inválido.', 'error');
        navigate('/placas', { replace: true });
    }
  }, [placaId, navigate, showToast]);

  // --- RHF para o modal ---
  const {
    register: registerAluguel,
    handleSubmit: handleAluguelFormSubmit,
    reset: resetAluguelForm,
    watch: watchAluguelForm,
    setValue: setValueAluguel,
    formState: { errors: aluguelModalErrors },
    setError: setAluguelError
  } = useForm({
       mode: 'onBlur',
       defaultValues: {
         cliente_id: '',
         // [PERÍODO UNIFICADO] Campo novo
         period: null,
         // [LEGADO] Mantidos para compatibilidade
         data_inicio: new Date().toISOString().split('T')[0],
         data_fim: ''
       }
     });
  const dataInicioAluguel = watchAluguelForm('data_inicio');

  // --- useQuery para Placa ---
  const {
    data: placa,
    isLoading: isLoadingPlaca,
    isError: isErrorPlaca,
    error: errorPlaca
  } = useQuery({
      queryKey: placaQueryKey(placaId),
      queryFn: () => fetchPlacaById(placaId),
      enabled: !!placaId, // Só busca se o ID for válido
      staleTime: 1000 * 60 * 5, // Cache de 5 min
      onError: (err) => {
          showToast(err.message || 'Erro ao carregar detalhes da placa.', 'error');
          if (err.message.includes('não encontrada')) {
              navigate('/placas', { replace: true });
          }
      }
  });

  // --- useQuery para Clientes (para o modal) ---
  const {
      data: clientes = [],
      isLoading: isLoadingClientes
  } = useQuery({
      queryKey: clientesQueryKey,
      queryFn: () => fetchClientes(new URLSearchParams({ limit: 1000 })),
      staleTime: 1000 * 60 * 10, // Cache longo para clientes
      placeholderData: [],
      select: (data) => data.data ?? []
  });

  // --- useMutation para Criar Aluguel ---
  const createAluguelMutation = useMutation({
      mutationFn: createAluguel,
      onSuccess: () => {
          showToast('Placa alugada com sucesso!', 'success');
          closeAluguelModal();
          // Invalida a query da placa para buscar os dados atualizados (status, cliente, etc.)
          queryClient.invalidateQueries({ queryKey: placaQueryKey(placaId) });
          // Também invalida o histórico de aluguéis
          queryClient.invalidateQueries({ queryKey: ['alugueis', placaId] });
          // Invalida as queries de placas disponíveis (usado no modal de PI)
          queryClient.invalidateQueries({ queryKey: ['placasDisponiveis'] });
          // Invalida a lista de placas (atualiza a página de placas)
          queryClient.invalidateQueries({ predicate: (query) => {
              return Array.isArray(query.queryKey) && query.queryKey[0] === 'placas';
          }});
      },
      onError: (error) => {
          showToast(error.message || 'Erro ao reservar a placa.', 'error');
          if(error.message.toLowerCase().includes('reservada')) {
              setAluguelError('data_inicio', { type: 'api', message: "Período indisponível" });
              setAluguelError('data_fim', { type: 'api', message: "Período indisponível" });
          }
          console.error("Erro submit aluguel:", error);
      }
  });

  const isSubmittingAluguel = createAluguelMutation.isPending;


  // --- Funções do Modal de Aluguel ---
  const openAluguelModal = () => {
      if (!placa || !placa.disponivel) { showToast('Esta placa não está disponível...', 'warning'); return; }
      if (clientes.length === 0) { showToast(isLoadingClientes ? 'A carregar clientes...' : 'Nenhum cliente disponível.', 'warning'); return; }

      resetAluguelForm({
        cliente_id: '',
        period: null, // [PERÍODO UNIFICADO]
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: ''
      });
      setIsAluguelModalOpen(true);
    };
  const closeAluguelModal = () => setIsAluguelModalOpen(false);

  const onAluguelSubmit = (data) => {
    const dataToSend = { placa_id: placaId, ...data };
    createAluguelMutation.mutate(dataToSend); // Chama a mutação
  };

  // Callback para o PlacaAluguelHistory (apenas invalida a query da placa)
  const handleAluguelChange = () => {
      queryClient.invalidateQueries({ queryKey: placaQueryKey(placaId) });
  };


  // --- Renderização ---
  if (isLoadingPlaca) {
    return <Spinner message="A carregar detalhes da placa..." />;
  }
  
  if (isErrorPlaca) {
    return <div className="placa-details-page"><p className="error-message">Erro ao carregar placa: {errorPlaca.message}</p></div>;
  }

  if (!placa) {
    // A query (onError) ou o useEffect (ID inválido) já devem ter redirecionado,
    // mas por segurança:
    return <div className="placa-details-page"><p>Placa não encontrada.</p></div>;
  }

  // Calcula status e URLs
  const statusText = placa.disponivel ? 'Disponível' : (placa.cliente_nome ? 'Alugada' : 'Em Manutenção');
  const statusClass = placa.disponivel ? 'placa-details-page__status--disponivel' : 'placa-details-page__status--indisponivel';
  const placeholderUrl = '/assets/img/placeholder.png';
  const imageUrl = getImageUrl(placa.imagem, placeholderUrl);
  const mapPosition = placa.coordenadas?.split(',').map(Number).filter(n => !isNaN(n));

  return (
    <>
      <div className="placa-details-page">
        <PlacaDetailsInfo
            placa={placa}
            imageUrl={imageUrl}
            placeholderUrl={placeholderUrl}
            statusText={statusText}
            statusClass={statusClass}
            onOpenAluguelModal={openAluguelModal}
            clientesCount={clientes.length} // Passa a contagem de clientes
        />

        <div id="details-map" className="placa-details-page__map-container">
            <PlacaMap
                mapPosition={mapPosition && mapPosition.length === 2 ? mapPosition : null}
                numeroPlaca={placa.numero_placa}
            />
        </div>
      </div>

      <PlacaAluguelHistory
          placaId={placaId}
          onAluguelChange={handleAluguelChange} // Passa o callback de invalidação
      />

      <Modal title="Alugar Placa" isOpen={isAluguelModalOpen} onClose={closeAluguelModal}>
         <form id="aluguel-form" className="modal-form" onSubmit={handleAluguelFormSubmit(onAluguelSubmit)} noValidate>
             <div className="modal-form__grid">
                 <div className="modal-form__input-group modal-form__input-group--full">
                     <label htmlFor="cliente_id">Cliente</label>
                     <select id="cliente_id"
                             className={`modal-form__input ${aluguelModalErrors.cliente_id ? 'input-error' : ''}`}
                             {...registerAluguel('cliente_id', { required: 'Cliente é obrigatório.' })}
                             disabled={isSubmittingAluguel || isLoadingClientes}>
                         <option value="">{isLoadingClientes ? 'A carregar...' : 'Selecione um cliente...'}</option>
                         {clientes.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                     </select>
                     {aluguelModalErrors.cliente_id && <div className="modal-form__error-message">{aluguelModalErrors.cliente_id.message}</div>}
                 </div>

                 {/* [PERÍODO UNIFICADO] PeriodSelector substitui inputs de data */}
                 <div className="modal-form__input-group modal-form__input-group--full">
                     <label>Período</label>
                     <PeriodSelector
                         value={watchAluguelForm('period')}
                         onChange={(newPeriod) => {
                             setValueAluguel('period', newPeriod, { shouldValidate: true });
                             // Mantém compatibilidade com campos legado
                             if (newPeriod) {
                                 setValueAluguel('periodType', newPeriod.periodType);
                                 setValueAluguel('startDate', newPeriod.startDate);
                                 setValueAluguel('endDate', newPeriod.endDate);
                                 setValueAluguel('biWeekIds', newPeriod.biWeekIds);
                                 // Campos legado
                                 setValueAluguel('data_inicio', newPeriod.startDate);
                                 setValueAluguel('data_fim', newPeriod.endDate);
                             }
                         }}
                         errors={aluguelModalErrors.period}
                         disabled={isSubmittingAluguel}
                         showDuration={true}
                     />
                     {aluguelModalErrors.period && <div className="modal-form__error-message">{aluguelModalErrors.period.message}</div>}
                 </div>
             </div>
             <div className="modal-form__actions">
                 <button type="button" className="modal-form__button modal-form__button--cancel" onClick={closeAluguelModal} disabled={isSubmittingAluguel}>Cancelar</button>
                 <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isSubmittingAluguel}>{isSubmittingAluguel ? 'A reservar...' : 'Reservar Placa'}</button>
             </div>
          </form>
      </Modal>
    </>
  );
}

export default PlacaDetailsPage;