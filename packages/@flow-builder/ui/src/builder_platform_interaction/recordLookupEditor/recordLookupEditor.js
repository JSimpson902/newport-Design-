import { LightningElement, api, track } from 'lwc';
import { recordLookupReducer } from "./recordLookupReducer";
import { ENTITY_TYPE, fetchFieldsForEntity, getAllEntities } from "builder_platform_interaction/sobjectLib";
import { LABELS, NUMBER_RECORDS_OPTIONS, WAY_TO_STORE_FIELDS_OPTIONS } from "./recordLookupEditorLabels";
import { FLOW_DATA_TYPE } from "builder_platform_interaction/dataTypeLib";
import BaseResourcePicker from "builder_platform_interaction/baseResourcePicker";
import { VALIDATE_ALL } from "builder_platform_interaction/validationRules";
import { AddElementEvent, PropertyChangedEvent } from "builder_platform_interaction/events";
import { getErrorsFromHydratedElement } from "builder_platform_interaction/dataMutationLib";
import { NUMBER_RECORDS_TO_STORE, WAY_TO_STORE_FIELDS } from "builder_platform_interaction/recordEditorLib";
import { format } from 'builder_platform_interaction/commonUtils';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { FLOW_AUTOMATIC_OUTPUT_HANDLING, getProcessTypeAutomaticOutPutHandlingSupport } from 'builder_platform_interaction/processTypeLib';
import { UseAdvancedOptionsSelectionChangedEvent } from "builder_platform_interaction/events";

export default class RecordLookupEditor extends LightningElement {
    labels = LABELS;

    /**
     * Internal state for the editor
     */
    @track
    state = {
        recordLookupElement: {},
        fields: {},
    }

    processTypeAutomaticOutPutHandlingSupport = FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED;

    processTypeValue = '';

    /**
     * only "Queryable" entities available
     */
    crudFilterType = ENTITY_TYPE.QUERYABLE;

    /**
     * element type of the current editor
     */
    elementType = ELEMENT_TYPE.RECORD_LOOKUP;

    /**
     * public API function to return the node
     *
     * @returns {object} node - node
     */
    @api getNode() {
        return this.state.recordLookupElement;
    }

    @api
    get node() {
        return this.state.recordLookupElement;
    }

    set node(newValue) {
        this.state.recordLookupElement = newValue;
        this.updateFields();
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
     * Used to know if we are dealing with an editor in edit mode or addition mode.
     */
    @api
    get mode() {
        return this._mode;
    }

    set mode(newValue) {
        this._mode = newValue;
        if (this.isInAddElementMode && this.isAutomaticOutputHandlingSupported) {
            this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, new UseAdvancedOptionsSelectionChangedEvent(false));
        } else {
            this.state.recordLookupElement = Object.assign({}, this.state.recordLookupElement,
                    {wayToStoreFields: this.initialWayToStoreFields});
        }
    }

    get initialWayToStoreFields() {
        if (this.isAdvancedMode) {
            return this.hasOutputReference ? WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE : WAY_TO_STORE_FIELDS.SEPARATE_VARIABLES;
        }

        return WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE;
    }

    /**
     * Is in "add element" mode (ie: added from the palette to the canvas)?
     * @returns {boolean} true if in "addElement" mode otherwise false
     */
    get isInAddElementMode() {
        return this.mode === AddElementEvent.EVENT_NAME;
    }

