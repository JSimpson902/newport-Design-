import { LABELS } from "builder_platform_interaction/screenEditorI18nUtils";
import { COMPONENT_INSTANCE, EXTENSION_TYPE_SOURCE, getAllCachedExtensionTypes, listExtensions } from "./screenEditorExtensionUtils";
import { FLOW_DATA_TYPE } from "builder_platform_interaction/dataTypeLib";

const FEROV_TYPES = {
    string: ['TEXT', 'STRING', 'PASSWORD', 'PASSWORDFIELD'],
    number: ['CURRENCY', 'NUMBER', 'DECIMAL', 'FLOAT', 'DOUBLE', 'LONG', 'INT', 'INTEGER', 'SHORT', 'BYTE'],
    date: ['DATE'],
    dateTime: ['DATETIME', 'DATE-TIME'],
    boolean: ['BOOLEAN']
};

/**
 * All screen field types
 */
const screenFieldTypes = [
    {
        name: 'TextBox',
        fieldType: 'InputField',
        dataType: 'String',
        label: LABELS.fieldTypeLabelTextField,
        icon: 'utility:type_tool',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'LargeTextArea',
        fieldType: 'LargeTextArea',
        dataType: undefined,
        label: LABELS.fieldTypeLabelLargeTextArea,
        icon: 'utility:type_tool',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Number',
        fieldType: 'InputField',
        dataType: 'Number',
        label: LABELS.fieldTypeLabelNumber,
        icon: 'utility:topic2',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Currency',
        fieldType: 'InputField',
        dataType: 'Currency',
        label: LABELS.fieldTypeLabelCurrency,
        icon: 'utility:moneybag',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Date',
        fieldType: 'InputField',
        dataType: 'Date',
        label: LABELS.fieldTypeLabelDate,
        icon: 'utility:event',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'DateTime',
        fieldType: 'InputField',
        dataType: 'DateTime',
        label: LABELS.fieldTypeLabelDateTime,
        icon: 'utility:event',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Password',
        fieldType: 'PasswordField',
        dataType: undefined,
        label: LABELS.fieldTypeLabelPassword,
        icon: 'utility:lock',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Checkbox',
        fieldType: 'InputField',
        dataType: 'Boolean',
        label: LABELS.fieldTypeLabelCheckbox,
        icon: 'utility:check',
        category: LABELS.fieldCategoryInput,
    }, {
        name: 'Radio',
        fieldType: 'RadioButtons',
        dataType: undefined,
        label: LABELS.fieldTypeLabelRadioButtons,
        icon: 'standard:contact_list',
        category: LABELS.fieldCategoryInput
    }, {
        name: 'DisplayText',
        fieldType: 'DisplayText',
        dataType: undefined,
        label: LABELS.fieldTypeLabelDisplayText,
        icon: 'utility:type_tool',
        category: LABELS.fieldCategoryDisplay
    }, {
        name: 'DisplayRichText',
        fieldType: 'DisplayText',
        dataType: undefined,
        label: LABELS.fieldTypeLabelDisplayRichText,
        icon: 'utility:type_tool',
        category: LABELS.fieldCategoryDisplay
    }
];

/**
 * Returns a Promise that will be resolved once the extension field types have been retrieved.
 *
 * @Returns {Promise} - The promise
 */
