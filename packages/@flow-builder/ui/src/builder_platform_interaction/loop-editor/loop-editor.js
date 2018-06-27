import { Element, api, track, unwrap } from 'engine';
import { loopReducer } from './loop-reducer';
import { VALIDATE_ALL } from 'builder_platform_interaction-validation-rules';
import BaseResourcePicker from 'builder_platform_interaction-base-resource-picker';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction-data-mutation-lib';
import { getElementByGuid } from 'builder_platform_interaction-store-utils';
import { addCurlyBraces } from 'builder_platform_interaction-common-utils';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction-data-type-lib';
import {PropertyChangedEvent} from 'builder_platform_interaction-events';

const LOOP_PROPERTIES = {
    COLLECTION_VARIABLE: 'collectionReference',
    LOOP_VARIABLE: 'assignNextValueToReference',
    ITERATION_ORDER: 'iterationOrder'
};
// TODO: use labels W-4960986
const VARIABLE_LABEL = 'Variable';
const SOBJECT_LABEL = 'SObject';
const COLLECTION_VARIABLE_PLACEHOLDER = 'Find a collection variable...';
const LOOP_VARIABLE_PLACEHOLDER = 'Find a variable...';
const ITERATION_ORDER_ASCENDING = 'Asc';
const ITERATION_ORDER_DECENDING = 'Desc';
const LOOPVAR_ERROR_MESSAGE = 'Datatype does not match collection variable';
const LOOPVAR_LITERALS_ALLOWED = false;
const LOOPVAR_REQUIRED = true;
const LOOPCOLLECTION_DISABLED = false;

const COLLECTION_VAR_ELEMENT_CONFIG = {
    elementType: ELEMENT_TYPE.LOOP,
    isCollection: true
};

export default class LoopEditor extends Element {
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
        this._collectionVariable = this.loopElement.collectionReference ? getElementByGuid(getValueFromHydratedItem(this.loopElement.collectionReference)) : null;
        this.loopVariableState = this.loopElement.assignNextValueToReference ? getElementByGuid(getValueFromHydratedItem(this.loopElement.assignNextValueToReference)) : null;
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
        if (this.loopVariableState && this.loopVariableState !== null) {
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

    // TODO: use labels W-4960986
    get collectionVariableComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            VARIABLE_LABEL,
            COLLECTION_VARIABLE_PLACEHOLDER,
            this.loopElement.collectionReference ? this.loopElement.collectionReference.error : null,
            LOOPVAR_LITERALS_ALLOWED,
            LOOPVAR_REQUIRED,
            LOOPCOLLECTION_DISABLED
        );
    }

    // TODO: use labels W-4960986
    get loopVariableComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            VARIABLE_LABEL,
            LOOP_VARIABLE_PLACEHOLDER,
            this.loopElement.assignNextValueToReference ? this.loopElement.assignNextValueToReference.error : null,
            LOOPVAR_LITERALS_ALLOWED,
            LOOPVAR_REQUIRED,
            this.isLoopVariableDisabled
        );
    }

    get iterationOrderOptions() {
        return [{ 'label': 'First to last', 'value': ITERATION_ORDER_ASCENDING }, { 'label': 'Last to first', 'value': ITERATION_ORDER_DECENDING }];
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
        // TODO: in W-5079245 replace this and get the data needed directly from the event
        event.detail.propertyName = LOOP_PROPERTIES.COLLECTION_VARIABLE;
        this._collectionVariable = event.detail.item ? getElementByGuid(event.detail.item.value) : null;

        if (this.loopVariableState && this.loopVariableState !== null && this._collectionVariable !== null) {
            // check if loop variable dataType or objectType changed
            const collectionVariableDataType = this._collectionVariable ? this._collectionVariable.dataType : null;
            let isLoopVariableSObjectObjectTypeChanged = false;
            if (collectionVariableDataType === SOBJECT_LABEL && this._collectionVariable.dataType === SOBJECT_LABEL) {
                isLoopVariableSObjectObjectTypeChanged = this.getLoopVariableSObjectType() !== this._collectionVariable.objectType;
            }
            const isLoopVariableDataTypeChanged = this.getLoopVariableDataType() !== collectionVariableDataType;

            // set datatype mismatch error message for loopVariable
            if (isLoopVariableDataTypeChanged && this.loopVariableState !== null && this.loopVariableState) {
                this.loopElement.assignNextValueToReference.error = LOOPVAR_ERROR_MESSAGE;
            } else if (isLoopVariableSObjectObjectTypeChanged) {
                this.loopElement.assignNextValueToReference.error = LOOPVAR_ERROR_MESSAGE;
            } else if (this.loopElement.assignNextValueToReference) {
                this.loopElement.assignNextValueToReference.error = null;
            }
        }
        // enable or disable loop variable
        this.isLoopVariableDisabled = this._collectionVariable === null;
        this.loopElement = loopReducer(this.loopElement, event);
    }

    handleLoopVariablePropertyChanged(event) {
        event.stopPropagation();
        // TODO: in W-5079245 replace this and get the data needed directly from the event
        event.detail.propertyName = LOOP_PROPERTIES.LOOP_VARIABLE;
        this.loopVariableState = event.detail.item ? getElementByGuid(event.detail.item.value) : null;

        if (this._collectionVariable && this._collectionVariable !== null) {
            // check if loop variable dataType or objectType changed
            const isLoopVariableDataTypeChanged = this.getCollectionVariableDataType() !== this.getLoopVariableDataType();
            let isLoopVariableSObjectObjectTypeChanged = false;
            if (this.getCollectionVariableDataType() === SOBJECT_LABEL && this.getLoopVariableDataType() === SOBJECT_LABEL) {
                isLoopVariableSObjectObjectTypeChanged = this.getCollectionVariableSObjectType() !== this.getLoopVariableSObjectType();
            }

            // set datatype mismatch error message for loopVariable
            if (isLoopVariableDataTypeChanged && this.loopElement.assignNextValueToReference) {
                this.loopElement.assignNextValueToReference.error = LOOPVAR_ERROR_MESSAGE;
            } else if (isLoopVariableSObjectObjectTypeChanged) {
                this.loopElement.assignNextValueToReference.error = LOOPVAR_ERROR_MESSAGE;
                // In case event.detail.error is null then it could overwrite LOOPVAR_ERROR_MESSAGE that was set in above line.
                event.detail.error = event.detail.error === null ? LOOPVAR_ERROR_MESSAGE : event.detail.error;
            }  else if (this.loopElement.assignNextValueToReference) {
                this.loopElement.assignNextValueToReference.error = null;
            }
        }
        // If loopCollection has error then clear datatypemismatch error message for loopVariable
        const loopVariableErrorMessage = this.loopElement.assignNextValueToReference ? this.loopElement.assignNextValueToReference.error : null;
        if (event.detail.error !== null &&  loopVariableErrorMessage === LOOPVAR_ERROR_MESSAGE) {
            this.loopElement.assignNextValueToReference.error = null;
        }
        this.loopElement = loopReducer(this.loopElement, event);
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
        return this.loopVariableState ? this.loopVariableState.objectType : null;
    }

    /**
     * Returns the the string value of loop variable sObject objectType
     * @returns {String} The string value
     */
    getCollectionVariableSObjectType() {
        return this._collectionVariable ? this._collectionVariable.objectType : null;
    }
}