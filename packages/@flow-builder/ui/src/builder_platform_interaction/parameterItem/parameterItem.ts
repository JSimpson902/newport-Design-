// @ts-nocheck
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { isUndefinedOrNull, sanitizeBoolean } from 'builder_platform_interaction/commonUtils';
import {
    getErrorFromHydratedItem,
    getValueFromHydratedItem,
    isItemHydrated
} from 'builder_platform_interaction/dataMutationLib';
import { FLOW_DATA_TYPE, getDataTypeIcons } from 'builder_platform_interaction/dataTypeLib';
import { DeleteParameterItemEvent, UpdateParameterItemEvent } from 'builder_platform_interaction/events';
import { getFerovInfoAndErrorFromEvent } from 'builder_platform_interaction/expressionUtils';
import { PARAM_PROPERTY } from 'builder_platform_interaction/ruleLib';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './parameterItemLabels';

export default class ParameterItem extends LightningElement {
    labels = LABELS;

    @track state = {
        toggleStatus: false,
        parameterItem: {},
        isInput: true
    };

    @api
    itemIndex = 0;

    /**
     * element type: ActionCall or ApexPlugin or Subflow (ELEMENT_TYPE.ACTION_CALL, ELEMENT_TYPE.APEX_PLUGIN_CALL, ELEMENT_TYPE.SUBFLOW)
     */
    @api
    elementType;

    @api
    hideParameterIcon = false;

    @api
    disabled = false;

    @api
    showDelete = false;

    @api
    warningBadge;

    @api
    warningMessage;

    @api
    grayPill = false;

    /**
     * Holds the rules used for fetching full menu data, used the ferovResourcePicker to display allowed inputs
     *
     * @type {module:rules.operatorRule[]}
     */
    @api
    rules = [];

    /**
     * preserve the combobox's value before switching the toggle to OFF
     */
    preservedValue = { value: null, valueDataType: null };

    /**
     * @typedef {Object} ParameterItem
     * @property {string} name  parameter's name (may be hydrated)
     * @property {string} rowIndex  the unique identifier
     * @property {boolean} [isRequired]   true if the parameter is required input parameter
     * @property {string | Object} [label]   parameter label (may be hydrated)
     * @property {string | Object} dataType     the flow data type, see FLOW_DATA_TYPE (may be hydrated)
     * @property {number} [maxOccurs]   the maximum occurrences
     * @property {string} [subtype] the api name of sobject if dataType is FLOW_DATA_TYPE.SOBJECT (may be hydrated),
     *                              or the apex class name if dataType is FLOW_DATA_TYPE.APEX
     * @property {Object} [value]    parameter's value (must be hydrated)
     * @property {string} [valueDataType]   parameter's value data type
     * @property {string} [iconName] parameter's icon name, if we wish to use a custom icon rather than lookup icon by data type
     * @example <caption>parameter item</caption>
     * {
     * name: 'feedId',
     * isRequired: false,
     * label: 'Feed Id',
     * dataType: 'String',
     * maxOccurs: 1,
     * objectType: null,
     * value: {value: 'textVar', error: null},
     * valueDataType: 'reference',
     * iconName: 'utility:events'
     * }
     */

    /**
     * @param {ParameterItem} parameter item
     */
    set item(parameter) {
        this.state.parameterItem = parameter;
        this.state.toggleStatus = !this.state.isInput || this.state.parameterItem.isRequired || this.checked;
    }

    @api
    get item() {
        return this.state.parameterItem;
    }

    set isInput(value) {
        this.state.isInput = sanitizeBoolean(value);
        this.state.toggleStatus = !this.state.isInput || this.state.parameterItem.isRequired || this.checked;
    }

    @api
    get isInput() {
        return this.state.isInput;
    }

    get showToggle() {
        return this.isOptionalInput() && !this.showDelete;
    }

    /**
     * true if this parameter is optional input parameter and it has a value
     */
    get checked() {
        return this.isOptionalInput() && !isUndefinedOrNull(getValueFromHydratedItem(this.state.parameterItem.value));
    }

    /**
     * true if data type of this parameter is a collection
     */
    get isCollection() {
        return this.state.parameterItem.hasOwnProperty('maxOccurs') && this.state.parameterItem.maxOccurs > 1;
    }

    /**
     * @returns {boolean} true if this parameter is optional input parameter
     */
    isOptionalInput() {
        return this.state.isInput && !this.state.parameterItem.isRequired;
    }

    /**
     * show divider
     */
    get itemClass() {
        return 'slds-p-around_x-small slds-m-bottom_x-small ' + (this.itemIndex > 0 ? 'slds-item' : '');
    }

    get comboboxAriaHidden() {
        const ariaHidden = !this.state.toggleStatus;
        return ariaHidden.toString();
    }

    get comboboxClass() {
        return this.state.toggleStatus ? '' : 'slds-hide';
    }

