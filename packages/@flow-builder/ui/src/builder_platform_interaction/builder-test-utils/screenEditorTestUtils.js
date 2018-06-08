import { generateGuid } from 'builder_platform_interaction-store-lib';
import { getScreenFieldTypeByName } from 'builder_platform_interaction-screen-editor-utils';
import { mutateScreen, demutateScreen } from 'builder_platform_interaction-data-mutation-lib';
/**
 * Used as an argument to createScreenField when no defaultValue should be added (don't use null as it creates a random default value)
 */
export const SCREEN_NO_DEF_VALUE = 'noDefValue$';

/**
 * Screen field type names with default values
 */
const SCREEN_FIELD_TYPES_AND_VALUES = {
    TextBox: {stringValue:'Default value for TextField'},
    LargeTextArea: {stringValue:'Default value for LTA'},
    Currency: {numberValue:17},
    Number: {numberValue:13},
    Date: {dateValue:'2018-02-22T00:00:00.000+0000'},
    Password: {stringValue:'Default value for Password'},
    Checkbox: {booleanValue:true},
    DisplayText: null,
    Extension: null
};

const VALUE_TYPE_STATIC = 'static';
const VALUE_TYPE_REF = 'ref';
const VALUE_TYPE_NULL = 'null';

function booleanValue(obj, prop, defValue) {
    const val = obj[prop];
    return val ? val : defValue;
}
/**
 * Returns a string value based on the data provided
 * @param {string} value - The value to return, can be null
 * @param {string} defValue - The value to use if the value argument is null
 * @param {boolean} hydrate - Should the value be hydrated
 * @returns {object} {string} - The default value
 */
function getStringValue(value, defValue, hydrate) {
    const val = (value && value.length > 0) ? value : defValue;
    return hydrate ? {value: val, error: null} : val;
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
        return {elementReference:'VARIABLE_1'};
    } else if (valueType === VALUE_TYPE_STATIC) {
        return SCREEN_FIELD_TYPES_AND_VALUES[type];
    }

    return null;
}

/**
 * Creates a screen field to be used for testing
 * @param {string} name - The name of the screen field
 * @param {string} type - The type of the screen field (see screen field types in screen-editor-utils)
 * @param {string} value - The value, if null is passed a random default value will be generated, pass SCREEN_NO_DEF_VALUE if the value should not be set.
 * @param {objec} config - {required = false, helpText = true, validation = true, defaultValueType = static, hydrateValues = true, includeNonMDValues = true, valueType = STATIC}
 * @returns {object} - The screen field
 */
export function createTestScreenField(name, type, value, config = {}) {
    const hydrateValues = booleanValue(config, 'hydrateValues', true);
    const fieldType = getScreenFieldTypeByName(type);
    const field = {
        choiceReferences: [],
        dataType: fieldType.dataType,
        fieldType:fieldType.fieldType,
        fieldText: getStringValue(null, name, hydrateValues),
        name: getStringValue(null, name, hydrateValues),
        isRequired:booleanValue(config, 'required', false),
        isVisible:true,
        scale:0,
        inputParameters:[],
        outputParameters:[],
        processMetadataValues:[]
    };

    if (booleanValue(config, 'helpText', true)) {
        field.helpText = getStringValue('Screen field ' + name + ' help text', null, hydrateValues);
    }

    if (booleanValue(config, 'validation', true)) {
        screen.validationRule = {
            errorMessage: getStringValue('The value you entered doesn\'t meet the validation criteria for this input field.', null, hydrateValues),
            formulaExpression: getStringValue('{!Var1} == \'text\'', null, hydrateValues)
        };
    }

    if (booleanValue(config, 'includeNonMDValues', true)) {
        field.guid = generateGuid();
        field.type = fieldType;
    }

    if (type === 'DisplayText' && value !== SCREEN_NO_DEF_VALUE) {
        const val = value !== null ? value : 'Default display text value';
        field.fieldText = getStringValue(val, null, hydrateValues);
    } else if (type === 'Extension') {
        field.extensionName = value;
        // Params made up
        screen.outputParameters = [{
            assignToReference: getStringValue('VARIABLE_5', null, hydrateValues),
            name: getStringValue('attribute1', null, hydrateValues),
            processMetadataValues:[]
        }];
        screen.inputParameters = [{
            value: getStringValue('Attribute value', null, hydrateValues),
            name: getStringValue('attribute1', null, hydrateValues),
            processMetadataValues:[]
        }];
    } else if (value !== SCREEN_NO_DEF_VALUE) {
        if (value === null) { // Generate value based in type
            field.defaultValue = getDefaultValue(type, config.defaultValueType || VALUE_TYPE_STATIC);
        } else if (typeof value !== 'object') {
            if (type === 'TextBox' ||  type === 'LargeTextArea' || type === 'Password') {
                field.defaultValue = {stringValue:value};
            } else if (type === 'Number' || type === 'Currency') {
                field.defaultValue = {numberValue:value};
            } else if (type === 'Date' || type === 'DateTime') {
                field.defaultValue = {dateValue:value};
            } else if (type === 'Checkbox') {
                field.defaultValue = {booleanValue:value};
            }
        } else {
            // Hopefully the object is a well-formed ferov
            field.defaultValue = value;
        }
    }

    return field;
}

