import {
    isTextAreaField,
    isChoiceField,
    isExtensionField,
    isPicklistField,
    getLocalExtensionFieldType,
    getScreenFieldTypeByName,
    getScreenFieldType
} from 'builder_platform_interaction/screenEditorUtils';
import { createFEROV, createFEROVMetadataObject } from './ferov';
import {
    createInputParameter,
    createInputParameterMetadataObject
} from './inputParameter';
import {
    createOutputParameter,
    createOutputParameterMetadataObject
} from './outputParameter';
import {
    baseElement,
    createCondition,
    automaticOutputHandlingSupport
} from './base/baseElement';

import { createConditionMetadataObject } from './base/baseMetadata';

import {
    CONDITION_LOGIC,
    ELEMENT_TYPE
} from 'builder_platform_interaction/flowMetadata';
import {
    DEFAULT_VALUE_PROPERTY,
    DEFAULT_VALUE_DATA_TYPE_PROPERTY
} from './variable';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import { createValidationRuleObject } from './base/baseValidationInput';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { createDataTypeMappingsMetadataObject, createDynamicTypeMappings } from './dynamicTypeMapping';

const elementType = ELEMENT_TYPE.SCREEN_FIELD;

export function createScreenField(screenField = {}, isNewField = false) {
    const newScreenField = baseElement(screenField);
    const {
        fieldText = '',
        extensionName,
        fieldType,
        helpText = '',
        defaultValue,
        defaultValueDataType,
        defaultValueIndex = generateGuid(),
        defaultSelectedChoiceReference,
        dataTypeMappings
    } = screenField;
    let {
        type,
        scale,
        validationRule,
        inputParameters,
        dataType,
        isRequired = false,
        isVisible,
        outputParameters,
        choiceReferences = [],
        storeOutputAutomatically,
        visibilityRule,
        dynamicTypeMappings
    } = screenField;
    if (isExtensionField(screenField)) {
        // Assign local extension type (using a local version of the field type that will be replaced when the real one is retrieved from the server
        type =
            getScreenFieldTypeByName(screenField.extensionName) ||
            getLocalExtensionFieldType(screenField.extensionName);
        isRequired = true;
        dynamicTypeMappings = createDynamicTypeMappings(dataTypeMappings || dynamicTypeMappings);
        inputParameters = inputParameters
            .filter(inputParameter => !!inputParameter.value)
            .map(inputParameter => createInputParameter(inputParameter));
        if (storeOutputAutomatically) {
            dataType = FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value;
            outputParameters = [];
        } else {
            storeOutputAutomatically = false;
            dataType = undefined;
            outputParameters = outputParameters.map(
                outputParameter => createOutputParameter(outputParameter)
            );
        }
    } else {
        storeOutputAutomatically = undefined;
        type = getScreenFieldType(screenField);
        inputParameters = [];
        outputParameters = [];
        dynamicTypeMappings = undefined;
        // Picklist fields are always required at runtime since they always default to one of the options and there's no way to select a null or empty value option
        // To reflect this behavior in the builder, we default isRequired to true and make the checkbox disabled in the screen field property editor
        if (isPicklistField(screenField)) {
            isRequired = true;
        }
    }

    let defaultValueFerovObject;
    if (!defaultValueDataType) {
        // Temporary workaround to fix W-5886211
        // Todo: Update this as a part of W-5902485
        let updatedDefaultValue = defaultValue;
        if (
            isTextAreaField(screenField) &&
            defaultValue &&
            defaultValue.elementReference
        ) {
            updatedDefaultValue = {
                stringValue: `{!${defaultValue.elementReference}}`
            };
        }

        defaultValueFerovObject = createFEROV(
            updatedDefaultValue,
            DEFAULT_VALUE_PROPERTY,
            DEFAULT_VALUE_DATA_TYPE_PROPERTY
        );
    }

    choiceReferences = choiceReferences.map(choiceReference =>
        createChoiceReference(choiceReference)
    );

    // Convert scale property to string, which is needed for validation purposes.
    // Saving it as a string allows it be hydrated.
    if (scale != null && typeof scale === 'number') {
        scale = scale.toString();
    }

    if (validationRule && validationRule.formulaExpression) {
        validationRule = createValidationRuleObject(validationRule);
    } else {
        validationRule = { formulaExpression: null, errorMessage: null };
    }

    visibilityRule = createVisibilityRuleObject(visibilityRule);

    if (screenField.hasOwnProperty('isVisible')) {
        isVisible = screenField.isVisible;
    }

    if (dynamicTypeMappings) {
        dynamicTypeMappings = { dynamicTypeMappings };
    }

    return Object.assign(
        newScreenField,
        {
            choiceReferences,
            dataType,
            defaultValue,
            defaultValueDataType,
            defaultValueIndex,
            validationRule,
            extensionName,
            fieldType,
            fieldText,
            helpText,
            inputParameters,
            isVisible,
            isNewField,
            isRequired,
            outputParameters,
            scale,
            type,
            elementType,
            defaultSelectedChoiceReference,
            visibilityRule,
        },
        dynamicTypeMappings,
        storeOutputAutomatically !== undefined
            ? { storeOutputAutomatically }
            : {},
        defaultValueFerovObject
    );
}

/**
 * Creates an empty screen field of the given type
 * @param {String} typeName - The field type
 * @return {object} - The new screen field
 */