    get parameterLabel() {
        const label = getValueFromHydratedItem(this.state.parameterItem.label);
        return label ? label : getValueFromHydratedItem(this.state.parameterItem.name);
    }
    /**
     * @returns {string | Object} returns the default value for the combobox or null
     */
    get parameterValue() {
        const value = getValueFromHydratedItem(this.state.parameterItem.value);
        return value ? value : null;
    }

    /**
     * @returns {Guid} returns the parameter rowIndex
     */
    get parameterRowIndex() {
        return this.state.parameterItem.rowIndex;
    }

    /**
     * @returns {Object} config to pass in ferov-resource-picker component
     */
    get parameterComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.parameterLabel,
            this.labels.parameterPlaceholder, // placeholder
            this.errorMessage, // errorMessage
            this.state.isInput, // literalsAllowed
            this.state.parameterItem.isRequired || false, // required
            this.disabled, // disabled
            this.getDataType(),
            this.enableFieldDrilldown // enableFieldDrilldown
        );
    }

    get elementParam() {
        return {
            [PARAM_PROPERTY.DATA_TYPE]: this.getDataType(),
            [PARAM_PROPERTY.IS_COLLECTION]: this.isCollection,
            subtype: getValueFromHydratedItem(this.state.parameterItem.subtype)
        };
    }

    get errorMessage() {
        return getErrorFromHydratedItem(this.state.parameterItem.value);
    }

    get enableFieldDrilldown() {
        // sobjects can not have apex objects or other sobjects as their fields, so only show them if they themselves match the parameter type
        // i.e. if the parameter type is "Account" no need to show any other type of sobject because their fields would never match Account
        return this.getDataType !== FLOW_DATA_TYPE.SOBJECT.value;
    }

    getDataType() {
        return getValueFromHydratedItem(this.state.parameterItem.dataType);
    }

    /**
     * icon for parameter
     */
    get iconName() {
        return this.state.parameterItem.iconName || getDataTypeIcons(this.getDataType(), 'utility');
    }

    /**
     * alternative text
     */
    get alternativeText() {
        return this.getDataType();
    }

    /**
     * @returns {string} the css class for badge
     */
    get badgeClasses() {
        let classes = 'slds-align-middle slds-m-left_xx-small';
        if (!this.grayPill) {
            classes = `${classes} slds-theme_warning`;
        }
        return classes;
    }

    get warningMessages() {
        return { 'No Section': [this.warningMessage] };
    }

    /**
     * handle the toggle changed event
     *
     * @param {Object} event event fired from input toggle
     */
    handleToggleChanged(event) {
        event.stopPropagation();
        this.state.toggleStatus = event.detail.checked;
        let value = null,
            dataType = null,
            error = null;
        if (!this.state.toggleStatus) {
            // from ON to OFF
            if (isItemHydrated(this.state.parameterItem)) {
                this.preservedValue = {
                    value: this.state.parameterItem.value,
                    valueDataType: this.state.parameterItem.valueDataType
                };
            }
        } else if (this.preservedValue.value) {
            value = getValueFromHydratedItem(this.preservedValue.value);
            dataType = this.preservedValue.valueDataType;
            error = getErrorFromHydratedItem(this.preservedValue.value);
            this.preservedValue = { value: null, valueDataType: null };
        } else {
            value = '';
            dataType = this.getDataType();
        }
        this.dispatchParameterEvent(value, dataType, error);
    }

    /**
     * handle update parameter's value
     *
     * @param {Object} event event fired from the combobox
     */
    handleUpdateParameter(event) {
        event.stopPropagation();
        const { value, dataType, error } = getFerovInfoAndErrorFromEvent(event, this.getDataType());
        // the first time loading the parameter, if value is null, the combobox will set displayText to ''
        // if the parameter item is a collection, the combobox will fire a comboboxStateChangedEvent. So to make the combobox invisible, we should not dispatch the UpdateParameterItemEvent to update the value to ''
        if (
            !this.isCollection ||
            !(
                this.isOptionalInput() &&
                isUndefinedOrNull(getValueFromHydratedItem(this.state.parameterItem.value)) &&
                value === ''
            )
        ) {
            this.dispatchParameterEvent(value, dataType, error);
        }
    }

    /**
     * dispatch UpdateParameterItemEvent
     *
     * @param {string} value - the new value
     * @param {string} dataType - the new value's data type
     * @param {string} error - error message
     */
    dispatchParameterEvent(value, dataType, error) {
        const itemUpdatedEvent = new UpdateParameterItemEvent(
            this.state.isInput,
            this.state.parameterItem.rowIndex,
            getValueFromHydratedItem(this.state.parameterItem.name),
            value,
            dataType,
            error
        );
        this.dispatchEvent(itemUpdatedEvent);
    }

    /**
     * handle delete parameter
     *
     * @param {Object} event event fired from the delete icon
     */
    handleDelete(event) {
        event.stopPropagation();
        const itemDeleteEvent = new DeleteParameterItemEvent(
            this.state.isInput,
            this.state.parameterItem.rowIndex,
            getValueFromHydratedItem(this.state.parameterItem.name)
        );
        this.dispatchEvent(itemDeleteEvent);
    }
}
