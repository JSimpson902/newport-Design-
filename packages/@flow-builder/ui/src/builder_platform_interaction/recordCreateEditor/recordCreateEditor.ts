// @ts-nocheck
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { getErrorsFromHydratedElement, getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { PropertyChangedEvent } from 'builder_platform_interaction/events';
import { getSObjectOrSObjectCollectionFilter } from 'builder_platform_interaction/filterTypeLib';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    FLOW_AUTOMATIC_OUTPUT_HANDLING,
    getProcessTypeAutomaticOutPutHandlingSupport
} from 'builder_platform_interaction/processTypeLib';
import { NUMBER_RECORDS_TO_STORE, WAY_TO_STORE_FIELDS } from 'builder_platform_interaction/recordEditorLib';
import { PARAM_PROPERTY } from 'builder_platform_interaction/ruleLib';
import { CREATEABLE_FILTER } from 'builder_platform_interaction/selectors';
import { commonUtils } from 'builder_platform_interaction/sharedUtils';
import { ENTITY_TYPE, fetchFieldsForEntity, getCreateableEntities } from 'builder_platform_interaction/sobjectLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './recordCreateEditorLabels';
import { recordCreateReducer } from './recordCreateReducer';
const { format } = commonUtils;
export default class RecordCreateEditor extends LightningElement {
    labels = LABELS;
    propertyEditorElementType = ELEMENT_TYPE.RECORD_CREATE;
    crudFilter = CREATEABLE_FILTER;

    /**
     * Internal state for the editor
     */
    @track
    state = {
        recordCreateElement: {},
        recordEntityName: '',
        entityFields: {},
        resourceDisplayText: ''
    };

    processTypeAutomaticOutPutHandlingSupport = FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED;

    @api
    editorParams;

    @api
    mode;

    /**
     * public api function to return the node
     *
     * @returns {object} node - node
     */
    @api getNode() {
        return this.node;
    }

    @api
    get node() {
        return this.state.recordCreateElement;
    }

    set node(newValue) {
        this.state.recordCreateElement = newValue;
        this.state.recordEntityName = this.objectValue;
        this.state.recordCreateElement = Object.assign({}, this.state.recordCreateElement, {
            wayToStoreFields: this.initialWayToStoreFields
        });
        this.updateFields();
        this.resourceDisplayText();
    }

    /**
     * @returns {FLOW_PROCESS_TYPE} Flow process Type supports automatic output handling
     */
    @api
    get processType() {
        return this.processTypeValue;
    }

    set processType(newValue) {
        this.processTypeValue = newValue;
        this.processTypeAutomaticOutPutHandlingSupport = getProcessTypeAutomaticOutPutHandlingSupport(newValue);
    }

    /**
     * public api function to run the rules from record create validation library
     *
     * @returns {Object[]} list of errors
     */
    @api validate() {
        const event = new CustomEvent(VALIDATE_ALL);
        this.state.recordCreateElement = recordCreateReducer(this.state.recordCreateElement, event);
        return getErrorsFromHydratedElement(this.state.recordCreateElement);
    }

    get initialWayToStoreFields() {
        return this.state.recordCreateElement.object.value === ''
            ? WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE
            : WAY_TO_STORE_FIELDS.SEPARATE_VARIABLES;
    }

    /**
     * Returns the number of result stored.
     * If firstRecord then the user will be able to select a sObject variable
     * If allRecord then the user will be able to select a sObject Collection variable
     *
     * @returns {string} This value can be 'firstRecord' or 'allRecords'
     */
    get numberRecordsToStoreValue() {
        return this.state.recordCreateElement.getFirstRecordOnly
            ? NUMBER_RECORDS_TO_STORE.FIRST_RECORD
            : NUMBER_RECORDS_TO_STORE.ALL_RECORDS;
    }

    get objectValue() {
        return getValueFromHydratedItem(this.state.recordCreateElement.object);
    }

    get wayToStoreFieldsValue() {
        return this.state.recordCreateElement.wayToStoreFields;
    }

    get isSObjectMode() {
        return this.wayToStoreFieldsValue === WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE;
    }

    get isCollection() {
        return !this.state.recordCreateElement.getFirstRecordOnly;
    }

    get sobjectCollectionCriterion() {
        return getSObjectOrSObjectCollectionFilter(this.isCollection);
    }

    get inputReference() {
        if (this.state.recordCreateElement.inputReference && this.state.recordCreateElement.inputReference.value) {
            return this.state.recordCreateElement.inputReference.value;
        }
        return '';
    }

    get inputReferenceError() {
        return this.state.recordCreateElement.inputReference.error;
    }

    get sObjectVariablePickerPlaceholder() {
        return !this.isCollection ? this.labels.searchRecords : this.labels.searchRecordCollections;
    }

    get sObjectVariablePickerLabel() {
        return !this.isCollection ? this.labels.recordVariable : this.labels.recordCollectionVariable;
    }

    get sObjectVariableTitle() {
        return !this.isCollection
            ? this.labels.createRecordFromValues
            : this.labels.selectValuesToCreateMultipleRecords;
    }

    get assignmentTitle() {
        return format(this.labels.createAssignmentTitleFormat, this.state.resourceDisplayText);
    }

    get storeNewIdTitle() {
        return format(this.labels.storeIdInVariableFormat, this.state.resourceDisplayText);
    }

    get crudFilterType() {
        return ENTITY_TYPE.CREATABLE;
    }

