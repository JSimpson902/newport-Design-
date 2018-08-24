import { LightningElement, api } from 'lwc';
import { PropertyChangedEvent } from 'builder_platform_interaction-events';
import { LABELS } from 'builder_platform_interaction-screen-editor-i18n-utils';
import BaseResourcePicker from 'builder_platform_interaction-base-resource-picker';
import { LIGHTNING_INPUT_VARIANTS } from 'builder_platform_interaction-screen-editor-utils';

const ALL_SECTION_NAMES = ['validationOptions', 'helpText'];

/*
 * Screen element property editor for the text area field.
 */
export default class ScreenTextareaFieldPropertiesEditor extends LightningElement {
    @api field;

    labels = LABELS;

    get allSectionNames() {
        return ALL_SECTION_NAMES;
    }

    handlePropertyChanged = (event) => {
        const property = event.detail.propertyName;
        const newValue = event.detail.value;
        const error = event.detail.error;
        this.dispatchEvent(new PropertyChangedEvent(property, newValue, error, this.field.guid, this.field[property]));
        event.stopPropagation();
    }

    /* Handle change of Default Value resource picker */
    handleDefaultValueChanged(event) {
        const property = 'defaultValue';
        this.dispatchEvent(new PropertyChangedEvent(property, event.detail.value, event.detail.error, this.field.guid, this.field[property]));
        event.stopPropagation();
    }

    /* Figure out if the value really changed, and if it did refire the event including the old value */
    handleErrorMessageChanged = (event) => {
        const validationProp = 'validationRule';
        const property = event.detail.propertyName;
        const newValue = event.detail.value;
        const error = event.detail.error;
        const currentValue = property && this.field[validationProp] && this.field[validationProp].errorMessage && this.field[validationProp].errorMessage.value;
        if (currentValue !== newValue) {
            this.dispatchEvent(new PropertyChangedEvent(property, newValue, error, this.field.guid, this.field[validationProp].errorMessage));
        }
        event.stopPropagation();
    }

    get resourceComboBoxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            LABELS.fieldDefaultValue, // Label
            LABELS.resourcePickerPlaceholder, // Placeholder
            null, // errorMessage
            true, // literalsAllowed
            false, // required
            false, // disabled
            this.field.dataType, // type
            LIGHTNING_INPUT_VARIANTS.STANDARD); // variant
    }

    get validationRuleError() {
        return this.field.validationRule ? this.field.validationRule.errorMessage : null;
    }

    get validationRuleFormula() {
        return this.field.validationRule ? this.field.validationRule.formulaExpression : null;
    }

    get helpTextValue() {
        return this.field.helpText && this.field.helpText.value ? this.field.helpText : null;
    }
}