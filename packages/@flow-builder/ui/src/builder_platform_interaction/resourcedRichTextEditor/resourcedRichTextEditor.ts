// @ts-nocheck
import { LightningElement, api, track } from 'lwc';
import { booleanAttributeValue } from 'builder_platform_interaction/screenEditorUtils';
import { validateTextWithMergeFields } from 'builder_platform_interaction/mergeFieldLib';
import { LABELS } from './resourcedRichTextEditorLabels';
import { convertHTMLToQuillHTML } from './richTextConverter';
import { LIGHTNING_INPUT_VARIANTS } from 'builder_platform_interaction/screenEditorUtils';
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { getOrgId } from 'builder_platform_interaction/contextLib';

// all formats except 'strike' and 'video'
const RTE_FORMATS = [
    'table',
    'background',
    'bold',
    'color',
    'font',
    'code',
    'italic',
    'link',
    'size',
    'script',
    'underline',
    'blockquote',
    'header',
    'indent',
    'list',
    'align',
    'direction',
    'code-block',
    'clean',
    'image'
];

const SELECTORS = {
    INPUT_RICH_TEXT: 'lightning-input-rich-text',
    FEROV_RESOURCE_PICKER: 'builder_platform_interaction-ferov-resource-picker',
    INPUT_RICH_TEXT_UPLOAD_IMG_BUTTON: '.slds-button.slds-button_icon-border-filled.ql-image'
};

/**
 * Rich text editor with a combobox to insert a resource. This component supports all quill formats except 'video'.
 */
export default class ResourcedRichTextEditor extends LightningElement {
    @api
    rowIndex;

    @api
    label;

    @api
    editorParams;

    @api
    helpText;

    @api
    required = false;

    @api
    showGlobalVariables = false;
    // does support or not the plain text mode?
    @api
    plainTextAvailable = false;

    // IMPORTANT: For new resource to work, the containing property editor must have newResourcesCallback included
    // in the call to invokePropertyEditor in editor.js
    @api
    hideNewResource = false;

    @track
    state = {
        value: '',
        error: null,
        isPlainTextMode: false
    };

    labels = LABELS;
    hydrated = false;
    isHTMLSanitized = false;
    initialized = false;

    resourceComboBoxConfig = BaseResourcePicker.getComboboxConfig(
        LABELS.resourcePickerTitle, // Label
        LABELS.resourcePickerPlaceholder, // Placeholder
        null, // errorMessage
        false, // literalsAllowed
        false, // required
        false, // disabled
        'String', // type
        true, // enableFieldDrilldown
        undefined, // allowSObjectFields
        LIGHTNING_INPUT_VARIANTS.LABEL_HIDDEN // variant
    );

    elementConfig = {
        elementType: ELEMENT_TYPE.SCREEN
    };

    get isRequired() {
        return booleanAttributeValue(this, 'required');
    }

    get formats() {
        return RTE_FORMATS;
    }

    /**
     * True if editor in plain text mode, false otherwise for rich text mode
     * @returns {boolean} true if editor in plain text mode, false otherwise for rich text mode
     */
    @api
    get isPlainTextMode() {
        return this.state.isPlainTextMode;
    }

    /**
     * Set editor plain text mode
     * @param {boolean} val - true to switch to plain text, false to switch to rich text mode
     */
    set isPlainTextMode(val) {
        this.state.isPlainTextMode = val;
    }

    @api
    get value() {
        return this.hydrated ? { value: this.state.value, error: this.state.error } : this.state.value;
    }

    set value(val) {
        this.hydrated = val && val.hasOwnProperty('value') && val.hasOwnProperty('error');

        if (this.hydrated) {
            this.state.value = val.value;
            this.state.error = val.error;
        } else {
            this.state.value = val;
        }
    }

    get inputRichTextValue() {
        // Replacing new line with <br /> tag as done at runtime (see _createOutput in factory.js)
        // if html is sanitized, this has already been done
        if (this.state.value != null && !this.isHTMLSanitized) {
            return this.replaceNewLinesWithBrTags(this.state.value);
        }
        return this.state.value;
    }

    get classList() {
        return 'container slds-grid slds-grid_vertical' + (this.state.error ? ' has-error' : '');
    }

    /**
     * Depending on the plain text mode support change via CSS the width of the resource picker
     * to allow mode selection button menu if needed
     */
    get computedDivResourcePickerClass() {
        return this.plainTextAvailable ? 'divResourcePickerPartialWidth' : 'divResourcePickerFulllWidth';
    }

    get orgId() {
        return getOrgId();
    }

    // Replace new line with <br /> tag as done at runtime (see _createOutput in factory.js)
    replaceNewLinesWithBrTags(value) {
        return value.replace(/\n/g, '<br />');
    }

    handleChangeEvent(event) {
        event.stopPropagation();
        const { value } = event.detail;
        const errors = this.validateMergeFields(value);
        const error = errors.length > 0 ? errors[0].message : null;
        this.fireChangeEvent(value, error);
    }

    handleFocusEvent() {
        if (!this.isHTMLSanitized) {
            this.isHTMLSanitized = true;
            let { value } = this.state;
            if (value != null && value !== '') {
                // we replace new line with <br /> tag as done at runtime
                value = this.replaceNewLinesWithBrTags(value);
                value = convertHTMLToQuillHTML(value);
                const errors = this.validateMergeFields(value);
                const error = errors.length > 0 ? errors[0].message : null;
                if (value !== this.state.value || error !== this.state.error) {
                    this.fireChangeEvent(value, error);
                }
            }
        }
    }

    handleBlurEvent() {
        this.dispatchEvent(new CustomEvent('blur'));
    }

    validateMergeFields(textWithMergeFields) {
        const options = {
            allowGlobalConstants: false,
            allowCollectionVariables: true
        };
        const errors = validateTextWithMergeFields(textWithMergeFields, options);
        return errors;
    }

    fireChangeEvent(value, error) {
        const event = new CustomEvent('change', {
            detail: { value, error },
            cancelable: true,
            composed: true,
            bubbles: true
        });
        this.dispatchEvent(event);
    }

    handleResourcePickerFocusout() {
        Promise.resolve().then(() => {
            const ferovResourcePicker = this.template.querySelector(SELECTORS.FEROV_RESOURCE_PICKER);
            ferovResourcePicker.value = null;
            ferovResourcePicker.errorMessage = null;
        });
    }

    handleResourcePickerSelection(event) {
        event.stopPropagation();
        if (event && event.detail && event.detail.item) {
            const text = event.detail.item.displayText;
            if (text) {
                const inputRichText = this.template.querySelector(SELECTORS.INPUT_RICH_TEXT);
                inputRichText.insertTextAtCursor(text);
                inputRichText.focus();
            }
        }
    }

    renderedCallback() {
        if (!this.state.isPlainTextMode) {
            if (!this.initialized) {
                // Temp "BETA" tooltip addition for lightning rich text input upload img button
                const inputRichText = this.template.querySelector(SELECTORS.INPUT_RICH_TEXT);
                if (inputRichText && inputRichText.shadowRoot) {
                    const uploadImgBtn = inputRichText.shadowRoot.querySelector(
                        SELECTORS.INPUT_RICH_TEXT_UPLOAD_IMG_BUTTON
                    );
                    if (uploadImgBtn) {
                        uploadImgBtn.title = LABELS.richTextInputUploadImgBtnBetaTitle;
                    }
                }
                this.initialized = true;
            }
        } else {
            this.initialized = false;
        }
    }
}
