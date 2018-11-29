import { LightningElement, api, track, unwrap } from 'lwc';
import { getErrorsFromHydratedElement } from "builder_platform_interaction/dataMutationLib";
import { VALIDATE_ALL } from "builder_platform_interaction/validationRules";
import { LABELS } from "./flowPropertiesEditorLabels";
import { flowPropertiesEditorReducer } from "./flowPropertiesEditorReducer";
import { format } from "builder_platform_interaction/commonUtils";
import { normalizeDateTime } from "builder_platform_interaction/dateTimeUtils";
import { SaveType } from "builder_platform_interaction/saveType";
import { getProcessTypesMenuData } from "builder_platform_interaction/expressionUtils";
import { PropertyChangedEvent } from "builder_platform_interaction/events";
/**
 * Flow Properties property editor for Flow Builder
 *
 * @ScrumTeam Process UI
 * @author Aniko van der Lee
 * @since 216
 */

export default class FlowPropertiesEditor extends LightningElement {
    @api
    get node() {
        return this.flowProperties;
    }

    set node(newValue) {
        this.flowProperties = unwrap(newValue);
        this._originalLabel = this.flowProperties.label.value;
        this._originalApiName = this.flowProperties.name.value;
        this._originalDescription = this.flowProperties.description.value;
        this._originalProcessType = this.flowProperties.processType.value;
        if (this.flowProperties.saveType === SaveType.NEW_DEFINITION) {
            this.clearForNewDefinition();
        }

        this.isAdvancedShown = this.flowProperties.saveType === SaveType.UPDATE;
    }

    /**
     * public api function to return the node
     * @returns {object} node - node
     */
    @api getNode() {
        return this.flowProperties;
    }

    /**
     * public api function to run the rules from flow properties validation library
     * @returns {object} list of errors
     */
    @api validate() {
        const event = { type: VALIDATE_ALL };
        this.flowProperties = flowPropertiesEditorReducer(this.flowProperties, event);
        const processTypeElement = this.template.querySelector('.process-type');
        if (this.flowProperties.processType && this.flowProperties.processType.error) {
            this.setElementErrorMessage(processTypeElement, this.flowProperties.processType.error);
        }
        return getErrorsFromHydratedElement(this.flowProperties);
    }

    /**
     * Internal state for the flow properties editor
     */
    @track
    flowProperties;

    @track
    isAdvancedShown = false;

    labels = LABELS;

    _processTypes = getProcessTypesMenuData();
    _originalLabel;
    _originalApiName;
    _originalDescription;
    _originalProcessType;

    saveAsTypeOptions = [
        { 'label': LABELS.saveAsNewVersionTypeLabel, 'value': SaveType.NEW_VERSION },
        { 'label': LABELS.saveAsNewFlowTypeLabel, 'value': SaveType.NEW_DEFINITION},
    ];

    /**
     * The value of the currently selected process type
     */
    get processType() {
        let retVal = null;
        if (this.flowProperties.processType) {
            retVal = this.flowProperties.processType.value;
        }
        return retVal;
    }

    /**
     * The label of the currently selected process type
     */
    get processTypeLabel() {
        let label = null;
        if (this.flowProperties.processType) {
            const processType = this._processTypes.find((pt) => {
                return pt.value === this.flowProperties.processType.value;
            });

            label = processType ? processType.label : null;
        }
        return label;
    }

    /**
     * Indicates whether we are saving an existing to an existing flow definition (updating or saving as new version)
     */
    get savingExistingFlow() {
        return this.node.saveType === SaveType.NEW_VERSION || this.node.saveType === SaveType.UPDATE;
    }

    get showSaveAsTypePicker() {
        let visible;
        switch (this.node.saveType) {
            case SaveType.NEW_VERSION:
                visible = true;
                break;
            case SaveType.NEW_DEFINITION:
                if (this.node.canOnlySaveAsNewDefinition) {
                    visible = false;
                } else {
                    visible = true;
                }
                break;
            default:
                visible = false;
                break;
        }
        return visible;
    }

    /**
     * Returns the process types
     * @returns {module:builder_platform_interaction/expressionUtils.MenuItem[]} Menu items representing allowed process types
     */
    get processTypes() {
        return this._processTypes;
    }

    /**
     * Returns the localized string representing the last saved info
     * E.g. something like: '1/1/2018 by Jane Smith'
     * @return {string}
     */
    get lastModifiedText() {
        // TODO: user is currently an id.  We need to get the user name.  will happen as part of this story
        return format(LABELS.lastModifiedText, this.flowProperties.lastModifiedBy.value, normalizeDateTime(this.flowProperties.lastModifiedDate.value, true));
    }

    /**
     * Sets custom validation for lightning element when 'Ok' button on the property editor is clicked
     * @param {object} element - element that needs custom validation
     * @param {string} error - Any existing error message
     */
    setElementErrorMessage(element, error) {
        if (element) {
            if (error) {
                element.setCustomValidity(error);
            } else {
                element.setCustomValidity('');
            }
            element.showHelpMessageIfInvalid();
        }
    }

    updateProperty(propName, newValue, error = null) {
        const propChangedEvent = new PropertyChangedEvent(
                propName,
                newValue,
                error);
        this.flowProperties = flowPropertiesEditorReducer(this.flowProperties, propChangedEvent);
    }

    /* ********************** */
    /*     Event handlers     */
    /* ********************** */

    /**
     * @param {object} event - property changed event coming from label-description component
     */
    handleEvent(event) {
        event.stopPropagation();
        this.flowProperties = flowPropertiesEditorReducer(this.flowProperties, event);
    }

    /**
     * @param {object} event - change event coming from the radio-group component displaying save as types
     */
    handleSaveAsTypeChange(event) {
        event.stopPropagation();
        this.flowProperties.saveType = event.detail.value;
        if (this.flowProperties.saveType === SaveType.NEW_VERSION) {
            // If switching from new flow to new version then restore the original name, label, description and processtype
            this.updateProperty('label', this._originalLabel);
            this.updateProperty('name', this._originalApiName);
            this.updateProperty('description', this._originalDescription);
            this.updateProperty('processType', this._originalProcessType);
        } else {
            this.clearForNewDefinition();
        }
    }

    clearForNewDefinition() {
        // If switching from new version to new flow, clear out label, name and description
        this.updateProperty('label', '');
        this.updateProperty('name', '');
        this.updateProperty('description', '');
    }

    /**
     * @param {object} event - change event coming from the lightning-combobox component displaying process types
     */
    handleProcessTypeChange(event) {
        event.stopPropagation();
        this.updateProperty('processType', event.detail.value);
    }

    handleAdvancedToggle(event) {
        event.stopPropagation();
        this.isAdvancedShown = !this.isAdvancedShown;
    }

    handleInstanceLabelChanged(event) {
        event.stopPropagation();
        this.updateProperty('interviewLabel', event.detail.value, event.detail.error);
    }

    renderedCallback() {
        if (this.flowProperties.processType && this.flowProperties.processType.value && !this.flowProperties.processType.error) {
            const processTypeElement = this.template.querySelector('.process-type');
            this.setElementErrorMessage(processTypeElement, null);
        }
    }
}