// @ts-nocheck
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { filterFieldsForChosenElement } from 'builder_platform_interaction/expressionUtils';
import { isLookupTraversalSupported } from 'builder_platform_interaction/mergeFieldLib';
import { Store } from 'builder_platform_interaction/storeLib';
import { getTriggerType } from 'builder_platform_interaction/storeUtils';
import { api, LightningElement, track } from 'lwc';

export default class FieldPicker extends LightningElement {
    @track
    state = {
        fields: null,
        value: ''
    };

    @api
    required = false;

    @api
    disabled;

    @api
    label;

    @api
    placeholder;

    @api
    errorMessage;

    @api
    showActivityIndicator = false;

    /**
     * The inner base resource picker component, used to set the full menu data
     *
     * @type {BaseResourcePicker}
     */
    _baseResourcePicker;

    /**
     * True if the field picker has been initialized, false by default
     *
     * @type {boolean}
     */
    _isInitialized = false;

    /**
     * @param {string} newValue the selected queried field
     */
    set value(newValue) {
        this.state.value = newValue;
    }

    @api
    get value() {
        return this.state.value;
    }

    /**
     * @param {Object} newFields map of the queriedFields from recordNode.queriedFields
     */
    set fields(newFields) {
        if (newFields) {
            this.state.fields = newFields;
            this.populateFieldMenuData();
        }
    }

    @api
    get fields() {
        return this.state.fields;
    }

    /**
     * create the combobox config
     */
    get comboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.label,
            this.placeholder,
            undefined, // passing error message through template
            false,
            this.required,
            this.disabled
        );
    }

    get enableLookupTraversal() {
        return this.isLookupTraversalSupported();
    }

    renderedCallback() {
        if (!this._isInitialized) {
            this._baseResourcePicker = this.template.querySelector(BaseResourcePicker.SELECTOR);
            this._isInitialized = true;

            if (this.fields) {
                this.populateFieldMenuData();
            }
        }
    }

    isLookupTraversalSupported() {
        return isLookupTraversalSupported(Store.getStore().getCurrentState().properties.processType, getTriggerType());
    }

    /**
     * Populates the field menu data for the selected entity
     * Uses the BaseResourcePicker instance to set the full menu data
     */
    populateFieldMenuData() {
        if (this._baseResourcePicker) {
            this._baseResourcePicker.setMenuData(
                filterFieldsForChosenElement(null, this.fields, {
                    showAsFieldReference: false,
                    showSubText: true,
                    allowSObjectFieldsTraversal: this.isLookupTraversalSupported()
                })
            );
        }
    }
}