/**
 * Creates a screen to be used for testing
 * @param {string} name - The name of the screen field
 * @param {string[]} screenFieldTypeNames - The types of the screen fields to be added, pass null if no screen fields are needed. (See screen field types in screen-editor-utils)
 * @param {object} config - {allowBack = true, allowFinish = true, allowPause = true, showFooter = true, showHeader = true, hydrateValues = true, includeNonMDValues = true, mutateScreen = true}
 * @returns {object} - The screen
 */
export function createTestScreen(name, screenFieldTypeNames = [], config = {}) {
    const hydrateValues = booleanValue(config, 'hydrateValues', true);
    const includeNonMDValues = booleanValue(config, 'includeNonMDValues', true);
    const screen = {
        allowBack:booleanValue(config, 'allowBack', true),
        allowFinish:booleanValue(config, 'allowFinish', true),
        allowPause:booleanValue(config, 'allowPause', true),
        label: getStringValue(name, 'Screen 1 Label', hydrateValues),
        name: getStringValue(name, 'Screen1', hydrateValues),
        helpText: getStringValue(null, 'Screen 1 Help Text', hydrateValues),
        showFooter:booleanValue(config, 'showFooter', true),
        showHeader:booleanValue(config, 'showHeader', true),
        guid:generateGuid(),
        processMetadataValues:[],
        rules:[],
        fields: []
    };

    if (includeNonMDValues) {
        screen.locationX = 450;
        screen.locationY = 450;
        screen.elementType = 'SCREEN';
        screen.isCanvasElement = true;
        screen.config = {isSelected:true};
        screen.connectorCount = 0;
        screen.maxConnections = 1;
    }

    const types = screenFieldTypeNames ? screenFieldTypeNames : Object.keys(SCREEN_FIELD_TYPES_AND_VALUES);
    for (let i = 0; i < types.length; i++) {
        let defaultValueType = VALUE_TYPE_STATIC;
        if (i % 3 === 1) {
            defaultValueType = VALUE_TYPE_REF;
        } else if (i % 3 === 2) {
            defaultValueType = VALUE_TYPE_NULL;
        }

        const fieldConfig = {required: (i % 2 === 0), helpText: (i % 3 === 0), validation: (i % 4 === 0), hydrateValues, includeNonMDValues, defaultValueType};
        const val = types[i] === 'Extension' ? 'c:cmpAvailableForFlowScreens' : null;
        const field = createTestScreenField('screenField ' + i, types[i], val, fieldConfig);
        screen.fields.push(field);
    }

    if (booleanValue(config, 'mutateScreen', true)) {
        mutateScreen(screen);
    }

    return screen;
}

/**
 * Mutates the screen using the data mutation lib
 * @param {object} screen - The screen to mutate
 * @returns {object} the mutated screen
 */
export function mutateTestScreen(screen) {
    return mutateScreen(screen);
}

/**
 * Demutates the screen using the data mutation lib
 * @param {object} screen - The screen to demutate
 * @returns {object} the demutated screen
 */
export function demutateTestScreen(screen) {
    return demutateScreen(screen);
}