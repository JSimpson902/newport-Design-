import { api, LightningElement, unwrap } from 'lwc';
import { createConfigurationEditor } from 'builder_platform_interaction/builderUtils';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { logPerfTransactionStart, logPerfTransactionEnd } from 'builder_platform_interaction/loggingUtils';

const CONFIGURATION_EDITOR_SELECTOR = '.configuration-editor';
const CUSTOM_PROPERTY_EDITOR = 'CUSTOM_PROPERTY_EDITOR';

export default class CustomPropertyEditor extends LightningElement {
    /** Private variables */
    _id = generateGuid();
    _isComponentCreated = false;
    _property = [];
    _flowContext = {};
    _values = [];
    _unrenderFn;
    _createComponentErrors = [];

    /** Public properties */
    @api
    configurationEditor;

    @api
    set flowContext(context) {
        this._flowContext = context ? unwrap(context) : {};
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.flowContext = this._flowContext;
            }
        }
    }

    get flowContext() {
        return this._flowContext;
    }

    @api
    set configurationEditorProperties(properties) {
        this._property = properties ? unwrap(properties) : [];
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.property = this._property;
            }
        }
    }

    get configurationEditorProperties() {
        return this._property;
    }

    @api
    set configurationEditorValues(values) {
        this._values = values ? unwrap(values) : [];
        if (this._isComponentCreated) {
            const configurationEditorTemplate = this.getConfigurationEditorTemplate();
            if (configurationEditorTemplate) {
                configurationEditorTemplate.values = this._values;
            }
        }
    }

    get configurationEditorValues() {
        return this._values;
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
        return errors.map(errorString => ({
                key: CUSTOM_PROPERTY_EDITOR,
                errorString
            })).concat(this._createComponentErrors);
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
        return !this._isComponentCreated && this.configurationEditor && !this.hasErrors;
    }

    /**
     * Creates custom property editor and set the unrender function in a private variable
     *
     * @memberof CustomPropertyEditor
     */
    createComponent = () => {
        logPerfTransactionStart(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`);
        const container = this.template.querySelector(
            CONFIGURATION_EDITOR_SELECTOR
        );

        const successCallback = () => {
            // End the instrumentation
            this._isComponentCreated = true;
            logPerfTransactionEnd(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`, {
                isSuccess: true
            });
        };

        const errorCallback = () => {
            logPerfTransactionEnd(`${CUSTOM_PROPERTY_EDITOR}-${this.configurationEditor.name}`, {
                isSuccess: false
            });
            this._createComponentErrors = [{
                key: CUSTOM_PROPERTY_EDITOR,
                errorString: 'unable to create the component'
            }];
            throw new Error('unable to create the component');
        };

        const cmpName = this.configurationEditor.name;

        const params = {
            cmpName,
            container,
            successCallback,
            errorCallback,
            attr: {
                flowContext: this.flowContext,
                id: this._id,
                property: this.configurationEditorProperties,
                values: this.configurationEditorValues
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
    }
}