    /**
     * public API function to run the rules from record lookup validation library
     * @returns {Object[]} list of errors
     */
    @api validate() {
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, { type: VALIDATE_ALL});
        return getErrorsFromHydratedElement(this.state.recordLookupElement);
    }

    /**
     * set the entity name (object) and load fields accordingly
     * @param {string} newValue - new entity name
     */
    set recordEntityName(newValue) {
        this.state.recordLookupElement.object.value = newValue;
        this.updateFields();
    }

    /**
     * @returns {string} entity name (object)
     */
    get recordEntityName() {
        return this.state.recordLookupElement.object.value;
    }

    /**
     * return {boolean} true if the element is using the output reference.
     */
    get hasOutputReference() {
        return this.isInAddElementMode || (this.outputReferenceValue !== '');
    }

    /**
     * @returns {Object} the entity fields
     */
    get recordFields() {
        return this.state.fields;
    }

    /**
     * Returns the number of result stored.
     * If firstRecord then the user will be able to select a sObject variable
     * If allRecord then the user will be able to select a sObject Collection variable
     * {@link recordEditorLib#NUMBER_RECORDS_TO_STORE}
     * @returns {string} This value can be 'firstRecord' or 'allRecords'
     */
    get numberRecordsToStoreValue() {
        return this.state.recordLookupElement.getFirstRecordOnly ? NUMBER_RECORDS_TO_STORE.FIRST_RECORD : NUMBER_RECORDS_TO_STORE.ALL_RECORDS;
    }

    /**
     * @returns {boolean} true if you want to store all the records to an sObject collection variable
     */
    get isCollection() {
        return !this.state.recordLookupElement.getFirstRecordOnly;
    }

    /**
     * @returns {string} the sObject or sObject collection variable that you want to assign the records to reference them later
     */
    get outputReferenceValue() {
        return (this.state.recordLookupElement.outputReference && this.state.recordLookupElement.outputReference.value) || '';
    }

    /**
     * return {Boolean} true if the node is using output assignment
     */
    get hasOutputAssignmentValue() {
        return (this.state.recordLookupElement.outputAssignments && this.state.recordLookupElement.outputAssignments.length > 0 && !this.isInAddElementMode);
    }

    /**
     * @returns {string} the output reference error message
     */
    get outputReferenceErrorMessage() {
        return (this.state.recordLookupElement.outputReference && this.state.recordLookupElement.outputReference.error) || '';
    }

    /**
     * @returns {Object} configuration to pass to entity-resource-picker component
     */
    get entityComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.object, // Label
            this.labels.objectPlaceholder, // Placeholder
            this.state.recordLookupElement.object.error, // errorMessage
            false, // literalsAllowed
            true, // required
            false, // disabled
            FLOW_DATA_TYPE.SOBJECT.value
        );
    }

    /**
     * @returns {string} entity label if any found for current selected entity empty string otherwise
     */
    get resourceDisplayText() {
        const entityToDisplay = getAllEntities().find(entity => entity.apiName === this.recordEntityName);
        return entityToDisplay ? entityToDisplay.entityLabel : '';
    }

    /**
     * @returns {boolean} true if record lookup element in sobject mode false otherwise
     */
    get isSObjectMode() {
        return this.wayToStoreFieldsValue === WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE;
    }

    /**
     * Returns the way to store: sobject variable or separate variables
     * If "sObjectVariable" then the user will be able to store in an sObject variable
     * If "separateVariables" then the user will be able to store in separate variables
     * see {@link recordEditorLib#WAY_TO_STORE_FIELDS}
     * @returns {string} This value can be 'sObjectVariable' or 'separateVariables'
     */
    get wayToStoreFieldsValue() {
        return this.state.recordLookupElement.wayToStoreFields;
    }

    /**
     * @returns {string} dynamic output assignment title (based on current entity label)
     */
    get assignmentTitle() {
        return format(this.labels.lookupAssignmentTitleFormat, this.resourceDisplayText);
    }

    /**
     * @return {Boolean} true : the user chooses to use the Advanced Options
     */
    get isAdvancedMode() {
        return !this.state.recordLookupElement.storeOutputAutomatically;
    }

    /**
     * @returns {boolean} true is the user select to retrieve the first record only
     */
    get displayWayToStoreFields() {
        return this.state.recordLookupElement.getFirstRecordOnly;
    }

    /**
     * @return {Boolean} true : the process type supports the automatic output handling
     */
    get isAutomaticOutputHandlingSupported() {
        return this.processTypeAutomaticOutPutHandlingSupport === FLOW_AUTOMATIC_OUTPUT_HANDLING.SUPPORTED;
    }

    get assignNullValuesIfNoRecordsFound() {
        return this.state.recordLookupElement.assignNullValuesIfNoRecordsFound;
    }

    get recordStoreOptions() {
        return NUMBER_RECORDS_OPTIONS;
    }

    get wayToStoreFieldsOptions() {
        return WAY_TO_STORE_FIELDS_OPTIONS;
    }

    /**
     * update the fields of the selected entity
     */
    updateFields() {
        this.state.fields = {};
        if (this.recordEntityName) {
            fetchFieldsForEntity(this.recordEntityName).then(fields => {
                this.state.fields = fields;
            }).catch(() => {
                // fetchFieldsForEntity displays an error message
            });
        }
    }

    /**
     * @param {Object} event - property changed event coming from label-description component or the list item changed events (add/update/delete)
     */
    handlePropertyOrListItemChanged(event) {
        event.stopPropagation();
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, event);
    }

    /**
     * @param {Object} event - sobjectreferencechanged event from sobject-or-sobject-collection component. The property name depends on the record node (create/update/lookup)
     */
    handleSObjectReferenceChanged(event) {
        event.stopPropagation();
        this.updateProperty('outputReference', event.detail.value, event.detail.error, false, this.outputReferenceValue);
    }

    /**
     * @param {Object} event - comboboxstatechanged event from entity-resource-picker component. The property name depends on the record node
     */
    handleResourceChanged(event) {
        event.stopPropagation();
        const {item, error} = event.detail;
        const oldRecordEntityName = this.recordEntityName;
        const newRecordEntityName = (item && item.value) || '';
        if (newRecordEntityName !== oldRecordEntityName) {
            this.updateProperty('object', newRecordEntityName, error, false, oldRecordEntityName);
            this.recordEntityName = newRecordEntityName;
        }
    }

    /**
     * @param {Object} event - recordstoreoptionchanged event from record-store-options component.
     */
    handleRecordStoreOptionsChanged(event) {
        event.stopPropagation();
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, event);
    }

    /**
     * @param {Object} event - change event from record-sort component.
     */
    handleRecordSortChanged(event) {
        event.stopPropagation();
        const {fieldApiName, error, sortOrder} = event.detail;
        if (this.state.recordLookupElement.sortField.value !== fieldApiName) {
            this.updateProperty('sortField', fieldApiName, error, false);
        } else {
            // Can't have error on this field, all errors are related to sortFields
            this.updateProperty('sortOrder', sortOrder, null, false);
        }
    }

    /**
     * Handle filterType change and via reducer update element's state accordingly
     * @param {Object} event - event
     */
    handleFilterTypeChanged(event) {
        event.stopPropagation();
        const {filterType, error} = event.detail;
        this.updateProperty('filterType', filterType, error, true, this.state.recordLookupElement.filterType);
    }

    /**
     * Handle output assignments change and via reducer update element's state accordingly
     * @param {Object} event - event
     */
    handleRecordInputOutputAssignmentsChanged(event) {
        event.stopPropagation();
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, event);
    }

    /**
     * Handles selection/deselection of 'Use Advanced Options' checkbox
     * @param {Object} event - event
     */
    handleAdvancedOptionsSelectionChange(event) {
        event.stopPropagation();
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, event);
    }

    /**
     * Handle number of record changed
     * @param {Object} event - event
     */
    handleNumberRecordsToStoreChange(event) {
        event.stopPropagation();
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, event);
    }

    handleWayToStoreFieldsChange(event) {
        event.stopPropagation();
        const wayToStoreFields = event.detail.value;
        if (this.wayToStoreFieldsValue !== wayToStoreFields) {
            this.updateProperty('wayToStoreFields', wayToStoreFields, null, true);
        }
    }

    handleAssignNullValuesIfNoRecordsFoundChange(event) {
        event.stopPropagation();
        this.updateProperty('assignNullValuesIfNoRecordsFound', event.detail.checked, null, true);
    }

    /**
     * Instantiates property changed event based to handle property change and updating via element's reducer state accordingly
     * @param {string} propertyName - name of the property changed
     * @param {Object|string|boolean} newValue - new value to be passed to property
     * @param {string} error - error on property
     * @param {boolean} ignoreValidate - true if we do not want to have specific property validation
     * @param {Object|string|boolean} oldValue - property's previous value
     */
    updateProperty(propertyName, newValue, error, ignoreValidate, oldValue) {
        const propChangedEvent = new PropertyChangedEvent(propertyName, newValue, error, null, oldValue);
        propChangedEvent.detail.ignoreValidate = ignoreValidate;
        this.state.recordLookupElement = recordLookupReducer(this.state.recordLookupElement, propChangedEvent);
    }
}