export function getExtensionFieldTypes() {
    const cachedFields = getAllCachedExtensionTypes();
    if (cachedFields && cachedFields.length) {
        return Promise.resolve(cachedFields);
    }

    return new Promise((resolve, reject) => {
        listExtensions(true, (data, error) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Returns all screen field types (excluding extensions), including name, fieldType, dataType, label (localized), icon and category (localized)
 * @return {array} - The field types
 */
export function getAllScreenFieldTypes() {
    return screenFieldTypes;
}

/**
 * Returns a local representation of the field type for the given extension (that will eventually be replaced by the server version)
 * @param {String} name - The FQN of the extension
 * @returns {FieldType} - The type
 */
export function getLocalExtensionFieldType(name) {
    return {
        name,
        fieldType: COMPONENT_INSTANCE,
        label: name,
        icon: 'utility:connected_apps', // 'standard:custom_notification', //Removing this until we clarify how to change the size and the background of icons in the palette
        source: EXTENSION_TYPE_SOURCE.LOCAL
    };
}

/**
 * Returns a type given a name
 * @param {string} name - The name of the type
 * @returns {object} - The type
 * @throws if type can't be found
 */
export function getScreenFieldTypeByName(name) {
    name = name && name.toLowerCase();
    return [...screenFieldTypes, ...getAllCachedExtensionTypes()].find(type => type.name.toLowerCase() === name);
}

/**
 * Returns the type object corresponding to the given field (determined by looking at the fieldType and the dataType
 * @param {object} field - The screen field
 * @returns {object} - The corresponding type
 * @throws if type can't be found
 */
export function getScreenFieldType(field) {
    const fieldType = field.fieldType;
    const dataType = field.dataType;

    for (const type of screenFieldTypes) {
        if (fieldType === type.fieldType && dataType === type.dataType) {
            return type;
        }

        // Special case for Radio fields.
        // A reality, radio fields have a dataType associated with it. However, we generically
        // lump all radio fields as one type in the screenFieldTypes map and dataType is ignored.
        // For this check only, just check the fieldType and ignore dataType.
        if (fieldType === type.fieldType && fieldType === 'RadioButtons') {
            return type;
        }
    }

    throw new Error('No type found for ' + fieldType + ', ' + dataType);
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is an extension field type
 */
export function isExtensionField(field) {
    return field && field.fieldType === COMPONENT_INSTANCE;
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is a DisplayText field (non-rich text)
 */
export function isDisplayTextField(field) {
    return field && field.fieldType === 'DisplayText';
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is an input field
 */
export function isInputField(field) {
    return field && field.fieldType === 'InputField';
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is a text area field
 */
export function isTextAreaField(field) {
    return field && field.fieldType === 'LargeTextArea';
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is a password field
 */
export function isPasswordField(field) {
    return field && field.fieldType === 'PasswordField';
}

/**
 * @param {object} field - field to test
 * @returns {boolean} Indicates if specified field is a radio field
 */
export function isRadioField(field) {
    return field && field.fieldType === 'RadioButtons';
}

/**
 * @param {string} dataType - The dataType to look up.
 * @returns {string} The corresponding FLOW_DATA_TYPE. Returns null there is no match.
 */
export function getFlowDataTypeByName(dataType) {
    if (dataType) {
        // Lightning Component attributes support field types in various number flavors, which all map to number
        // in Flow metadata.
        let lcType = dataType.toUpperCase();
        if (lcType === 'DECIMAL' || lcType === 'DOUBLE' || lcType === 'INTEGER' || lcType === 'LONG' || lcType === 'INT') {
            lcType = 'NUMBER';
        }

        for (const typeName in FLOW_DATA_TYPE) {
            if (FLOW_DATA_TYPE[typeName].value.toUpperCase() === lcType) {
                return FLOW_DATA_TYPE[typeName].value;
            }
        }
    }
    return null;
}

/**
 * Returns the ferov type from a field type
 * @param {FieldType} fieldType - The field type
 * @returns {String} - The type
 */
export function getFerovTypeFromFieldType(fieldType) {
    if (fieldType) {
        return getFerovTypeFromTypeName(fieldType.dataType || fieldType.fieldType);
    }

    return null;
}

/**
 * Maps the provided type to one of the ferov types (number, string, boolean, date and datetime)
 *
 * @param {String} type - The type
 * @returns {String} - The ferov type
 */
export function getFerovTypeFromTypeName(type) {
    if (type) {
        const ucType = type.toUpperCase();
        // try flow data type conversion
        let flowType = getFlowDataTypeByName(ucType);
        if (!flowType) {
            flowType = ucType;
        } else {
            flowType = flowType.toUpperCase();
        }

        for (const ferovType in FEROV_TYPES) {
            if (FEROV_TYPES[ferovType].find(t => t === flowType)) {
                return ferovType;
            }
        }
    }

    return null;
}

export function getPlaceHolderLabel(fieldName) {
    for (const type of screenFieldTypes) {
        if (fieldName === type.name) {
            return '[' + type.label + ']';
        }
    }
    throw new Error('No type found for ' + fieldName);
}