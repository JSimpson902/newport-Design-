import { LightningElement, api, track }  from 'lwc';
import {
    getMenuData,
    getResourceByUniqueIdentifier,
    mutateFieldToComboboxShape,
    mutateFlowResourceToComboboxShape,
} from "builder_platform_interaction/expressionUtils";
import {
    getOutputRules,
    getRHSTypes,
    RULE_OPERATOR,
} from "builder_platform_interaction/ruleLib";
import { isObject } from "builder_platform_interaction/commonUtils";
import { Store } from 'builder_platform_interaction/storeLib';
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import outputPlaceholder from '@salesforce/label/FlowBuilderCombobox.outputPlaceholder';
import { sanitizeGuid } from "builder_platform_interaction/dataMutationLib";
import * as sobjectLib from "builder_platform_interaction/sobjectLib";

let storeInstance;

export default class OutputResourcePicker extends LightningElement {
    static RULES = getOutputRules();

    @track
    _customValidity;

    @track
    _value;

    @track
    _comboboxConfig = {};

    /**
     * The allowed param types based on the rule service
     * @type {Object}
     */
    @track
    paramTypes = null;

    /**
     * The current value of the picker
     * @param {module:base-resource-picker.item|String} newValue the new value for the picker
     */
    set value(newValue) {
        // TODO: W-5511396 this should only be if the value's "level" has changed
        if (this._value !== newValue) {
            this._isInitialized = false;
        }
        this._value = newValue;
    }

    @api
    get value() {
        return this._value;
    }

    /**
     * Custom error message to display
     * @param {String} message - The error message
     */
    @api
    setCustomValidity(message) {
        this._customValidity = message;
        if (this._baseResourcePicker) {
            this._baseResourcePicker.setCustomValidity(message);
        }
    }

    /**
     * Set the error message through props
     * @param {String} error the new error message
     */
    set errorMessage(error) {
        this.setCustomValidity(error);
    }

    @api
    get errorMessage() {
        return this._customValidity;
    }

    /**
     * The combobox config for the resource picker
     * @param {module:base-resource-picker.ComboboxConfig} newComboboxConfig the new combobox config object
     */
    set comboboxConfig(newComboboxConfig) {
        this._comboboxConfig = Object.assign({}, newComboboxConfig, { literalsAllowed: false, placeholder: outputPlaceholder });
        this._isInitialized = false;
    }

    @api
    get comboboxConfig() {
        return this._comboboxConfig;
    }

    /**
     * The element type of the property editor from element config.
     * @type {String}
     */
    @api
    propertyEditorElementType;

    /**
     * The element param that represents the left hand side in operator rules.
     * @type {module:operator-rule-util.param}
     */
    @api
    elementParam;

    /**
     * If true, hasNext will be set to true for all menu items
     */
    get enableFieldDrilldown() {
        return !!this.comboboxConfig.enableFieldDrilldown;
    }

    get parentItem() {
        return this.value && this.value.parent;
    }

    get elementConfig() {
        return {
            elementType: this.propertyEditorElementType,
            shouldBeWritable: true,
        };
    }

    /**
     * True if the component has been initialized, false otherwise. This is so we do not populate menu data twice on initializing api values
     * @type {Boolean}
     */
    _isInitialized = false;

    /**
     * The full menu data available for selection based on the resource picker props
     * @type {Object[]}
     */
    _menuData;

    /**
     * Store unsubscribe function.
     */
    _unsubscribeStore;

    /** Event handlers */

    handleValueChange(event) {
        this.value = event.detail.item || event.detail.displayText;
    }

    handleFetchMenuData(event) {
        const selectedItem = event.detail.item;
        this.populateMenuData(selectedItem);
    }

    constructor() {
        super();
        storeInstance = Store.getStore();
        this._unsubscribeStore = storeInstance.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        if (typeof this._unsubscribeStore === 'function') {
            this._unsubscribeStore();
        }
    }

    renderedCallback() {
        if (!this._isInitialized) {
            this._baseResourcePicker = this.template.querySelector(BaseResourcePicker.SELECTOR);

            const identifier = isObject(this.value) ? this.value.value : this.value;
            this.initializeResourcePicker(this.normalizeValue(identifier));
        }
    }

    /** HELPER METHODS */

    initializeResourcePicker = (normalizedValue) => {
        // on first render we want to replace the given value with the normalized value
        this._value = normalizedValue;
        this.populateMenuData(this.parentItem);
        this._isInitialized = true;
    }

    /**
     * Callback from the store for changes in store.
     */
    handleStoreChange = () => {
        this.populateMenuData();
    };

    populateParamTypes = () => {
        this.paramTypes = getRHSTypes(this.propertyEditorElementType,
            this.elementParam, RULE_OPERATOR.ASSIGN, OutputResourcePicker.RULES);
        return this.paramTypes;
    };

    populateMenuData = (parentItem) => {
        const showNewResource = true;
        if (this._baseResourcePicker) {
            this._baseResourcePicker.setMenuData(
                getMenuData(this.elementConfig, this.propertyEditorElementType, this.populateParamTypes, false,
                    this.enableFieldDrilldown, storeInstance, showNewResource, parentItem));
        }
    }

    /**
     * This function handles any identifier that may be passed to the picker,
     * such as GUIDs for flow elements, and returns what the
     * the expression builder will need to use to work with that.
     *
     * @param {String} identifier    Used to identify the value (e.g. GUID for flow elements)
     * @returns normalizedValue      value to pass to the combobox
     */
    normalizeValue = (identifier) => {
        let normalizedValue;
        const flowElement = getResourceByUniqueIdentifier(identifier);
        if (flowElement) {
            const fieldName = sanitizeGuid(identifier).fieldName;
            if (fieldName) {
                const sobject = flowElement.objectType;
                const fields =  sobjectLib.getFieldsForEntity(sobject);
                const field = fields[fieldName];
                field.isCollection = false;
                const fieldParent = mutateFlowResourceToComboboxShape(flowElement);
                normalizedValue = mutateFieldToComboboxShape(field, fieldParent, true, true);
            } else {
                normalizedValue = mutateFlowResourceToComboboxShape(flowElement);
            }
        } else {
            // Pass in identifier as string in the default case
            normalizedValue = identifier;
        }
        return normalizedValue;
    };
}