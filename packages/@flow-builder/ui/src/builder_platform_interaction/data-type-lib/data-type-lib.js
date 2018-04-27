/**
 * Array of objects representing flow data types
 * Can be consumed by lightning-combobox
 * TODO: Use labels: W-4813532
 * TODO: Update list to use proper icons per designs, this is a dependency TD-0051198
 */
const FLOW_DATA_TYPE = {
    STRING: {
        label: 'Text',
        value: 'String',
    },
    SOBJECT: {
        label: 'sObject',
        value: 'SObject',
    },
    NUMBER: {
        label: 'Number',
        value: 'Number',
    },
    CURRENCY: {
        label: 'Currency',
        value: 'Currency',
    },
    BOOLEAN: {
        label: 'Boolean',
        value: 'Boolean',
    },
    DATE: {
        label: 'Date',
        value: 'Date',
    },
    DATE_TIME: {
        label: 'Date Time',
        value: 'DateTime',
    },
    PICKLIST: {
        label: 'Picklist',
        value: 'Picklist',
    },
    MULTI_PICKLIST: {
        label: 'Picklist Multi-select',
        value: 'Multipicklist',
    },
};

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
};

export { FLOW_DATA_TYPE };

export const FEROV_DATA_TYPE = {
    STRING : 'string',
    NUMBER : 'number',
    DATE : 'date',
    DATETIME: 'datetime',
    BOOLEAN : 'boolean',
    REFERENCE: 'reference'
};

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