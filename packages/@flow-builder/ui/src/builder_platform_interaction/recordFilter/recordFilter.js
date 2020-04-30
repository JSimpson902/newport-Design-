import { LightningElement, api, track } from 'lwc';
import { CONDITION_LOGIC, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    LABELS,
    CRITERIA_RECORDS_LABELS,
    WARNING_LABELS,
    NO_CRITERIA_LABELS,
    ALL_CRITERIA_LABELS,
    FILTER_LOGIC_OPTIONS
} from './recordFilterLabels';
import { RECORD_FILTER_CRITERIA } from 'builder_platform_interaction/recordEditorLib';
import { format } from 'builder_platform_interaction/commonUtils';
import { getRulesForElementType, RULE_TYPES, RULE_OPERATOR } from 'builder_platform_interaction/ruleLib';
import {
    AddRecordFilterEvent,
    DeleteRecordFilterEvent,
    UpdateRecordFilterEvent,
    RecordFilterTypeChangedEvent,
    PropertyChangedEvent
} from 'builder_platform_interaction/events';
import { getConditionsWithPrefixes } from 'builder_platform_interaction/conditionListUtils';

const VARIANT_START = 'startElement';

export default class RecordFilter extends LightningElement {
    defaultOperator = RULE_OPERATOR.EQUAL_TO;
    labels = LABELS;
    showPrefixValue = false;

    @track
    selectedFilter = RECORD_FILTER_CRITERIA.NONE;

    @api
    filterLogic = { value: CONDITION_LOGIC.AND, error: null };

    @track items = [];

    @track entityFields = [];

    @track entityName = '';

    @api
    elementType;

    @api
    hideNewResource = false;

    @api
    hideSystemVariables = false;

    @api
    hideTitle = false;

    @api
    variant;

    @api
    elementGuid;

    @api
    useFilterWithCustomLogic = false;

    get rules() {
        return this.elementType ? getRulesForElementType(RULE_TYPES.COMPARISON, this.elementType) : undefined;
    }

    @api
    resourceDisplayText = '';
    /**
     * The filter type to pass as value of the rule for finding record drop down
     * @param {String} value - it's RECORD_FILTER_CRITERIA.NONE or RECORD_FILTER_CRITERIA.ALL
     */
    set filterType(value) {
        this.selectedFilter = value;
    }

    @api
    get filterType() {
        return this.selectedFilter;
    }

    /**
     * The filter items
     * @param {Object} value - it comes from the recordNode.filters
     */
    set filterItems(value) {
        this.items = value;
    }

    @api
    get filterItems() {
        return this.items;
    }

    /**
     * @param {String} entityName the selected record object
     */
    set recordEntityName(entityName) {
        this.entityName = entityName;
    }

    @api
    get recordEntityName() {
        return this.entityName;
    }
    /**
     * @param {Object} fields - Filterable fields of the entity
     */
    set recordFields(fields) {
        if (fields) {
            this.entityFields = {};
            const filterableFields = Object.values(fields).filter(field => field.filterable);
            filterableFields.forEach(filterableField => {
                this.entityFields[filterableField.apiName] = filterableField;
            });
        }
    }

    @api
    get recordFields() {
        return this.entityFields;
    }

    set showPrefix(value) {
        this.showPrefixValue = value;
    }

    @api
    get showPrefix() {
        return (
            this.showPrefixValue ||
            (this.useFilterWithCustomLogic &&
                this.filterLogic.value !== CONDITION_LOGIC.AND &&
                this.filterLogic.value !== CONDITION_LOGIC.OR &&
                this.filterLogic.value !== CONDITION_LOGIC.NO_CONDITIONS)
        );
    }

    /**
     * Return the conditions to be rendered edcorated with the correct prefixes
     * @return {Object[]} Array of all conditions decorated with prefix
     */
    get conditionsWithPrefixes() {
        return this.items ? getConditionsWithPrefixes(this.filterLogic, this.items) : [];
    }

    get containerClasses() {
        return this.variant === VARIANT_START ? 'slds-m-bottom_small' : 'slds-m-bottom_small slds-border_top';
    }

    get filterLogicOptions() {
        return FILTER_LOGIC_OPTIONS[this.elementType];
    }

    get showDeleteFilter() {
        return this.filterItems.length > 1;
    }

    get showTitle() {
        return !this.hideTitle;
    }

    get filterOptions() {
        return [
            {
                label: format(NO_CRITERIA_LABELS[this.elementType], this.resourceDisplayText),
                value: RECORD_FILTER_CRITERIA.NONE
            },
            {
                label: ALL_CRITERIA_LABELS[this.elementType],
                value: RECORD_FILTER_CRITERIA.ALL
            }
        ];
    }

    get showFilterList() {
        return this.selectedFilter === RECORD_FILTER_CRITERIA.ALL;
    }

    get filterLabel() {
        return CRITERIA_RECORDS_LABELS[this.elementType];
    }

    get warningLabel() {
        return WARNING_LABELS[this.elementType];
    }

    get showWarningMessage() {
        return (
            (this.elementType === ELEMENT_TYPE.RECORD_LOOKUP ||
                this.elementType === ELEMENT_TYPE.RECORD_UPDATE ||
                this.elementType === ELEMENT_TYPE.RECORD_DELETE) &&
            this.selectedFilter === RECORD_FILTER_CRITERIA.NONE
        );
    }

    get filterRecordsTitle() {
        return format(this.labels.findRecords, this.resourceDisplayText);
    }

    /**
     * handle event when changing the filter type in the rule for finding record dropdown
     * @param {Object} event the filter type changed event
     */
    handleFilterTypeChanged(event) {
        event.stopPropagation();
        this.selectedFilter = event.detail.value;
        // fire RecordFilterTypeChangedEvent
        const recordFilterTypeChangedEvent = new RecordFilterTypeChangedEvent(this.selectedFilter);
        this.dispatchEvent(recordFilterTypeChangedEvent);
    }

    /**
     * handle event when adding the new filter
     * @param {Object} event the add filter event
     */
    handleAddFilter(event) {
        event.stopPropagation();
        const addRecordFilterEvent = new AddRecordFilterEvent();
        this.dispatchEvent(addRecordFilterEvent);
    }

    /**
     * handle event when updating the filter
     * @param {Object} event the update filter event
     */
    handleUpdateFilter(event) {
        event.stopPropagation();
        const updateRecordFilterEvent = new UpdateRecordFilterEvent(
            event.detail.index,
            event.detail.value,
            event.detail.error
        );
        this.dispatchEvent(updateRecordFilterEvent);
    }

    /**
     * handle event when deleting the filter
     * @param {Object} event the delete filter event
     */
    handleDeleteFilter(event) {
        event.stopPropagation();
        const deleteRecordFilterEvent = new DeleteRecordFilterEvent(event.detail.index);
        this.dispatchEvent(deleteRecordFilterEvent);
    }

    /**
     * Handle event when the logic is changed.
     * @param {object} event - PropertyChangedEvent from label description
     */
    handlePropertyChanged(event) {
        event.stopPropagation();
        const propertyChangedEvent = new PropertyChangedEvent('filterLogic', event.detail.value);
        this.dispatchEvent(propertyChangedEvent);
    }
}
