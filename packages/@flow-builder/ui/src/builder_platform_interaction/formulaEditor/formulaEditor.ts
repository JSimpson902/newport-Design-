// @ts-nocheck
import { createAction, PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import { orgHasFlowFormulaBuilder } from 'builder_platform_interaction/contextLib';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { getProcessType, getRecordTriggerType, getTriggerType } from 'builder_platform_interaction/storeUtils';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './formulaEditorLabels';
import { formulaReducer } from './formulaReducer';

const dataTypes = [
    FLOW_DATA_TYPE.STRING,
    FLOW_DATA_TYPE.NUMBER,
    FLOW_DATA_TYPE.CURRENCY,
    FLOW_DATA_TYPE.BOOLEAN,
    FLOW_DATA_TYPE.DATE,
    FLOW_DATA_TYPE.DATE_TIME
];

export default class FormulaEditor extends LightningElement {
    _formulaLabelId = generateGuid();
    orgHasFlowFormulaBuilder = orgHasFlowFormulaBuilder();

    @track
    formulaResource;

    labels = LABELS;

    elementType = ELEMENT_TYPE.FORMULA;

    // used to keep track of whether this is an existing formula resource
    @api
    isNewMode = false;

    @api
    mode;

    @api
    editorParams;

    @api
    get node() {
        return this.formulaResource;
    }

    set node(newValue) {
        this.formulaResource = newValue || {};
    }

    /**
     * Public api function to return the node
     * Called by the property editor controller on "OK"
     *
     * @returns {object} node - node
     */
    @api
    getNode() {
        return this.formulaResource;
    }

    get dataTypes() {
        return dataTypes;
    }

    get selectedDataType() {
        return {
            dataType: getValueFromHydratedItem(this.formulaResource.dataType),
            scale: this.formulaResource.scale
        };
    }

    get elementName() {
        return getValueFromHydratedItem(this.formulaResource.name);
    }

    get processType() {
        return getProcessType();
    }

    get triggerType() {
        return getTriggerType();
    }

    get recordTriggerType() {
        return getRecordTriggerType();
    }

    get isEditMode() {
        return !this.isNewMode;
    }

    get dataTypeHelpText() {
        return !this.isNewMode ? this.labels.dataTypeCannotBeChangedHelpText : null;
    }

    get hideNewResourceButton() {
        return this.isNewMode;
    }

    get resourcePickerConfig() {
        return {
            filterOptions: {
                forFormula: true,
                hideNewResource: this.hideNewResourceButton,
                hideGlobalConstants: true
            }
        };
    }
    /**
     * @param {object} event - property changed event coming from label-description component
     */
    handlePropertyChanged(event) {
        event.stopPropagation();
        const propertyName = event.detail.propertyName;
        const value = event.detail.value;
        const error = event.detail.error;
        const action = createAction(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, { propertyName, value, error });
        this.formulaResource = formulaReducer(this.formulaResource, action);
    }

    handleDataTypeChanged(event) {
        event.stopPropagation();
        const action = createAction(PROPERTY_EDITOR_ACTION.CHANGE_DATA_TYPE, {
            value: event.detail.value
        });
        this.formulaResource = formulaReducer(this.formulaResource, action);
    }

    handleFormulaExpressionChanged(event) {
        const propertyName = 'expression';
        const value = event.detail.value;
        const error = event.detail.error || null;
        const action = createAction(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, { propertyName, value, error });
        this.formulaResource = formulaReducer(this.formulaResource, action);
    }

    handleFormulaTextChanged(event) {
        const propertyName = 'expression';
        const value = event.detail.value;
        const action = createAction(PROPERTY_EDITOR_ACTION.UPDATE_FORMULA_TEXT, { propertyName, value });
        this.formulaResource = formulaReducer(this.formulaResource, action);
    }

    @api
    validate() {
        const action = createAction(VALIDATE_ALL);
        this.formulaResource = formulaReducer(this.formulaResource, action);
        return getErrorsFromHydratedElement(this.formulaResource);
    }
}
