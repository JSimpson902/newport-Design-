import { isUnchangedProperty } from 'builder_platform_interaction/builderUtils';
import CustomPropertyEditor from 'builder_platform_interaction/customPropertyEditor';
import { ConfigurationEditor } from 'builder_platform_interaction/customPropertyEditorLib';
import { ElementOrComponentError, getErrorsFromHydratedElement } from 'builder_platform_interaction/dataMutationLib';
import { UpdateNodeEvent } from 'builder_platform_interaction/events';
import { updateAndValidateElementInPropertyEditor } from 'builder_platform_interaction/validation';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { api, LightningElement, track } from 'lwc';

/**
 * Base class for panel based property editors
 */

const CUSTOM_PROPERTY_EDITOR_SELECTOR = 'builder_platform_interaction-custom-property-editor';
export default abstract class PanelBasedPropertyEditor<T> extends LightningElement {
    /* State object of the element being edited in the property editor */
    @track
    element;

    /* reducer function for the given element's property editor; make sure to set this in your property editor implementation */
    reducer: UI.Reducer<T>;

    /* black listed fields to not have their errors removed when new; set this in your property editor implementation if needed */
    elementBlackListFields: string[] = [];

    /* CPE info */
    configurationEditor: ConfigurationEditor | undefined;

    @api
    mode: string | undefined;

    @api
    processType: string | undefined;

    _editorParams: UI.PropertyEditorParameters = {};

    /* Override this in your property editor implementation if you need custom logic executed to get editor params */
    getEditorParams(): UI.PropertyEditorParameters {
        return this._editorParams;
    }

    @api
    get editorParams() {
        return this.getEditorParams();
    }

    set editorParams(newValue: UI.PropertyEditorParameters) {
        this._editorParams = newValue;
    }

    constructor(reducer: UI.Reducer<T>) {
        super();
        this.reducer = reducer;
    }

    @api
    get node() {
        return this.element;
    }

    set node(newValue) {
        const oldElement = this.element;
        this.element = newValue;
        this.element = updateAndValidateElementInPropertyEditor(
            oldElement,
            newValue,
            this,
            this.elementBlackListFields
        );

        this.onSetNode();
    }

    /* Override this in your property editor implementation if you need additional logic executed on set node() */
    onSetNode() {}

    /**
     * public api function to return the node
     *
     * @returns the element
     */
    @api getNode() {
        return this.element;
    }

    /**
     *  @returns Whether a CPE has been defined for the current property editor
     */
    get hasConfigurationEditor(): boolean {
        return !!this.configurationEditor?.name;
    }

    /* Override this in your property editor implementation if you need a custom validation event */
    getValidateEvent(): CustomEvent<object> {
        return new CustomEvent(VALIDATE_ALL);
    }

    /**
     * public api function to run validation defined on the property editor
     *
     * @returns list of errors
     */
    @api validate(): ElementOrComponentError[] {
        let errors: ElementOrComponentError[] = [];

        // validate the cpe editor
        const editor = this.template.querySelector(CUSTOM_PROPERTY_EDITOR_SELECTOR) as unknown as CustomPropertyEditor;
        if (editor) {
            errors = editor.validate();
        }
        const event = this.getValidateEvent();
        this.element = this.reducer(this.element, event);
        const standardPropertyEditorErrors = getErrorsFromHydratedElement(this.element);
        errors = [...errors, ...standardPropertyEditorErrors];
        return errors;
    }

    /**
     * Helper function to to handle simple component updates
     *
     * @param event reducer event type
     */
    handleValueChanged(event) {
        event.stopPropagation();
        this.updateElement(event);
    }

    /**
     * Helper function to call the reducer and fire the update node event on the element being edited in the property editor
     *
     * @param event reducer event type
     */
    updateElement(event) {
        const hasUpdatedProperty = !isUnchangedProperty(this.element, event);
        this.element = this.reducer(this.element, event);
        if (hasUpdatedProperty) {
            this.dispatchEvent(new UpdateNodeEvent(this.element));
        }
    }
}
