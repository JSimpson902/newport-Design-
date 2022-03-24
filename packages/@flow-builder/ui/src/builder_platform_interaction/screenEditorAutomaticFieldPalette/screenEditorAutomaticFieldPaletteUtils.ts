import { ExtraTypeInfo, FieldDataType, getDataTypeIcons } from 'builder_platform_interaction/dataTypeLib';

/**
 * Returns if an automatic field must be seen as a "real" required field
 *
 * @param field automatic field to be checked
 * @returns true if the given field must be seen as a required automatic field, otherwise false
 */
export const isAutomaticFieldRequired = (field: FieldDefinition) => {
    // field.required for Account.Name is false if "Person Accounts" is enabled for the org.
    // But field is required whether account's record type is Business Account or Person Account.
    return (
        (field.required && field.fieldDataType !== FieldDataType.Boolean) ||
        field.extraTypeInfo === ExtraTypeInfo.SwitchablePersonName
    );
};

/**
 * Determine which icon to use for the given automatic field in the palette
 *
 * @param field Field Definition
 * @returns slds icon name
 */
export const getAutomaticFieldIcon = (field: FieldDefinition): string => {
    if (field.fieldDataType === FieldDataType.Address) {
        return 'utility:checkin';
    } else if (field.extraTypeInfo === ExtraTypeInfo.PersonName) {
        return 'utility:identity';
    }
    return getDataTypeIcons(field.dataType, 'utility');
};
