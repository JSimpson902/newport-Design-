import { Element, api } from 'engine';
import { PropertyChangedEvent } from 'builder_platform_interaction-events';
import { LABELS } from 'builder_platform_interaction-screen-editor-i18n-utils';
import BaseResourcePicker from 'builder_platform_interaction-base-resource-picker';
import { LIGHTNING_INPUT_VARIANTS, getFlowDataTypeByName } from 'builder_platform_interaction-screen-editor-utils';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';

/*
 * Screen element property editor for the text area field.
 */
export default class ScreenTextareaFieldPropertiesEditor extends Element {
    @api field;

    labels = LABELS;

    /* Figure out if the value really changed, and if it did refire the event including the old value */
    handlePropertyChanged = (event) => {
        const property = event.detail.propertyName;
        const newValue = event.detail.value;
        const error = event.detail.error;
        this.dispatchEvent(new PropertyChangedEvent(property, newValue, error, this.field.guid, this.field[property]));
        event.stopPropagation();
    }

    /* Handle change of Label combobox */
    handleInputLabelChanged(event) {
        const property = 'fieldText';
        this.dispatchEvent(new PropertyChangedEvent(property, event.detail.displayText, event.detail.error, this.field.guid, this.field[property]));
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

    get elementParam() {
        const param = {
            dataType: getFlowDataTypeByName(this.field.dataType),
            collection: false,
            elementType: ELEMENT_TYPE.SCREEN
        };
        return param;
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

    get fieldLabel() {
        return this.field.fieldText ? this.field.fieldText.value : null;
    }

    get validationRuleError() {
        return this.field.validationRule ? this.field.validationRule.errorMessage : null;
    }

    get validationRuleFormula() {
        return this.field.validationRule ? this.field.validationRule.formulaExpression : null;
    }
}