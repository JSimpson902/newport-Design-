import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

export const expectComplexTypeFieldDescription = field => {
    // need a dataType and apiName. isCollection and label optional
    expect(field.dataType).toBeDefined();
    expect(field.apiName).toBeDefined();
    if (
        field.dataType === FLOW_DATA_TYPE.SOBJECT.value ||
        field.dataType === FLOW_DATA_TYPE.APEX
    ) {
        expect(field.subtype).toBeDefined();
    }
};

export const expectFieldsAreComplexTypeFieldDescriptions = fields => {
    for (const fieldName in fields) {
        if (Object.prototype.hasOwnProperty.call(fields, fieldName)) {
            const field = fields[fieldName];
            expectComplexTypeFieldDescription(field);
        }
    }
};
