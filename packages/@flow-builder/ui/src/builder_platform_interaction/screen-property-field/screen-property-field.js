import { Element, api } from 'engine';
import { PropertyChangedEvent } from 'builder_platform_interaction-events';
import { isItemHydratedWithErrors } from 'builder_platform_interaction-data-mutation-lib';
import { LABELS } from 'builder_platform_interaction-screen-editor-i18n-utils';

// QUILL supported formats
const rteFormats = ['abbr', 'address', 'align', 'alt', 'background', 'bdo', 'big', 'blockquote', 'bold', 'cite', 'clean', 'code', 'code-block', 'color', 'data-fileid', 'del', 'dfn', 'direction', 'divider', 'dl', 'dd', 'dt', 'font', 'header', 'image', 'indent', 'ins', 'italic', 'kbd', 'link', 'list', 'q', 'samp', 'script', 'size', 'small', 'strike', 'sup', 'table', 'tt', 'underline', 'var'];

/*
 * A property editor
 */
export default class ScreenPropertyField extends Element {
    @api name;
    @api label;
    @api type;
    @api value;
    @api required =  false;
    @api readOnly = false;
    @api helpText;

    labels = LABELS;

    @api get formats() {
        return rteFormats;
    }

    @api set formats(value) {
        throw new Error('You cannot change rich text editor formats');
    }

    get classList() {
        return this.value.error ? 'property-input slds-has-error' : 'property-input';
    }

    get showLabel() {
        return this.label && !this.isBoolean;
    }

    get isRequired() {
        return this.required && (this.required === 'true' || this.required === 'required');
    }

    get isChecked() {
        return this.isBoolean && (this.value === 'true' || this.value ===  true);
    }

    get isString() {
        return this.type === 'string';
    }

    get isLongString() {
        return this.type === 'long_string';
    }

    get isRichString() {
        return this.type === 'rich_string';
    }

    get isBoolean() {
        return this.type === 'boolean';
    }

    get isNumber() {
        return this.type === 'number';
    }

    get isInput() {
        return !this.isLongString && !this.isRichString;
    }

    get inputType() {
        if (this.isNumber) {
            return 'number';
        } else if (this.isBoolean) {
            return 'checkbox';
        }

        return 'text';
    }

    get domValue() {
        const input = this.template.querySelector('.property-input');
        if (this.isString || this.isLongString || this.isRichString) {
            return input.value;
        } else if (this.isBoolean) {
            return input.checked;
        } else if (this.isNumber) {
            return input.value;
        }

        throw new Error('Unknown type for property field ' + this.type);
    }

    get dehydratedValue() {
        return isItemHydratedWithErrors(this.value) ? this.value.value : this.value;
    }

    handleEvent = () => {
        const newValue = this.domValue;
        if (this.dehydratedValue !== newValue) {
            this.dispatchEvent(new PropertyChangedEvent(this.name, newValue, null, null, this.value));
        }
    }
}