export function createEmptyScreenFieldOfType(typeName) {
    const type = getScreenFieldTypeByName(typeName);

    const newScreenField = {
        isRequired: type.dataType === 'Boolean' ? true : false,
        defaultValue: '',
        dataType: type.dataType,
        extensionName: type.name,
        fieldType: type.fieldType,
        scale: '0', // Store as string for validation purposes.
        inputParameters: [],
        outputParameters: [],
        validationRule: {
            formulaExpression: '',
            errorMessage: ''
        },
        storeOutputAutomatically:
            automaticOutputHandlingSupport()
    };

    // Always add a placeholder choice for any choice based fields.
    if (
        type.name === 'RadioButtons' ||
        type.name === 'MultiSelectCheckboxes' ||
        type.name === 'DropdownBox' ||
        type.name === 'MultiSelectPicklist'
    ) {
        newScreenField.choiceReferences = [''];
    }

    return createScreenField(newScreenField, true);
}

export function createScreenFieldMetadataObject(screenField) {
    if (!screenField) {
        throw new Error('screenField is not defined');
    }

    // Unflatten these properties.
    const {
        extensionName,
        defaultValue,
        helpText,
        isRequired,
        fieldText,
        fieldType,
        name,
        validationRule,
        defaultSelectedChoiceReference,
        visibilityRule,
        dynamicTypeMappings
    } = screenField;
    let {
        dataType,
        scale,
        inputParameters,
        outputParameters,
        choiceReferences,
        storeOutputAutomatically
    } = screenField;

    // Convert scale back to number. MD expects this to be a number, but within FlowBuilder, we want it to be a string.
    if (scale != null && typeof scale === 'string') {
        scale = Number(scale);
    }

    let defaultValueMetadataObject;
    if (defaultValue) {
        const defaultValueFerov = createFEROVMetadataObject(
            screenField,
            DEFAULT_VALUE_PROPERTY,
            DEFAULT_VALUE_DATA_TYPE_PROPERTY
        );
        defaultValueMetadataObject = { defaultValue: defaultValueFerov };
    }

    let dataTypeMappings;
    if (isExtensionField(screenField)) {
        inputParameters = inputParameters.map(inputParameter =>
            createInputParameterMetadataObject(inputParameter)
        );
        if (
            storeOutputAutomatically &&
            automaticOutputHandlingSupport()
        ) {
            outputParameters = [];
            dataType = undefined;
        } else if (
            storeOutputAutomatically &&
            !automaticOutputHandlingSupport()
        ) {
            // if the user save the flow and change the process type which doesn't support the automatic output handling,
            // then we need to set the property storeOutputAutomatically to undefined.
            outputParameters = [];
            storeOutputAutomatically = undefined;
            dataType = undefined;
        } else {
            outputParameters = outputParameters.map(outputParameter =>
                createOutputParameterMetadataObject(outputParameter)
            );
            storeOutputAutomatically = undefined;
        }
        dataTypeMappings = createDataTypeMappingsMetadataObject(dynamicTypeMappings);
    }

    choiceReferences = choiceReferences.map(choiceReference =>
        createChoiceReferenceMetadatObject(choiceReference)
    );

    if (dataTypeMappings) {
        dataTypeMappings = { dataTypeMappings };
    }

    const mdScreenField = Object.assign(
        {},
        {
            choiceReferences,
            dataType,
            fieldText,
            fieldType,
            helpText,
            inputParameters,
            isRequired,
            name,
            outputParameters,
            scale
        },
        dataTypeMappings,
        storeOutputAutomatically !== undefined
            ? { storeOutputAutomatically }
            : {},
        defaultValueMetadataObject
    );

    let { conditions } = visibilityRule;

    if (conditions.length > 0) {
        conditions = conditions.map(condition =>
            createConditionMetadataObject(condition)
        );
        Object.assign(mdScreenField, {
            visibilityRule: {
                conditionLogic: visibilityRule.conditionLogic,
                conditions
            }
        });
    }

    // Only allowed when the field type is extension.
    if (isExtensionField(screenField)) {
        mdScreenField.extensionName = extensionName;
    }

    if (validationRule && validationRule.formulaExpression) {
        mdScreenField.validationRule = createValidationRuleObject(
            validationRule
        );
    }

    if (isChoiceField(screenField)) {
        mdScreenField.defaultSelectedChoiceReference = defaultSelectedChoiceReference;
    }

    return mdScreenField;
}

export function createChoiceReference(choiceReference) {
    let newChoiceReference;
    if (!choiceReference) {
        newChoiceReference = '';
    } else {
        newChoiceReference = choiceReference.choiceReference || choiceReference;
    }
    return {
        choiceReference: newChoiceReference
    };
}

function createChoiceReferenceMetadatObject(choiceReferenceObject) {
    const { choiceReference } = choiceReferenceObject;
    if (!choiceReference) {
        throw new Error('Choice reference is not defined');
    }
    const { name } = getElementByGuid(choiceReference);
    return name;
}

function createVisibilityRuleObject(visibilityRule) {
    if (!visibilityRule) {
        return {
            conditionLogic: CONDITION_LOGIC.NO_CONDITIONS,
            conditions: []
        };
    }

    const { conditions, conditionLogic } = visibilityRule;
    return {
        conditions: conditions.map(condition => createCondition(condition)),
        conditionLogic
    };
}