    /**
     * @returns {Object} config to pass to entity-resource-picker component
     */
    get entityComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.object, // Label
            this.labels.objectPlaceholder, // Placeholder
            this.state.recordCreateElement.object.error, // errorMessage
            false, // literalsAllowed
            true, // required
            false, // disabled
            FLOW_DATA_TYPE.SOBJECT.value
        );
    }

    get recordFieldsToCreate() {
        return Object.keys(this.state.entityFields)
            .filter((key) => this.state.entityFields[key].creatable)
            .reduce((obj, key) => {
                obj[key] = this.state.entityFields[key];
                return obj;
            }, {});
    }

    /**
     * get the fields of the selected entity
     */
    updateFields() {
        this.state.entityFields = {};
        if (this.state.recordEntityName) {
            fetchFieldsForEntity(this.state.recordEntityName)
                .then((fields) => {
                    this.state.entityFields = fields;
                })
                .catch(() => {
                    // fetchFieldsForEntity displays an error message
                });
        }
    }

    resourceDisplayText() {
        const entityToDisplay = getCreateableEntities().find(
            (entity) => entity.apiName === this.state.recordEntityName
        );
        if (entityToDisplay) {
            this.state.resourceDisplayText = entityToDisplay.entityLabel;
        }
        return '';
    }

    get elementParam() {
        return {
            [PARAM_PROPERTY.DATA_TYPE]: FLOW_DATA_TYPE.STRING.value,
            [PARAM_PROPERTY.IS_COLLECTION]: false
        };
    }

    get variableComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.variable, // Label
            this.labels.variablePlaceholder, // Placeholder
            '', // errorMessage not used in the output-resource-picker, error message is passed as parameter
            true, // literalsAllowed
            false, // required
            false, // disabled
            FLOW_DATA_TYPE.STRING.value,
            true // enableFieldDrilldown
        );
    }

    get assignRecordIDValue() {
        return getValueFromHydratedItem(this.state.recordCreateElement.assignRecordIdToReference);
    }

    get assignRecordIDError() {
        return this.state.recordCreateElement.assignRecordIdToReference.error;
    }

    get sObjectAltText() {
        return this.isCollection ? this.labels.helpSObjectCollAltText : this.labels.helpSObjectAltText;
    }

    /**
     * @returns {boolean} true : the user chooses to use the Advanced Options
     */
    get isAdvancedMode() {
        return !this.state.recordCreateElement.storeOutputAutomatically;
    }

    /**
     * @returns {boolean} true : the process type supports the automatic output handling
     */
    get isAutomaticOutputHandlingSupported() {
        return this.processTypeAutomaticOutPutHandlingSupport === FLOW_AUTOMATIC_OUTPUT_HANDLING.SUPPORTED;
    }

    get isAdvancedModeOrAutomaticOutputNotSupported() {
        return this.isAdvancedMode || !this.isAutomaticOutputHandlingSupported;
    }

    get storeNewIdCss() {
        return this.isAutomaticOutputHandlingSupported
            ? 'slds-p-left_xx-large slds-p-right_small'
            : 'slds-m-bottom_small slds-border_top';
    }

    handleRecordStoreOptionChangedEvent(event) {
        event.stopPropagation();
        this.state.recordCreateElement = recordCreateReducer(this.state.recordCreateElement, event);
        this.state.recordEntityName = this.objectValue;
    }

    /**
     * @param {object} event - property changed event coming from label-description component
     */
    handleLabelDescriptionChangedEvent(event) {
        event.stopPropagation();
        this.updateProperty(event.detail.propertyName, event.detail.value, event.detail.error, false);
    }

    handleInputReferenceChangedEvent(event) {
        event.stopPropagation();
        const oldInputReferenceValue = this.state.inputReference;
        this.updateProperty('inputReference', event.detail.value, event.detail.error, false, oldInputReferenceValue);
    }

    /**
     * @param {object} event - comboboxstatechanged event from entity-resource-picker component. The property name depends on the record node
     */
    handleResourceChanged(event) {
        event.stopPropagation();
        const oldRecordEntityName = this.state.recordEntityName;
        const newRecordEntityName = event.detail.item ? event.detail.item.value : '';

        if (newRecordEntityName !== oldRecordEntityName) {
            this.updateProperty('object', newRecordEntityName, event.detail.error, false, oldRecordEntityName);
            this.state.recordEntityName = newRecordEntityName;
            this.updateFields();
            this.resourceDisplayText();
        }
    }

    handleRecordInputOutputAssignmentsChanged(event) {
        event.stopPropagation();
        this.state.recordCreateElement = recordCreateReducer(this.state.recordCreateElement, event);
    }

    handleAssignRecordIdToReferenceEvent(event) {
        event.stopPropagation();
        const value = event.detail.item ? event.detail.item.value : '';
        this.updateProperty('assignRecordIdToReference', value, event.detail.error, false);
    }

    updateProperty(propertyName, newValue, error, ignoreValidate, oldValue) {
        const propChangedEvent = new PropertyChangedEvent(propertyName, newValue, error, null, oldValue);
        propChangedEvent.detail.ignoreValidate = ignoreValidate;
        this.state.recordCreateElement = recordCreateReducer(
            this.state.recordCreateElement,
            propChangedEvent,
            this.isAutomaticOutputHandlingSupported
        );
    }

    /**
     * Handles selection/deselection of 'Manually Assign Variables' checkbox
     *
     * @param {Object} event - event
     */
    handleManuallyAssignVariablesChanged(event) {
        event.stopPropagation();
        this.state.recordCreateElement = recordCreateReducer(this.state.recordCreateElement, event);
    }
}
