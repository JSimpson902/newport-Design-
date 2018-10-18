import { LightningElement, api, track } from 'lwc';
import BaseResourcePicker from 'builder_platform_interaction/baseResourcePicker';
import { FLOW_DATA_TYPE, FEROV_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { ELEMENT_TYPE, WAIT_TIME_EVENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { getRulesForElementType, RULE_TYPES } from 'builder_platform_interaction/ruleLib';
import {
    PropertyChangedEvent,
    UpdateParameterItemEvent,
} from 'builder_platform_interaction/events';
import { getFerovInfoFromComboboxItem } from 'builder_platform_interaction/expressionUtils';
import { getValueFromHydratedItem, getErrorFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import { LABELS } from "./waitTimeEventLabels";

// rules used by the input pickers in the waitTimeEvent
const timeEventRules = getRulesForElementType(RULE_TYPES.ASSIGNMENT, ELEMENT_TYPE.WAIT);

/**
 * Turns an array of paramters into an object where each property contains one index of the array
 * This also creates inputParamter for each param
 * @param {Object[]} parameters list of parameters
 * @returns {Object} object where the key is the param name and the value is the parameter
 */
const inputParameterArrayToMap = (parameters = []) => {
    const parametersMap = new Map();

    parameters.forEach((param) => {
        parametersMap.set(param.name.value, param);
    });

    return parametersMap;
};

const PARAMETER_NAMES = {
        ABSOLUTE_BASE_TIME: 'AlarmTime',
        SALESFORCE_OBJECT: 'TimeTableColumnEnumOrId',
        DIRECT_RECORD_BASE_TIME: 'TimeFieldColumnEnumOrId',
        RECORD_ID: 'EntityObjectId',
        EVENT_DELIVERY_STATUS: 'Status',
        OFFSET_NUMBER: 'TimeOffset',
        OFFSET_UNIT: 'TimeOffsetUnit'
};

export default class WaitTimeEvent extends LightningElement {
    @track
    resumeTimeParametersMap = new Map();

    @track
    resumeTimeParametersArray = [];

    @track
    _eventType = WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME;

    /**
     * The output resume time (alarm time)
     * @type {module:ParameterItem.ParameterItem}
     */
    @track
    outputResumeTime = {};

    /**
     * The event delivery status output
     *
     * @type {module:ParameterItem.ParameterItem}
     */
    @track
    outputEventDeliveryStatus = {};

    /**
     * @typedef {Object} WaitEventParameter
     * @property {String} name the name of the parameter
     * @property {String} value the ferov value of the parameter
     * @property {String} valueDataType the datatype of the ferov value
     */

    /**
     * Object of input parameters used to define the resume time
     * @type {ParameterItem[]}
     */
    set resumeTimeParameters(resumeTimeParameters) {
        this.resumeTimeParametersArray = resumeTimeParameters;
        if (resumeTimeParameters) {
            this.resumeTimeParametersMap = inputParameterArrayToMap(resumeTimeParameters);
        }
    }

    /**
     * Array of parameter items used to define the resume time input
     * @type {ParameterItem[]}
     */
    @api
    get resumeTimeParameters() {
        return this.resumeTimeParametersArray;
    }

    /**
     * Object of output parameters
     *
     * @param {Object} outputParameters object of @type {WaitEventParameter}
     */
    set outputParameters(outputParameters = {}) {
        this._outputParameters = outputParameters;
        const alarmTime = outputParameters[PARAMETER_NAMES.ABSOLUTE_BASE_TIME];
        this.outputResumeTime = Object.assign({},
            alarmTime,
            this.outputResumeTimeDefinition
        );
        const status = outputParameters[PARAMETER_NAMES.EVENT_DELIVERY_STATUS];
        this.outputEventDeliveryStatus = Object.assign({},
            status,
            this.outputEventDeliveryStatusDefinition
        );
    }

    @api
    get outputParameters() {
        return this._outputParameters;
    }

    /**
     * The event type of the wait event
     * @type {module:flowMetadata.WaitTimeEventType}
     */
    set eventType(eventType) {
        this._eventType = getValueFromHydratedItem(eventType);
    }

    @api
    get eventType() {
        return this._eventType;
    }

    labels = LABELS;

    _outputParameters;

    dateTimeElementParam = {
        isCollection: false,
        dataType: FLOW_DATA_TYPE.DATE_TIME.value,
    };

    recordIdElementParam = {
        isCollection: false,
        dataType: FLOW_DATA_TYPE.STRING.value,
    }

    eventTypeValueOptions = [
        { 'label': this.labels.absoluteTimeLabel, 'value': WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME },
        { 'label': this.labels.directRecordTimeLabel, 'value': WAIT_TIME_EVENT_TYPE.DIRECT_RECORD_TIME },
    ];

    // TODO: W-5502328 we might be able to remove this once the translation work for outputParameters is done
    outputResumeTimeDefinition = {
        rowIndex: 0,
        isInput: false,
        isRequired: false,
        label: this.labels.resumeTimeLabel,
        dataType: FLOW_DATA_TYPE.DATE_TIME.value,
        iconName: 'utility:date_input',
    };

    // TODO: W-5502328 we might be able to remove this once the translation work for outputParameters is done
    outputEventDeliveryStatusDefinition = {
        rowIndex: 1,
        isInput: false,
        isRequired: false,
        label: this.labels.eventDeliveryStatusLabel,
        dataType: FLOW_DATA_TYPE.STRING.value,
        iconName: 'utility:type_tool',
    };

    get timeEventParameterRules() {
        return timeEventRules;
    }

    get elementType() {
        return ELEMENT_TYPE.WAIT;
    }

    /** input parameters */

    get isAbsoluteTime() {
        return this.eventType === WAIT_TIME_EVENT_TYPE.ABSOLUTE_TIME;
    }

    get absoluteBaseTime() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.ABSOLUTE_BASE_TIME);
    }

    get absoluteBaseTimeErrorMessage() {
        return this.getResumeTimeParameterError(PARAMETER_NAMES.ABSOLUTE_BASE_TIME);
    }

    get absoluteBaseTimeComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.baseTimeLabel,
            this.labels.ferovPickerPlaceholder,
            null,
            true,
            true,
            false,
            FLOW_DATA_TYPE.DATE_TIME.value
        );
    }

    get recordIdComboboxConfig() {
        return BaseResourcePicker.getComboboxConfig(
            this.labels.recordId,
            this.labels.ferovPickerPlaceholder,
            null,
            true,
            true,
            false,
            FEROV_DATA_TYPE.REFERENCE.value
        );
    }

    get offsetNumber() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.OFFSET_NUMBER);
    }

    get offsetUnit() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.OFFSET_UNIT);
    }

    get recordIdValue() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.RECORD_ID);
    }

    get recordIdErrorMessage() {
        return this.getResumeTimeParameterError(PARAMETER_NAMES.RECORD_ID);
    }

    get salesforceObjectValue() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.SALESFORCE_OBJECT);
    }

    get directRecordBaseTime() {
        return this.getResumeTimeParameterValue(PARAMETER_NAMES.DIRECT_RECORD_BASE_TIME);
    }

    handleEventTypeChange(event) {
        event.stopPropagation();
        const propChangedEvent = new PropertyChangedEvent('eventType', event.detail.value, null);
        this.dispatchEvent(propChangedEvent);
    }

    handleFerovParameterChange(event, propertyName, literalDataType, isInput) {
        const ferovObject = getFerovInfoFromComboboxItem(event.detail.item, event.detail.displayText, literalDataType);
        const updateParameterItem = new UpdateParameterItemEvent(
            isInput,
            null,
            propertyName,
            ferovObject.value,
            ferovObject.dataType,
            event.detail.error
            );
        this.dispatchEvent(updateParameterItem);
    }

    handleLiteralParameterChange(event, propertyName, literalDataType, isInput) {
        const updateParameterItem = new UpdateParameterItemEvent(
            isInput,
            null,
            propertyName,
            event.detail.value,
            literalDataType,
            event.detail.error
            );
        this.dispatchEvent(updateParameterItem);
    }

    handleRecordIdChanged(event) {
        event.stopPropagation();
         this.handleFerovParameterChange(event, PARAMETER_NAMES.RECORD_ID, FLOW_DATA_TYPE.STRING.value, true);
    }

    handleAbsoluteBaseTimeChange(event) {
        event.stopPropagation();
        this.handleFerovParameterChange(event, PARAMETER_NAMES.ABSOLUTE_BASE_TIME, FLOW_DATA_TYPE.DATE_TIME.value, true);
    }

    handleOffsetNumberChange(event) {
        event.stopPropagation();
        this.handleLiteralParameterChange(event, PARAMETER_NAMES.OFFSET_NUMBER, FLOW_DATA_TYPE.NUMBER.value, true);
    }

    handleOffsetUnitChange(event) {
        event.stopPropagation();
        this.handleLiteralParameterChange(event, PARAMETER_NAMES.OFFSET_UNIT, FLOW_DATA_TYPE.STRING.value, true);
    }

    handleSalesforceObjectFocusOut(event) {
        event.stopPropagation();
        const error = event.target.value === '' ? this.labels.cannotBeBlank : null;
        const updateParameterItem = new UpdateParameterItemEvent(
            true,
            null,
            PARAMETER_NAMES.SALESFORCE_OBJECT,
            event.target.value,
            FLOW_DATA_TYPE.STRING.value,
            error);
        this.dispatchEvent(updateParameterItem);
    }

    handleDirectRecordBaseTimeChange(event) {
        event.stopPropagation();
        const error = event.target.value === '' ? this.labels.cannotBeBlank : null;
        const updateParameterItem = new UpdateParameterItemEvent(
            true,
            null,
            PARAMETER_NAMES.DIRECT_RECORD_BASE_TIME,
            event.target.value,
            FLOW_DATA_TYPE.STRING.value,
            error);
        this.dispatchEvent(updateParameterItem);
    }

    getResumeTimeParameterValue(paramName) {
        const param = this.resumeTimeParametersMap.get(paramName);
        return param ? getValueFromHydratedItem(param.value) : null;
    }

    getResumeTimeParameterError(paramName) {
        const param = this.resumeTimeParametersMap.get(paramName);
        return param ? getErrorFromHydratedItem(param.value) : null;
    }
}