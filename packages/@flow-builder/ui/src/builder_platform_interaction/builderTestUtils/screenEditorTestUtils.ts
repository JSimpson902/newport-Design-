// @ts-nocheck
import { generateGuid } from 'builder_platform_interaction/storeLib';
import {
    getScreenFieldTypeByName,
    getLocalExtensionFieldType,
    ScreenFieldName
} from 'builder_platform_interaction/screenEditorUtils';
import { hydrateWithErrors } from 'builder_platform_interaction/dataMutationLib';
import { ELEMENT_TYPE, FlowScreenFieldType } from 'builder_platform_interaction/flowMetadata';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import {
    createScreenWithFields,
    createScreenField,
    createChoiceReference
} from 'builder_platform_interaction/elementFactory';

const SELECTOR_REGEX = /(.*)\[([^$*^|~]*)(.*)?=["'](.*)["']\]/g;

/**
 * Used as an argument to createScreenField when no defaultValue should be added (don't use null as it creates a random default value)
 */
export const SCREEN_NO_DEF_VALUE = 'noDefValue$';

/**
 * Used as an argument to createScreenField when defaultValue should be defined but set to null (don't use null as it creates a random default value)
 */
export const SCREEN_NULL_DEF_VALUE = 'nullDefValue$';

export const ATT_SELECTOR_OPERATORS = {
    CONTAINS: '*',
    CONTAINS_WORD: '~',
    STARTS_WITH: '^',
    STARTS_WITH_WORD: '|',
    ENDS_WITH: '$',

    parse: (opValue) => {
        if (opValue) {
            for (const prop in ATT_SELECTOR_OPERATORS) {
                if (ATT_SELECTOR_OPERATORS[prop] === opValue) {
                    return prop;
                }
            }
        }

        return undefined;
    }
};

// Compares value and expected value using operator
/**
 * @param value
 * @param expectedValue
 * @param operator
 */
function check(value = '', expectedValue, operator) {
    if (operator === ATT_SELECTOR_OPERATORS.CONTAINS) {
        return value.indexOf(expectedValue) > -1;
    } else if (operator === ATT_SELECTOR_OPERATORS.CONTAINS_WORD) {
        return (
            value.startsWith(expectedValue + ' ') ||
            value.indexOf(' ' + expectedValue + ' ') > -1 ||
            value.endsWith(' ' + expectedValue)
        );
    } else if (operator === ATT_SELECTOR_OPERATORS.STARTS_WITH) {
        return value.startsWith(expectedValue);
    } else if (operator === ATT_SELECTOR_OPERATORS.STARTS_WITH_WORD) {
        return value.startsWith(expectedValue) || value.startsWith(expectedValue + '-');
    } else if (operator === ATT_SELECTOR_OPERATORS.ENDS_WITH) {
        return value.endsWith(expectedValue);
    }

    return value === expectedValue;
}

/**
 * Screen field type names with default values
 */
const SCREEN_FIELD_TYPES_AND_VALUES = {
    TextBox: { stringValue: 'Default value for TextField' },
    LargeTextArea: { stringValue: 'Default value for LTA' },
    Currency: { numberValue: 17 },
    Number: { numberValue: 13 },
    Date: { dateValue: '2018-02-22T00:00:00.000+0000' },
    Password: { stringValue: 'Default value for Password' },
    Checkbox: { booleanValue: true },
    DisplayText: null
};

const VALUE_TYPE_STATIC = 'static';
const VALUE_TYPE_REF = 'ref';
const VALUE_TYPE_NULL = 'null';

/**
 * @param obj
 * @param prop
 * @param defValue
 */
function booleanValue(obj, prop, defValue) {
    const val = obj[prop];
    // Can't do a simple check of val because if val is false and defValue is
    // true, then we'll accidently return true. Perform this more specific check to
    // make sure.
    return val !== undefined && val !== null ? val : defValue;
}
/**
 * Returns a string value based on the data provided
 *
 * @param {string} value - The value to return, can be null
 * @param {string} defValue - The value to use if the value argument is null
 * @param {boolean} hydrate - Should the value be hydrated
 * @returns {object} {string} - The default value
 */
function getStringValue(value, defValue, hydrate) {
    const val = value && value.length > 0 ? value : defValue;
    return hydrate ? { value: val, error: null } : val;
}

/**
 * Returns a defaultValue
 *  Null
 *  An elementReference
 *  The defaultValue of the type provided
 *
 *  @param {Object} type - The type
 *  @param {string} valueType - The type of value (ref, static or null)
 *  @returns {Object} - The default value or null
 */
function getDefaultValue(type, valueType) {
    if (valueType === VALUE_TYPE_REF) {
        return { elementReference: type + '--VARIABLE_1' };
    } else if (valueType === VALUE_TYPE_STATIC) {
        return SCREEN_FIELD_TYPES_AND_VALUES[type];
    }

    return null;
}

/**
 * Creates a screen to be used for testing
 *
 * @param {string} name - The name of the screen field
 * @param {Function} fieldsProducer - A function to produce an array of screen fields to be used as the fields of the screen
 * @param {object} config - {allowBack = true, allowFinish = true, allowPause = true, showFooter = true, showHeader = true, hydrateValues = true, includeNonMDValues = true, mutateScreen = true}
 * @returns {object} - The screen
 */
function createScreen(name, fieldsProducer, config = {}) {
    const hydrateValues = booleanValue(config, 'hydrateValues', true);
    const includeNonMDValues = booleanValue(config, 'includeNonMDValues', true);
    let screen = {
        label: getStringValue(name, 'Screen 1 Label', false),
        name: getStringValue(name, 'Screen1', false),
        helpText: getStringValue(null, 'Screen 1 Help Text', false),
        showFooter: booleanValue(config, 'showFooter', true),
        showHeader: booleanValue(config, 'showHeader', true),
        pausedText: getStringValue(null, 'Screen 1 Paused Text', false),
        guid: generateGuid(),
        processMetadataValues: [],
        rules: [],
        fields: fieldsProducer()
    };

    if (includeNonMDValues) {
        screen.locationX = 450;
        screen.locationY = 450;
        screen.elementType = ELEMENT_TYPE.SCREEN;
        screen.isCanvasElement = true;
        screen.config = { isSelected: true };
        screen.connectorCount = 0;
        screen.maxConnections = 1;
    }

    if (booleanValue(config, 'mutateScreen', true)) {
        screen = createScreenWithFields(screen);
    }

    if (hydrateValues) {
        const blacklistedProperties = getConfigForElementType(ELEMENT_TYPE.SCREEN).nonHydratableProperties;
        hydrateWithErrors(screen, blacklistedProperties);
    }

    return screen;
}

/**
 * Creates a screen field to be used for testing
 *
 * @param {string} name - The name of the screen field
 * @param {string} typeName - The type of the screen field (see screen field types in screen-editor-utils)
 * @param {string} value - The defaultValue. If null is passed, a random default value will be generated. Pass SCREEN_NO_DEF_VALUE
 *   if the defaultValue should not be set.
 * @param {object} config - {required = false, validation = true, defaultValueType = static, hydrateValues = true,
 * includeNonMDValues = true, valueType = STATIC, dataType = undefined, createChoices = false}
 * @param {boolean} storeOutputAutomatically - Whether or not this field uses automatic output. Defaulted to false
 * @returns {object} - The screen field
 */
export function createTestScreenField(name, typeName, value?, config = {}, storeOutputAutomatically = false) {
    const hydrateValues = booleanValue(config, 'hydrateValues', true);
    const fieldType = typeName === 'Extension' ? getLocalExtensionFieldType(value) : getScreenFieldTypeByName(typeName);

    // If the dataType was specified, use it. (This should only happen for fields where dataType is undefined by default).
    const dataType = getStringValue(config.dataType, undefined, false);
    if (dataType) {
        fieldType.dataType = dataType;
    }

    let field = {
        guid: generateGuid(), // Guids are generated during translation, so they need to be added here for testing
        choiceReferences: [],
        dataType: fieldType.dataType,
        fieldType: fieldType.fieldType,
        fieldText: getStringValue(null, name, hydrateValues),
        helpText: getStringValue('Screen field ' + name + ' help text', null, hydrateValues),
        name: getStringValue(null, name, hydrateValues),
        isRequired: booleanValue(config, 'required', false),
        isVisible: true,
        scale: getStringValue('0', '0', hydrateValues),
        inputParameters: [],
        outputParameters: [],
        processMetadataValues: [],
        fields: []
    };

    if (typeName === 'DisplayText' && value !== SCREEN_NO_DEF_VALUE) {
        const val = value !== null ? value : 'Default display text value';
        field.fieldText = getStringValue(val, null, hydrateValues);
    } else if (typeName === 'Extension') {
        field.extensionName = value;
        // Params made up
        field.outputParameters = [
            {
                value: getStringValue('VARIABLE_5', null, hydrateValues),
                name: getStringValue('attribute1', null, hydrateValues),
                processMetadataValues: []
            }
        ];
        field.inputParameters = [
            {
                value: getStringValue('Attribute value', null, hydrateValues),
                name: getStringValue('attribute1', null, hydrateValues),
                processMetadataValues: []
            }
        ];
        field.storeOutputAutomatically = storeOutputAutomatically;
    } else if (value !== SCREEN_NO_DEF_VALUE) {
        if (value === SCREEN_NULL_DEF_VALUE) {
            field.defaultValue = null;
        } else if (value === null) {
            // Generate value based in type
            field.defaultValue = getDefaultValue(typeName, config.defaultValueType || VALUE_TYPE_STATIC);
        } else if (typeof value !== 'object') {
            // Set the string version of the default value, and the internal version, which
            // specifies what type of field value this is.
            if (
                typeName === ScreenFieldName.TextBox ||
                typeName === ScreenFieldName.LargeTextArea ||
                typeName === ScreenFieldName.Password
            ) {
                field.defaultValue = { stringValue: value };
            } else if (typeName === ScreenFieldName.Number || typeName === ScreenFieldName.Currency) {
                field.defaultValue = { numberValue: value };
            } else if (typeName === ScreenFieldName.Date || typeName === ScreenFieldName.DateTime) {
                field.defaultValue = { dateValue: value };
            } else if (typeName === ScreenFieldName.Checkbox) {
                field.defaultValue = { booleanValue: value };
            }
        } else {
            // Hopefully the object is a well-formed ferov
            field.defaultValue = value;
        }
    }

    field = addConfigOptionsToField(field, name, config, fieldType, hydrateValues);

    return createScreenField(field);
}

/**
 * Helper function for creating a test screen field.
 *
 * @param field
 * @param name
 * @param config
 * @param fieldType
 * @param hydrateValues
 * @returns {*}
 */
function addConfigOptionsToField(field, name, config, fieldType, hydrateValues) {
    // If the field type is Radio, create some choice references.
    if (fieldType.name === FlowScreenFieldType.RadioButtons && booleanValue(config, 'createChoices', false)) {
        for (let i = 0; i < 3; i++) {
            const choiceGuid = 'choice' + i;
            field.choiceReferences[i] = hydrateWithErrors(createChoiceReference(choiceGuid));
        }
    }

    if (booleanValue(config, 'helpText', true)) {
        field.helpText = getStringValue('Screen field ' + name + ' help text', null, hydrateValues);
    }

    if (booleanValue(config, 'validation', true)) {
        field.validationRule = {
            errorMessage: getStringValue(
                "The value you entered doesn't meet the validation criteria for this input field.",
                null,
                hydrateValues
            ),
            formulaExpression: getStringValue("{!Var1} == 'text'", null, hydrateValues)
        };
    } else {
        field.validationRule = {
            errorMessage: hydrateValues ? { value: null, error: null } : null,
            formulaExpression: hydrateValues ? { value: null, error: null } : null
        };
    }

    if (booleanValue(config, 'includeNonMDValues', true)) {
        field.guid = generateGuid();
        field.type = fieldType;
    }

    return field;
}

/**
 * Creates a screen to be used for testing
 *
 * @param {string} name - The name of the screen field
 * @param {string[]} screenFieldTypeNames - The types of the screen fields to be added, pass null if no screen fields are needed. (See screen field types in screen-editor-utils)
 * @param {object} config - {allowBack = true, allowFinish = true, allowPause = true, showFooter = true, showHeader = true, hydrateValues = true, includeNonMDValues = true, mutateScreen = true}
 * @returns {object} - The screen
 */
export function createTestScreen(name, screenFieldTypeNames = [], config = {}) {
    const fieldsProducer = () => {
        const includeNonMDValues = booleanValue(config, 'includeNonMDValues', true);
        const fields = [];
        const types = screenFieldTypeNames ? screenFieldTypeNames : Object.keys(SCREEN_FIELD_TYPES_AND_VALUES);
        for (let i = 0; i < types.length; i++) {
            let defaultValueType = VALUE_TYPE_STATIC;
            if (i % 3 === 1) {
                defaultValueType = VALUE_TYPE_REF;
            } else if (i % 3 === 2) {
                defaultValueType = VALUE_TYPE_NULL;
            }

            const fieldConfig = {
                required: i % 2 === 0,
                validation: i % 4 === 0,
                hydrateValues: false,
                includeNonMDValues,
                defaultValueType
            };
            const val = types[i] === 'Extension' ? 'c:cmpAvailableForFlowScreens' : null;
            const field = createTestScreenField('screenField ' + i, types[i], val, fieldConfig);
            fields.push(field);
        }

        return fields;
    };

    return createScreen(name, fieldsProducer, config);
}

/**
 * Creates a screen to be used for testing
 *
 * @param {string} name - The name of the screen field
 * @param {screenfield[]} screenFields - The screenfields of the screen
 * @param {object} config - {allowBack = true, allowFinish = true, allowPause = true, showFooter = true, showHeader = true, hydrateValues = true, includeNonMDValues = true, mutateScreen = true}
 * @returns {object} - The screen
 */
export function createTestScreenWithFields(name, screenFields = [], config = {}) {
    const fieldsProducer = () => {
        return screenFields;
    };

    return createScreen(name, fieldsProducer, config);
}

/**
 * Returns the child of element that is returned by the selector.
 * element.querySelector(selector), where selector is:
 * tag[attribute<operator>="value"], where operator can be *, |, ^, ~, $ or empty
 *
 * @param {Element} element - The parent element
 * @param {string} selector - The name (tagName) of the child
 * @param {boolean} returnList - If you want a list of matching results returned (vs first one found).
 * @returns {Element} the element or null
 */
export function query(element, selector, returnList) {
    SELECTOR_REGEX.lastIndex = 0;
    const res = SELECTOR_REGEX.exec(selector);
    if (res && res.length === 5) {
        return find(element, res[1], res[2], res[4], ATT_SELECTOR_OPERATORS.parse(res[3]), returnList);
    } else if (selector) {
        return find(element, selector, null, null, null, returnList);
    }

    return null;
}

/**
 * Returns the child of element that contains an attribute with the given value.
 * This would be the equivalent to:
 * element.querySelector('childName[attributeName="attributeValue"]')
 *
 * @param {Element} element - The parent element
 * @param {string} childName - The name (tagName) of the child
 * @param {string} attributeName - The name of the attribute
 * @param {string} attributeValue - The value of the attribute
 * @param {ATT_SELECTOR_OPERATORS} operator - The operation to use for comparing
 * @param {boolean} returnList - If you want a list of matching results returned (vs first one found).
 * @returns {Element} the element or null
 */
export function find(element, childName, attributeName, attributeValue, operator, returnList = false) {
    const results = [];
    for (const child of element.shadowRoot.querySelectorAll(childName)) {
        if (
            !attributeName ||
            (child[attributeName] && check(child[attributeName], attributeValue, ATT_SELECTOR_OPERATORS[operator]))
        ) {
            if (!returnList) {
                return child;
            }
            results.push(child);
        }
    }

    if (returnList) {
        return results;
    }

    return null;
}

/**
 * Returns a drop event used for testing.
 *
 * @returns {event} drop event.
 */
export function createDropEvent() {
    const dropEvent = new CustomEvent('drop');
    dropEvent.dataTransfer = {
        data: {},
        setData(type, val) {
            this.data[type] = val;
        },
        getData(type) {
            return this.data[type];
        }
    };
    return dropEvent;
}
