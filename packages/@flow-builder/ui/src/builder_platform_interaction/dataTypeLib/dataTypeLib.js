import { LABELS as SCREEN_LABELS } from "builder_platform_interaction/screenEditorI18nUtils";
import { LABELS as DATA_TYPE_LABELS } from "./dataTypeLibLabels";
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';

/**
 * Array of objects representing flow data types
 * Can be consumed by lightning-combobox
 * TODO: Update list to use proper icons per designs, this is a dependency TD-0051198
 */
const FLOW_DATA_TYPE = {
    STRING: {
        label: DATA_TYPE_LABELS.textDataTypeLabel,
        value: 'String',
        iconName: 'standard:text',
        utilityIconName: 'utility:text'
    },
    SOBJECT: {
        label: DATA_TYPE_LABELS.sObjectDataTypeLabel,
        value: 'SObject',
        iconName: 'standard:sobject',
        utilityIconName: 'utility:sobject'
    },
    NUMBER: {
        label: DATA_TYPE_LABELS.numberDataTypeLabel,
        value: 'Number',
        iconName: 'standard:topic2',
        utilityIconName: 'utility:topic2'
    },
    CURRENCY: {
        label: DATA_TYPE_LABELS.currencyDataTypeLabel,
        value: 'Currency',
        iconName: 'standard:currency',
        utilityIconName: 'utility:currency'
    },
    BOOLEAN: {
        label: DATA_TYPE_LABELS.booleanDataTypeLabel,
        value: 'Boolean',
        iconName: 'standard:cms',
        utilityIconName: 'utility:crossfilter'
    },
    DATE: {
        label: DATA_TYPE_LABELS.dateDataTypeLabel,
        value: 'Date',
        iconName: 'standard:event',
        utilityIconName: 'utility:event'
    },
    DATE_TIME: {
        label: DATA_TYPE_LABELS.dateTimeDataTypeLabel,
        value: 'DateTime',
        iconName: 'standard:date_time',
        utilityIconName: 'utility:date_time'
    },
    PICKLIST: {
        label: DATA_TYPE_LABELS.picklistDataTypeLabel,
        value: 'Picklist',
        iconName: 'standard:picklist_type',
        utilityIconName: 'utility:picklist_type'
    },
    MULTI_PICKLIST: {
        label: DATA_TYPE_LABELS.multiPicklistDataTypeLabel,
        value: 'Multipicklist',
        iconName: 'standard:multi_picklist',
        utilityIconName: 'utility:multi_picklist'
    },
    APEX: {
        label: DATA_TYPE_LABELS.apexDataTypeLabel,
        value: 'Apex',
        iconName: 'standard:apex',
        utilityIconName: 'utility:apex'
    },
    LIGHTNING_COMPONENT_OUTPUT: {
        label: DATA_TYPE_LABELS.lightningComponentOutputDataTypeLabel,
        value: 'LightningComponentOutput',
        iconName: 'standard:lightning_component',
        utilityIconName: 'utility:connected_apps'
    },
};

const FLOW_API_VALUE_TO_FLOW_DATA_TYPE = {
    [FLOW_DATA_TYPE.STRING.value]: 'STRING',
    [FLOW_DATA_TYPE.SOBJECT.value]: 'SOBJECT',
    [FLOW_DATA_TYPE.NUMBER.value]: 'NUMBER',
    [FLOW_DATA_TYPE.CURRENCY.value]: 'CURRENCY',
    [FLOW_DATA_TYPE.BOOLEAN.value]: 'BOOLEAN',
    [FLOW_DATA_TYPE.DATE.value]: 'DATE',
    [FLOW_DATA_TYPE.DATE_TIME.value]: 'DATE_TIME',
    [FLOW_DATA_TYPE.PICKLIST.value]: 'PICKLIST',
    [FLOW_DATA_TYPE.MULTI_PICKLIST.value]: 'MULTI_PICKLIST',
    [FLOW_DATA_TYPE.APEX.value]: 'APEX',
    [FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value]: 'LIGHTNING_COMPONENT_OUTPUT'
};

export const SCALE_RANGE = {
    min : 0,
    max : 17
};

export const SCALE_DEFAULT = 2;

const TYPE_MAPPING = {
    [FLOW_DATA_TYPE.STRING.value]: ["id", "reference", "address", "anytype", "base64", "combobox", "complexvalue", "datacategorygroupreference", "email", "encryptedstring", "location", "phone", "string", "textarea", "url"],
    [FLOW_DATA_TYPE.PICKLIST.value]: ["picklist"],
    [FLOW_DATA_TYPE.MULTI_PICKLIST.value]: ["multipicklist"],
    [FLOW_DATA_TYPE.DATE_TIME.value]: ["datetime", "time"],
    [FLOW_DATA_TYPE.DATE.value]: ["date"],
    [FLOW_DATA_TYPE.NUMBER.value]: ["double", "int", "percent"],
    [FLOW_DATA_TYPE.BOOLEAN.value]: ["boolean"],
    [FLOW_DATA_TYPE.CURRENCY.value]: ["currency"],
    [FLOW_DATA_TYPE.SOBJECT.value]: ["sobject"],
    [FLOW_DATA_TYPE.APEX.value]: ["apex"],
    [FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value]: ["lightningComponentOutput"],
};

export const STAGE_ORDER_RANGE = {
    min : 0,
    max : 99999999
};

let resourceTypes = [];

export { FLOW_DATA_TYPE };

