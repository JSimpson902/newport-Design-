import { Element, api, track, unwrap } from 'engine';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction-data-mutation-lib';
import { createAction, PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction-actions';
import { variableReducer } from './variable-reducer';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction-data-type-lib';
import { PropertyEditorWarningEvent } from 'builder_platform_interaction-events';

// the property names in a variable element (after mutation)
const VARIABLE_FIELDS = {
    DATA_TYPE: 'dataType',
    DESCRIPTION: 'description',
    IS_COLLECTION: 'isCollection',
    IS_INPUT: 'isInput',
    IS_OUTPUT: 'isOutput',
    NAME: 'name',
    OBJECT_TYPE: 'objectType',
    SCALE: 'scale',
    DEFAULT_VALUE: 'defaultValue',
};

// TODO: use labels W-4954505
const EXTERNAL_ACCESS_VALUES = [
    { label: 'Use as Input', value: VARIABLE_FIELDS.IS_INPUT },
    { label: 'Use as Output', value: VARIABLE_FIELDS.IS_OUTPUT }
];

// fields on which warning can be set in variable editor
const VARIABLE_WARNING_FIELDS = [VARIABLE_FIELDS.NAME, VARIABLE_FIELDS.IS_INPUT, VARIABLE_FIELDS.IS_OUTPUT];

const flowDataTypeMenuItems = Object.values(FLOW_DATA_TYPE);

// TODO: use labels W-4954505
const dataTypeHelpText = 'Data type cannot be changed while this resource is being referenced in your flow';
const collectionHelpText = 'Use collection variables to store valeus with the same data type together. Iterate through ' +
    'your collection variable by using a loop';
const externalAccessHelpText = 'Use as Input: Variables can be set at the start of flow via URL parameters, Visualforce ' +
    'controllers, or subflow inputs. Use as output: Variables can be accessed from Visualforce controllers and master ' +
    'flows when this flow finishes.';
const warningMessage = 'Changing this field may result in runtime errors when this flow is called by another flow.';

/**
 * Variable property editor for Flow Builder
 *
 * @ScrumTeam Process UI
 * @author Alejandro Lopez
 * @since 216
 */
export default class VariableEditor extends Element {
    /**
     * Internal state for the variable editor
     */
    @track
    variableResource;

    @api
    get node() {
        return this.variableResource;
    }

    @api
    set node(newValue) {
        // TODO: update when W-4889306 is closed
        this.variableResource = unwrap(newValue);
        this._devNamePreviousValue = this.variableResource.name;

        this.initializeExternalAccessValues();
    }

    // used to keep track of whether this is an existing variable resource
    @api
    isNewMode = false;

    /**
     * Public api function to return the unwrapped node
     * Called by the property editor controller on "OK"
     * @returns {object} node - unwrapped node
     */
    @api
    getNode() {
        // TODO: might have to update when W-4889306 is closed
        return unwrap(this.variableResource);
    }

    get dataType() {
        return getValueFromHydratedItem(this.variableResource.dataType);
    }

    // we want to disable certain fields based on whether we are editing an existing variable or a new variable
    get isFieldDisabled() {
        return !this.isNewMode;
    }

    get dataTypeList() {
        return flowDataTypeMenuItems;
    }

    get dataTypeHelpText() {
        // TODO: use labels W-4954505
        return !this.isNewMode ? dataTypeHelpText : null;
    }

    get collectionHelpText() {
        // TODO: use labels W-4954505
        return collectionHelpText;
    }

    /**
     * Returns the external access options based on the data in variableResource.
     * The values returned in array should match with EXTERNAL_ACCESS_VALUES value attribute.
     * @return {Array} with options in format the checkbox-group expects. eg: ['isInput', 'isOutput']
     */
    get externalAccessValue() {
        return [VARIABLE_FIELDS.IS_INPUT, VARIABLE_FIELDS.IS_OUTPUT].filter(value => {
            return this.variableResource[value];
        });
    }

    /**
     * External access input output checkbox values
     * @return {Array} array of input for checkbox group
     */
    get externalAccessOptions() {
        return EXTERNAL_ACCESS_VALUES;
    }

    /**
     * Help text for external access input output checkboxes.
     * @return {string} help text for external access.
     */
    get externalAccessHelpText() {
        return externalAccessHelpText;
    }

    // previous value of external access input output checkbox. Used to assess warning.
    _externalAccessPreviousValues = new Set();

    // currently selected external access values. Used to assess warning.
    _externalAccessSelectedValues = [];

    // previous dev name from label description. Used to assess warning.
    _devNamePreviousValue = '';

    /* ********************** */
    /*     Event handlers     */
    /* ********************** */

    /**
     * @param {object} event property changed event coming from label-description component
     */
    handlePropertyChanged(event) {
        this.handleChange(event, event.propertyName);
        if (event.propertyName === VARIABLE_FIELDS.NAME) {
            this.assessWarning();
        }
    }

    handleDataTypeSelect(event) {
        this.handleChange(event, VARIABLE_FIELDS.DATA_TYPE);
        // TODO: handle clearing of fields when data type is changed
    }

    handleCollectionChange(event) {
        this.handleChange(event, VARIABLE_FIELDS.IS_COLLECTION);
    }

    /**
     * Handles the value change for external access checkbox group.
     * @param {object} event onchange from checkbox group
     */
    handleExternalAccessPropertyChanged(event) {
        // reset the values since the event has info about only selected values
        this.variableResource[VARIABLE_FIELDS.IS_INPUT] = false;
        this.variableResource[VARIABLE_FIELDS.IS_OUTPUT] = false;

        this._externalAccessSelectedValues = event.detail.value;
        this._externalAccessSelectedValues.forEach((propertyName) => {
            this.variableResource[propertyName] = true;
        });
    }

    /**
     * Handles the blur even for external access checkbox group.
     */
    handleExternalAccessOnBlur() {
        this.assessWarning();
    }

    /** *********************************/
    /*         Helper methods           */
    /** *********************************/

    /**
     * Helper method to update the property based extracting value from the event.
     * @param {object} event to handle
     * @param {string} propertyName property name to update
     */
    handleChange(event, propertyName) {
        event.stopPropagation();
        const valueErrorObj = this.getEventValueAndError(event);
        this.updateProperty(propertyName, valueErrorObj.value, valueErrorObj.error);
    }

    /**
     * Does the update property action with passed in property name, value and error.
     * @param {String} propertyName to update
     * @param {String} value to update with
     * @param {String} error if any
     */
    updateProperty(propertyName, value, error) {
        const action = createAction(PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY, { propertyName, value, error });
        this.variableResource = variableReducer(this.variableResource, action);
    }

    /**
     * Extract out value and error from the event based on whether the detail is present.
     * @param {object} event Event for the data type
     * @return {object} value and error object
     */
    getEventValueAndError(event) {
        return event.detail
            ? { value: event.detail.value, error: event.detail.error }
            : { value: event.value, error: event.error };
    }

    /**
     * Initialize the external access previous and selected values.
     */
    initializeExternalAccessValues() {
        this.externalAccessValue.forEach(value => {
            this._externalAccessPreviousValues.add(value);
            this._externalAccessSelectedValues.push(value);
        });
    }

    /**
     * Assess warnings and fire the property editor warning event
     */
    assessWarning() {
        this.clearWarnings();

        // If input or output was true and dev name is updated show warning
        const hasDevNameUpdated = getValueFromHydratedItem(this.variableResource.name)
            !== getValueFromHydratedItem(this._devNamePreviousValue);
        const wasExternalAccessTrue = this._externalAccessPreviousValues.size > 0;
        if (hasDevNameUpdated && wasExternalAccessTrue) {
            this.fireWarningEvent(VARIABLE_FIELDS.NAME, warningMessage);
        }

        // check if input output was true and now its false, if so show warning
        this._externalAccessPreviousValues.forEach(value => {
            if (!this._externalAccessSelectedValues.includes(value)) {
                this.fireWarningEvent(value, warningMessage);
            }
        });
    }

    /**
     * Clears warning from all the fields on which warning can be set.
     */
    clearWarnings() {
        VARIABLE_WARNING_FIELDS.forEach(propertyName => {
            this.fireWarningEvent(propertyName, null);
        });
    }

    /**
     * Fires propeditorwarning event with warning message.
     * @param {string} propertyName to set the warning for
     * @param {string} message the warning message
     */
    fireWarningEvent(propertyName, message) {
        const warningEvent = new PropertyEditorWarningEvent(propertyName, message);
        this.dispatchEvent(warningEvent);
    }

    /** *********************************/
    /*       Validation methods         */
    /** *********************************/

    /**
     * public api function to run the rules from assignment validation library
     * TODO: validation W-4900878
     * @returns {object} list of errors
     */
    @api
    validate() {
        // NOTE: if we find there is a case where an error can happen on a field without touching on it,
        // we might have to go through reducer to stuff the errors and call get errors method
        return getErrorsFromHydratedElement(this.variableResource);
    }
}