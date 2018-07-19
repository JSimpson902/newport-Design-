import { Element, api, track, unwrap } from 'engine';
import { loopReducer } from './loop-reducer';
import { VALIDATE_ALL } from 'builder_platform_interaction-validation-rules';
import BaseResourcePicker from 'builder_platform_interaction-base-resource-picker';
import { getErrorsFromHydratedElement, getErrorFromHydratedItem, getValueFromHydratedItem } from 'builder_platform_interaction-data-mutation-lib';
import { getResourceByUniqueIdentifier } from 'builder_platform_interaction-expression-utils';
import { addCurlyBraces, removeCurlyBraces } from 'builder_platform_interaction-common-utils';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction-data-type-lib';
import {PropertyChangedEvent, LoopCollectionChangedEvent} from 'builder_platform_interaction-events';
import { LABELS } from './loop-editor-labels';

const LOOP_PROPERTIES = {
    COLLECTION_VARIABLE: 'collectionReference',
    LOOP_VARIABLE: 'assignNextValueToReference',
    ITERATION_ORDER: 'iterationOrder'
};

const ITERATION_ORDER_ASCENDING = 'Asc';
const ITERATION_ORDER_DECENDING = 'Desc';
const LOOPVAR_LITERALS_ALLOWED = false;
const LOOPVAR_REQUIRED = true;
const LOOPVARIABLE_DISABLED = false;

const COLLECTION_VAR_ELEMENT_CONFIG = {
    elementType: ELEMENT_TYPE.LOOP,
    isCollection: true
};

export default class LoopEditor extends Element {
    labels = LABELS;

    /**
     * internal state for the loop editor
     */
    @track loopElement;
    @track loopVariableState;
    @track isLoopVariableDisabled;

    @api
    get node() {
        return this.loopElement;
    }

    @api
    set node(newValue) {
        this.loopElement = newValue || {};
        this._collectionVariable = this.loopElement.collectionReference.value ? getResourceByUniqueIdentifier(getValueFromHydratedItem(this.loopElement.collectionReference)) : null;
        this.loopVariableState = this.loopElement.assignNextValueToReference.value ? getResourceByUniqueIdentifier(getValueFromHydratedItem(this.loopElement.assignNextValueToReference)) : null;
        // disable loop variable until collection is chosen.
        this.isLoopVariableDisabled = !this._collectionVariable;
    }

    /**
     * public api function to return the unwrapped node
     * @returns {object} node - unwrapped node
     */
    @api getNode() {
        return unwrap(this.loopElement);
    }

    /**
     * public api function to run the rules from loop validation library
     * @returns {object} list of errors
     */
    @api validate() {
        const event = { type: VALIDATE_ALL };
        this.loopElement = loopReducer(this.loopElement, event);
        return getErrorsFromHydratedElement(this.loopElement);
    }

    /**
     * Gets the developer name of the collection variable in the loop element
     * The name is in the {!name} format
     * @returns {String} name
     */
    get collectionVariable() {
        if (this._collectionVariable) {
            return {
                text: addCurlyBraces(this._collectionVariable.name),
                displayText: addCurlyBraces(this._collectionVariable.name),
                value: this.loopElement.collectionReference
            };
        }
        return '';
    }

    get loopVariable() {
        if (this.loopVariableState) {
            return {
                text: addCurlyBraces(this.loopVariableState.name),
                displayText: addCurlyBraces(this.loopVariableState.name),
                value: this.loopVariableState.guid
            };
        }
        return '';
    }

    get collectionVariableElementConfig() {
        return COLLECTION_VAR_ELEMENT_CONFIG;
    }

    get loopVariableElementConfig() {
        const collectionVariableDataType = this._collectionVariable ? this._collectionVariable.dataType : null;
        return {
            elementType: ELEMENT_TYPE.LOOP,
            dataType: collectionVariableDataType,
            sObjectSelector: collectionVariableDataType === FLOW_DATA_TYPE.SOBJECT.value,
            entityName: this._collectionVariable ? this._collectionVariable.objectType : null
        };
    }

