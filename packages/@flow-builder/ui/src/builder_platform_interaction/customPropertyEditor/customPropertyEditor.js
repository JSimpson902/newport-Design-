// @ts-nocheck
import { api, LightningElement, unwrap, track } from 'lwc';
import { createConfigurationEditor } from 'builder_platform_interaction/builderUtils';
import { LABELS } from './customPropertyEditorLabels';
import { logPerfTransactionStart, logPerfTransactionEnd } from 'builder_platform_interaction/loggingUtils';

const CONFIGURATION_EDITOR_SELECTOR = '.configuration-editor';
const CUSTOM_PROPERTY_EDITOR = 'CUSTOM_PROPERTY_EDITOR';

export default class CustomPropertyEditor extends LightningElement {
    labels = LABELS;

    /** Private variables */
    _isComponentCreated = false;
    _elementInfo = {};
    _builderContext = {};
    _inputVariables = [];
    _typeMappings = [];
    _unrenderFn;
    _createComponentErrors = [];

    /** Private properties */
    @track
    configurationEditorLoading = false;

    /** Public properties */
    @api
    configurationEditor;

    @api
    editorParams;

    @api
    set elementInfo(info) {
        this._elementInfo = info ? unwrap(info) : {};
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.elementInfo = this._elementInfo;
            }
        }
    }

    get elementInfo() {
        return this._elementInfo;
    }

    @api
    set builderContext(context) {
        this._builderContext = context ? unwrap(context) : {};
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.builderContext = this._builderContext;
            }
        }
    }

    get builderContext() {
        return this._builderContext;
    }

    @api
    set configurationEditorInputVariables(inputVariables) {
        this._inputVariables = inputVariables ? unwrap(inputVariables) : [];
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.inputVariables = this._inputVariables;
            }
        }
    }

    get configurationEditorInputVariables() {
        return this._inputVariables;
    }

    @api
    set configurationEditorTypeMappings(typeMappings) {
        this._typeMappings = typeMappings ? unwrap(typeMappings) : [];
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.typeMappings = this._typeMappings;
            }
        }
    }

    get configurationEditorTypeMappings() {
        return this._typeMappings;
    }

    /** Public methods */

    @api validate() {
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate && configurationEditorTemplate.validate) {
                return [...configurationEditorTemplate.validate()];
            }
        }
        return this.errors;
    }

    /** Getters */

    /**
     * Show a spinner indicator for CPE component when it makes a server call to retrieve the resources for dynamic creation.
     * When there are errors exist for the component shouldn't show the spinner, instead show the error message directly.
     */
    get showSpinner() {
        return this.configurationEditorLoading && !this.hasErrors;
    }

    /**
     * Check if there is any server side error or not in configuration editor
     *
     * @readonly
     * @memberof CustomPropertyEditor
     */
    get hasErrors() {
        const errors = this.configurationEditor && this.configurationEditor.errors;
        if ((errors && errors.length > 0) || this._createComponentErrors.length > 0) {
            return true;
        }
        return false;
    }

    get errors() {
        const errors = (this.configurationEditor && this.configurationEditor.errors) || [];
        return errors
            .map(errorString => ({
                key: CUSTOM_PROPERTY_EDITOR,
                errorString
            }))
            .concat(this._createComponentErrors);
    }

    /** Lifecycle hooks */

    renderedCallback() {
        // Dynamically creating the component for the first time
        if (this.shouldCreateComponent()) {
            this.createComponent();
        }
    }

    disconnectedCallback() {
        if (this._unrenderFn) {
            this._unrenderFn();
            this._isComponentCreated = false;
        }
    }

    /** Private methods */

    /**
     * Check if configuration editor should be created or not.
     *
     * It depends on whether configuration editor is defined or not, there are no errors and configuration editor is not already created.
     *
     * @memberof CustomPropertyEditor
     */
    shouldCreateComponent = () => {
        return (
            !this._isComponentCreated && this.configurationEditor && !this.hasErrors && !this.configurationEditorLoading
        );
    };

    /**
     * Creates custom property editor and set the unrender function in a private variable.
     *
     * @memberof CustomPropertyEditor
     */
    createComponent = () => {
        logPerfTransactionStart(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`);
        const container = this.template.querySelector(CONFIGURATION_EDITOR_SELECTOR);
        this.configurationEditorLoading = true;

        const successCallback = () => {
            this._isComponentCreated = true;
            this.configurationEditorLoading = false;
            // End the instrumentation
            logPerfTransactionEnd(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`, {
                isSuccess: true
            });
        };

        const errorCallback = err => {
            this.configurationEditorLoading = false;
            logPerfTransactionEnd(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`, {
                isSuccess: false
            });

            this._createComponentErrors = [
                {
                    key: CUSTOM_PROPERTY_EDITOR,
                    errorString: err
                }
            ];
        };

        const cmpName = this.configurationEditor.name;

        const params = {
            cmpName,
            container,
            successCallback,
            errorCallback,
            attr: {
                elementInfo: this.elementInfo,
                builderContext: this.builderContext,
                inputVariables: this.configurationEditorInputVariables,
                typeMappings: this.configurationEditorTypeMappings
            }
        };
        this._unrenderFn = createConfigurationEditor(params);
    };

    /**
     * Return the template of configuration editor
     *
     * @memberof CustomPropertyEditor
     */
    getConfigurationEditorTemplate = () => {
        const configurationEditorTemplate = this.template.querySelector(CONFIGURATION_EDITOR_SELECTOR);
        return configurationEditorTemplate && configurationEditorTemplate.firstChild;
    };
}