export const FEROV_DATA_TYPE = {
    STRING : FLOW_DATA_TYPE.STRING.value,
    NUMBER : FLOW_DATA_TYPE.NUMBER.value,
    DATE : FLOW_DATA_TYPE.DATE.value,
    DATETIME: FLOW_DATA_TYPE.DATE_TIME.value,
    BOOLEAN : FLOW_DATA_TYPE.BOOLEAN.value,
    REFERENCE: 'reference'
};

/**
 * Subtypes for screen input field type
 */
export const INPUT_FIELD_DATA_TYPE = {
    String: {
        label: SCREEN_LABELS.textDataType,
        value: 'TextBox',
    },
    Number: {
        label: SCREEN_LABELS.numberDataType,
        value: 'Number',
    },
    Currency: {
        label: SCREEN_LABELS.currencyDataType,
        value: 'Currency',
    },
    Boolean: {
        label: SCREEN_LABELS.booleanDataType,
        value: 'Checkbox',
    },
    Date: {
        label: SCREEN_LABELS.dateDataType,
        value: 'Date',
    }
};

/**
 * Sort resource types from service side based on the custom ordering list
 * @param {Array} unsortedResourceTypes unsorted resource type list
 *
 * @returns {Array} sorted resource type list based on custom ordering
 */
function sortResourceTypes(unsortedResourceTypes = []) {
    const resourceOrderedList = [ELEMENT_TYPE.VARIABLE, ELEMENT_TYPE.CONSTANT, ELEMENT_TYPE.FORMULA, ELEMENT_TYPE.TEXT_TEMPLATE,
        ELEMENT_TYPE.CHOICE, ELEMENT_TYPE.RECORD_CHOICE_SET, ELEMENT_TYPE.PICKLIST_CHOICE_SET, ELEMENT_TYPE.STAGE];
    return [...unsortedResourceTypes].sort((firstResourceType, secondResourceType) => {
        // sort by name property instead of elementType here since 'RECORD_CHOICE_SET' and 'PICKLIST_CHOICE_SET' both point to 'CHOICELOOKUP' ElementType
        return resourceOrderedList.indexOf(firstResourceType.name) - resourceOrderedList.indexOf(secondResourceType.name);
    });
}

/**
 * Tries to return the right FLOW_DATA_TYPE for the provided dataType name, looking both in all flow data types and all the mappings
 * @param {String} dataType - The data type name
 * @returns {Object} the flow data type.
 */
export function getFlowType(dataType) {
    if (dataType) {
        const ucDataType = dataType.toUpperCase();
        // Look in flow data types by name
        if (FLOW_DATA_TYPE.hasOwnProperty(ucDataType)) {
            return FLOW_DATA_TYPE[ucDataType];
        }

        // Look for the data type in mappings
        for (const flowType in FLOW_DATA_TYPE) {
            if (FLOW_DATA_TYPE.hasOwnProperty(flowType)) {
                const flowDataType = FLOW_DATA_TYPE[flowType];
                const type = TYPE_MAPPING[flowDataType.value].find(t => t.toUpperCase() === ucDataType);
                if (type) {
                    return flowDataType;
                }
            }
        }
    }

    return null;
}

/**
 * Gets standard or utility icons based on the dataType
 *
 * @param {String} dataType - dataType value of the element
 * @param {String} iconType - Standard or Utility
 * @return {String} Returns the name of the standard or utility icon
 */
export function getDataTypeIcons(dataType, iconType = 'standard') {
    let iconName;

    if (dataType) {
        const flowType = getFlowType(dataType);
        if (flowType) {
            const dataTypeKey = FLOW_API_VALUE_TO_FLOW_DATA_TYPE[flowType.value];
            if (dataTypeKey) {
                const data = FLOW_DATA_TYPE[dataTypeKey];
                if (data) {
                    if (iconType === 'utility') {
                        iconName = data.utilityIconName;
                    } else {
                        iconName = data.iconName;
                    }
                }
            }
        }
    }

    return iconName;
}

/**
 * Returns a label for the dataType of api name @param dataTypeApiName
 *
 * @param {String} dataTypeApiName the api name of the data type
 * @returns {String} the label of the data type
 */
export function getDataTypeLabel(dataTypeApiName) {
    const dataTypeKey = FLOW_API_VALUE_TO_FLOW_DATA_TYPE[dataTypeApiName];
    if (!dataTypeKey || !FLOW_DATA_TYPE[dataTypeKey]) {
        throw new Error(`Invalid data type api name ${dataTypeApiName}`);
    }
    if (!FLOW_DATA_TYPE[dataTypeKey].label) {
        return dataTypeApiName;
    }
    return FLOW_DATA_TYPE[dataTypeKey].label;
}

/**
 * convert from parameter data type to flow data type
 * @param {String} dataType     parameter's dataType
 * @returns {String} flow data type
 * TODO: will be replaced by service when W-4797144 is done
 */
export function getFlowDataType(dataType) {
    const flowDataType = Object.keys(TYPE_MAPPING).find(key => TYPE_MAPPING[key].includes(dataType.toLowerCase()));
    return (flowDataType) ? flowDataType : undefined;
}

/**
 * Set the supported resource types for New Resource panel. This is called at the very beginning of the flow.
 * @param {String} newResourceTypes - String object of all supported resource types.
 */
export function setResourceTypes(newResourceTypes = []) {
    resourceTypes = sortResourceTypes(newResourceTypes);
}

/**
 * Returns supported resource types for New Resource panel.
 * @return {Array} resource types
 */
export function getResourceTypes() {
    return resourceTypes;
}

/**
 * @param {String} type   The data type being tested
 * @returns {Boolean}     True if data type represents a complex type, such as sobject or apex
 */
export function isComplexType(type) {
    return [FLOW_DATA_TYPE.SOBJECT.value, FLOW_DATA_TYPE.APEX.value, FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value].includes(type);
}