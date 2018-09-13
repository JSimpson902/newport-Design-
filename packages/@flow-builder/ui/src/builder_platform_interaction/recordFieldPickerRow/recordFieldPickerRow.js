import { LightningElement, api, track } from 'lwc';
import { LABELS } from "./recordFieldPickerRowLabels";
import { getFieldsMenuData } from "builder_platform_interaction/expressionUtils";
import BaseResourcePicker from "builder_platform_interaction/baseResourcePicker";
import {
    UpdateRecordLookupFieldEvent,
} from "builder_platform_interaction/events";

const resourcePickerSelector = 'builder_platform_interaction-base-resource-picker';
const ID_FIELD = 'Id';

/**
 * a combobox to retrieve a list of deduped fields to prevent selection of the same field twice.
 */
export default class RecordFieldPickerRow extends LightningElement {
    labels = LABELS;
    @track
    state = {
        queriedFields: [],
        recordEntityName: '',
        value: '',
    };

    @api
    fieldIndex;

    @api
    errorMessage;

    /**
     * The inner base resource picker component, used to set the full menu data
     * @type {BaseResourcePicker}
     */
    _baseResourcePicker;

    /**
     * True if the field picker has been initialized, false by default
     * @type {Boolean}
     */
    _isInitialized = false;

    /**
     * @param {String} value the record entity name
     */
    set recordEntityName(value) {
        this.state.recordEntityName = value;
    }

    @api
    get recordEntityName() {
        return this.state.recordEntityName;
    }

    /**
     * @param {String} value the selected queried field
     */
    set value(value) {
        this.state.value = value;
    }

    @api
    get value() {
        return this.state.value;
    }

    /**
     * @param {String[]} fields the queriedFields from recordNode.queriedFields
     */
    set queriedFields(fields) {
        this.state.queriedFields = fields.map(field => {
            return field.field.value;
        });
        this.populateFieldMenuData();
    }

    @api
    get queriedFields() {
        return this.state.queriedFields;
    }

    get isIdField() {
        return this.state.value === ID_FIELD;
    }

    /**
     * TODO: should be always true when W-4822361 is implemented
     */
    get showDelete() {
        return this.state.queriedFields.length > 2;
    }

    /**
     * create the combobox config
     */
    get fieldComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.field,
            this.labels.getFieldPlaceholder,
            null, // Error message in the config is not used anymore by the base-resource-picker
            'false',
            false,
            false,
            'String',
        );
    }

    renderedCallback() {
        if (!this._isInitialized) {
            this._baseResourcePicker = this.template.querySelector(resourcePickerSelector);
            this.populateFieldMenuData();
        }
    }

    /**
     * Populates the field menu data for the selected entity
     * Uses the BaseResourcePicker instance to set the full menu data
     */
    populateFieldMenuData() {
        if (this._baseResourcePicker) {
            const excludedFields = this.state.queriedFields.filter((field) => field !== this.state.value);
            if (!excludedFields.includes(ID_FIELD)) {
                excludedFields.push(ID_FIELD);
            }
            getFieldsMenuData(this.state.recordEntityName, excludedFields, menuData => {
                this._fullEntityMenuData = menuData;
                this._baseResourcePicker.setMenuData(this._fullEntityMenuData);
                this._isInitialized = true;
            });
        }
    }

    /**
     * handle field changed
     * @param {Object} event the comboboxstatechanged event
     */
    handleFieldChanged(event) {
        event.stopPropagation();
        const updateFieldEvent = new UpdateRecordLookupFieldEvent(this.fieldIndex, (event.detail.item) ? event.detail.item.value : event.detail.displayText, event.detail.error);
        this.dispatchEvent(updateFieldEvent);
    }
}
