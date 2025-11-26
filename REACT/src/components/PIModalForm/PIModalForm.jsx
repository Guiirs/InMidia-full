// src/components/PIModalForm/PIModalForm.jsx
import React from 'react';
import PropTypes from 'prop-types';

import { usePIFormLogic } from './system/usePIFormLogic';
import Page1Cliente from './Pages/Page1Cliente';
import Page2Placas from './Pages/Page2Placas';
import Page3Valores from './Pages/Page3Valores';

import './css/PIModalForm.css';

function PIModalForm({ onSubmit, onClose, isSubmitting, initialData = {} }) {
    const {
        currentStep,
        formControls,
        watchedValues,
        placaFilters,
        navigation
    } = usePIFormLogic(onSubmit, initialData, isSubmitting);

    const isLoading = !!isSubmitting;

    return (
        <form id="pi-form" className="modal-form" onSubmit={formControls.handleSubmit(navigation.handleFormSubmit)} noValidate>
            <div className="pi-form-steps">
                <div className={`pi-form-step ${currentStep === 1 ? 'active' : (currentStep > 1 ? 'completed' : '')}`}>
                    <div className="pi-form-step__bubble">1</div>
                    <span>Cliente</span>
                </div>
                <div className={`pi-form-step ${currentStep === 2 ? 'active' : (currentStep > 2 ? 'completed' : '')}`}>
                    <div className="pi-form-step__bubble">2</div>
                    <span>Placas</span>
                </div>
                <div className={`pi-form-step ${currentStep === 3 ? 'active' : ''}`}>
                    <div className="pi-form-step__bubble">3</div>
                    <span>Valores</span>
                </div>
            </div>

            <div className="modal-form__grid pi-form__step-content">
                {currentStep === 1 && (
                    <Page1Cliente
                        register={formControls.register}
                        errors={formControls.errors}
                        isSubmitting={isSubmitting}
                        watchedClienteId={watchedValues.watchedClienteId}
                        setValue={formControls.setValue}
                        watch={formControls.watch}
                        control={formControls.control}
                    />
                )}

                {currentStep === 2 && (
                    <Page2Placas
                        control={formControls.control}
                        name="placas"
                        dataInicio={watchedValues.dataInicio}
                        dataFim={watchedValues.dataFim}
                        placaFilters={placaFilters}
                        isSubmitting={isSubmitting}
                        piId={initialData._id} // Passa o ID da PI quando está editando
                    />
                )}

                {currentStep === 3 && (
                    <Page3Valores
                        register={formControls.register}
                        errors={formControls.errors}
                        isSubmitting={isSubmitting}
                        dataInicio={watchedValues.dataInicio}
                        setValue={formControls.setValue}
                        watch={formControls.watch}
                    />
                )}
            </div>

            <div className="modal-form__actions">
                <button type="button" className="modal-form__button modal-form__button--cancel" onClick={onClose} disabled={isLoading}>Cancelar</button>

                {currentStep > 1 && (
                    <button type="button" className="modal-form__button modal-form__button--cancel" onClick={navigation.prevStep} disabled={isLoading}>Voltar</button>
                )}

                {currentStep < 3 && (
                    <button type="button" className="modal-form__button modal-form__button--confirm" onClick={navigation.nextStep} disabled={isLoading}>Próximo</button>
                )}

                {currentStep === 3 && (
                    <button type="submit" className="modal-form__button modal-form__button--confirm" disabled={isLoading}>
                        {isSubmitting ? 'A guardar...' : (initialData._id ? 'Guardar Alterações' : 'Criar PI')}
                    </button>
                )}
            </div>
        </form>
    );
}

PIModalForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    initialData: PropTypes.object,
};

export default PIModalForm;