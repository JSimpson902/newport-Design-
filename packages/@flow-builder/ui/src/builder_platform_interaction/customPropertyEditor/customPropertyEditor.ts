import {
    BuilderContext,
    ConfigurationEditorParameters,
    createConfigurationEditor,
    ElementInfo
} from 'builder_platform_interaction/customPropertyEditorLib';
import { ElementOrComponentError } from 'builder_platform_interaction/dataMutationLib';
import { loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { api, LightningElement, track, unwrap } from 'lwc';
import { LABELS } from './customPropertyEditorLabels';

const { logPerfTransactionStart, logPerfTransactionEnd } = loggingUtils;
const CONFIGURATION_EDITOR_SELECTOR = '.configuration-editor';
const CUSTOM_PROPERTY_EDITOR = 'CUSTOM_PROPERTY_EDITOR';

export default class CustomPropertyEditor extends LightningElement {
    labels = LABELS;

    /** Private variables */
    _isComponentCreated = false;
    _elementInfo: ElementInfo = {};
    _builderContext: BuilderContext = {
        variables: [],
        constants: [],
        textTemplates: [],
        stages: [],
        screens: [],
        recordUpdates: [],
        recordLookups: [],
        recordDeletes: [],
        recordCreates: [],
        formulas: [],
        apexPluginCalls: [],
        actionCalls: [],
        loops: [],
        start: undefined
    };
    _inputVariables = [];
    _automaticOutputVariables = {};
    _genericTypeMappings = [];
    _unrenderFn;
    _createComponentErrors: ElementOrComponentError[] = [];

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

    get elementInfo(): ElementInfo {
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

    get builderContext(): BuilderContext {
        return this._builderContext;
    }

    @api
    set automaticOutputVariables(variables) {
        this._automaticOutputVariables = variables;
    }

    get automaticOutputVariables() {
        return this._automaticOutputVariables;
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
    configurationEditorAllInputVariables = [];

    @api
    set configurationEditorTypeMappings(genericTypeMappings) {
        this._genericTypeMappings = genericTypeMappings ? unwrap(genericTypeMappings) : [];
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.genericTypeMappings = this._genericTypeMappings;
            }
        }
    }

    get configurationEditorTypeMappings() {
        return this._genericTypeMappings;
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
            .map((errorString) => ({
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
        logPerfTransactionStart(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`, null, null);
        const container = this.template.querySelector(CONFIGURATION_EDITOR_SELECTOR) as any;
        this.configurationEditorLoading = true;

        const successCallback = () => {
            this._isComponentCreated = true;
            this.configurationEditorLoading = false;
            // End the instrumentation
            logPerfTransactionEnd(
                `${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`,
                {
                    isSuccess: true
                },
                null
            );
        };

        const errorCallback = (err: string) => {
            this.configurationEditorLoading = false;
            logPerfTransactionEnd(
                `${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`,
                {
                    isSuccess: false
                },
                null
            );

            this._createComponentErrors = [
                {
                    key: CUSTOM_PROPERTY_EDITOR,
                    errorString: err
                }
            ];
        };

        const cmpName = this.configurationEditor.name;

        const params: ConfigurationEditorParameters = {
            cmpName,
            container,
            successCallback,
            errorCallback,
            attr: {
                elementInfo: this.elementInfo,
                builderContext: this.builderContext,
                inputVariables: this.configurationEditorInputVariables,
                genericTypeMappings: this.configurationEditorTypeMappings,
                automaticOutputVariables: this.automaticOutputVariables,
                allInputVariables: this.configurationEditorAllInputVariables
            }
        };
        this._unrenderFn = createConfigurationEditor(params);
    };

    /**
     * @returns the template of configuration editor
     * @memberof CustomPropertyEditor
     */
    getConfigurationEditorTemplate = () => {
        const configurationEditorTemplate = this.template.querySelector(CONFIGURATION_EDITOR_SELECTOR);

        return (configurationEditorTemplate && configurationEditorTemplate.firstChild) as any;
    };
}