    get collectionVariableComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            LABELS.collectionVariableLabel,
            LABELS.collectionVariablePlaceholder,
            this.loopElement.collectionReference.error,
            LOOPVAR_LITERALS_ALLOWED,
            LOOPVAR_REQUIRED,
            LOOPVARIABLE_DISABLED
        );
    }

    get loopVariableComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            LABELS.loopVariableLabel,
            LABELS.loopVariablePlaceholder,
            this.loopElement.assignNextValueToReference.error,
            LOOPVAR_LITERALS_ALLOWED,
            LOOPVAR_REQUIRED,
            this.isLoopVariableDisabled
        );
    }

    get iterationOrderOptions() {
        return [{ 'label': LABELS.iterationOrderAscendingLabel, 'value': ITERATION_ORDER_ASCENDING }, { 'label': LABELS.iterationOrderDescendingLabel, 'value': ITERATION_ORDER_DECENDING }];
    }

    get iterationOrderValue() {
        return this.loopElement.iterationOrder ? this.loopElement.iterationOrder.value : ITERATION_ORDER_ASCENDING;
    }

    handleEvent(event) {
        event.stopPropagation();
        this.loopElement = loopReducer(this.loopElement, event);
    }

    handleCollectionVariablePropertyChanged(event) {
        event.stopPropagation();
        this._collectionVariable = event.detail.item ? this.mutateComboboxItem(event.detail.item) : null;
        let loopVarErrorMessage = getErrorFromHydratedItem(this.loopElement.assignNextValueToReference);
        const isDataTypeChanged = this.getLoopVariableDataType() !==  this.getCollectionVariableDataType();
        const isSObjectTypeChanged = this.getLoopVariableSObjectType() !== this.getCollectionVariableSObjectType();

        if (this.loopVariableState && this._collectionVariable && (isDataTypeChanged || isSObjectTypeChanged)) {
            // set datatype mismatch error message for loopVariable
            loopVarErrorMessage = LABELS.loopVariableErrorMessage;
        } else if (event.detail.error !== null &&  this.loopElement.assignNextValueToReference.error === LABELS.loopVariableErrorMessage) {
            // If loopCollection has error then clear datatypemismatch error message for loopVariable
            loopVarErrorMessage = null;
        }

        // enable or disable loop variable
        this.isLoopVariableDisabled = this._collectionVariable === null;

        // update collectionVariable and loopVariableErrorMessage
        const loopCollectionValue = event.detail.item ? event.detail.item.value : null;
        const loopVariableValue =  getValueFromHydratedItem(this.loopElement.assignNextValueToReference);
        const loopCollectionChangedEvent = new LoopCollectionChangedEvent(loopCollectionValue, event.detail.error, loopVariableValue, loopVarErrorMessage);
        this.loopElement = loopReducer(this.loopElement, loopCollectionChangedEvent);
    }

    handleLoopVariablePropertyChanged(event) {
        event.stopPropagation();
        let loopVariableError = event.detail.error;
        const loopVariableValue = event.detail.item ? event.detail.item.value : null;
        const isDataTypeErrorMessageApplied = getErrorFromHydratedItem(this.loopElement.assignNextValueToReference) === LABELS.loopVariableErrorMessage;
        const isLoopVariableValueChanged = loopVariableValue === getValueFromHydratedItem(this.loopElement.assignNextValueToReference);

        if (loopVariableError === null && isDataTypeErrorMessageApplied && isLoopVariableValueChanged) {
            // preserve data type mismatch error if it already exists, otherwise it will be removed.
            loopVariableError = LABELS.loopVariableErrorMessage;
        }
        this.loopVariableState = event.detail.item ? this.mutateComboboxItem(event.detail.item) : null;
        const loopVariableChangedEvent = new PropertyChangedEvent(LOOP_PROPERTIES.LOOP_VARIABLE, event.detail.item, loopVariableError);
        this.loopElement = loopReducer(this.loopElement, loopVariableChangedEvent);
    }

    handleLoopIterationOrderChanged(event) {
        event.stopPropagation();
        const iterationOrderChangedEvent = new PropertyChangedEvent(LOOP_PROPERTIES.ITERATION_ORDER, event.detail.value, null);
        this.loopElement = loopReducer(this.loopElement, iterationOrderChangedEvent);
    }

    /* **************************** */
    /*    Private Helper methods    */
    /* **************************** */

    /**
     * Returns the the string value of loop variable dataType
     * @returns {String} The string value
     */
    getLoopVariableDataType() {
        return this.loopVariableState ? this.loopVariableState.dataType : null;
    }

    /**
     * Returns the the string value of collection variable dataType
     * @returns {String} The string value
     */
    getCollectionVariableDataType() {
        return this._collectionVariable ? this._collectionVariable.dataType : null;
    }

    /**
     * Returns the the string value of loop variable sObject objectType
     * @returns {String} The string value
     */
    getLoopVariableSObjectType() {
        return this.loopVariableState && this.loopVariableState.objectType ? this.loopVariableState.objectType : null;
    }

    /**
     * Returns the the string value of loop variable sObject objectType
     * @returns {String} The string value
     */
    getCollectionVariableSObjectType() {
        return this._collectionVariable && this._collectionVariable.objectType ? this._collectionVariable.objectType : null;
    }

    /**
     * Mutate the combobox menu item to shape needed for loop variable/collection variable.
     * @param {Object} item Combobox menu item
     * @return {Object} the object needed to populate loop variable/collection variable.
     */
    mutateComboboxItem(item) {
        return {
            name: removeCurlyBraces(item.displayText),
            guid: item.value,
            dataType: item.dataType,
            objectType: item.objectType ? item.objectType : null
        };
    }
}