// @ts-nocheck
import { getComboboxConfig } from 'builder_platform_interaction/baseResourcePicker';
import {
    deleteParameterItem,
    mergeWithInputOutputParameters,
    MERGE_WITH_PARAMETERS,
    removeUnsetParameters,
    REMOVE_UNSET_PARAMETERS,
    updateInputParameterItemConfigurationEditor,
    updateManuallyAssignVariables,
    updateParameterItem
} from 'builder_platform_interaction/calloutEditorLib';
import {
    addItem,
    getErrorFromHydratedItem,
    getValueFromHydratedItem,
    replaceItem,
    updateProperties
} from 'builder_platform_interaction/dataMutationLib';
import { FLOW_DATA_TYPE, getFlowType } from 'builder_platform_interaction/dataTypeLib';
import {
    ConfigurationEditorChangeEvent,
    ConfigurationEditorPropertyDeleteEvent,
    DeleteParameterItemEvent,
    DynamicTypeMappingChangeEvent,
    ManuallyAssignVariablesChangedEvent,
    PropertyChangedEvent,
    UpdateParameterItemEvent
} from 'builder_platform_interaction/events';
import { getParametersForInvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { getDynamicTypeMappingValidation, invocableActionValidation } from './invocableActionValidation';

export const MERGE_WITH_DATA_TYPE_MAPPINGS = 'MERGE_WITH_DATA_TYPE_MAPPINGS';

const invocableActionPropertyChanged = (state, event) => {
    const error =
        event.detail.error === null
            ? invocableActionValidation.validateProperty(event.detail.propertyName, event.detail.value)
            : event.detail.error;
    return updateProperties(state, {
        [event.detail.propertyName]: { value: event.detail.value, error }
    });
};

/**
 * Clears values of field parameters with the specified generic type.
 *
 * @param root0
 * @param root0.actionCallParameters
 * @param root0.invocableActionParameters
 * @param root0.genericTypeName
 */
// TODO: Can we consolidate this with the similar function in screenReducer.js?
const clearGenericParameters = ({ actionCallParameters, invocableActionParameters, genericTypeName }) =>
    actionCallParameters
        .map((actionCallParameter) => ({
            actionCallParameter,
            invocableActionParameter: invocableActionParameters.find(
                (invocableActionParameter) =>
                    invocableActionParameter.name === getValueFromHydratedItem(actionCallParameter.name)
            )
        }))
        .map(({ actionCallParameter, invocableActionParameter }) =>
            invocableActionParameter && invocableActionParameter.sobjectType === genericTypeName
                ? { ...actionCallParameter, value: { value: '', error: null } }
                : actionCallParameter
        );

/**
 * Clears values of input and output parameters of the specified generic type
 * of an action call.
 *
 * @param actionCall
 * @param genericTypeName
 */
function clearGenericActionCallParameters(actionCall, genericTypeName) {
    const { actionName, actionType, inputParameters, outputParameters } = actionCall;
    const invocableActionParams = getParametersForInvocableAction({
        actionName,
        actionType
    });
    const result = {};
    if (inputParameters) {
        result.inputParameters = clearGenericParameters({
            actionCallParameters: inputParameters,
            invocableActionParameters: invocableActionParams.filter(
                (invocableActionParam) => invocableActionParam.isInput
            ),
            genericTypeName
        });
    }
    if (outputParameters) {
        result.outputParameters = clearGenericParameters({
            actionCallParameters: outputParameters,
            invocableActionParameters: invocableActionParams.filter(
                (invocableActionParam) => invocableActionParam.isOutput
            ),
            genericTypeName
        });
    }
    return result;
}

/**
 * @param actionCall
 * @param event
 */
function setDynamicTypeMappingTypeValue(actionCall, event) {
    const { typeName, typeValue, rowIndex, isConfigurable } = event.detail;
    // Find an existing dynamic type mapping by the type name or create new.
    const dataTypeMappings = actionCall.dataTypeMappings || [];
    const index = dataTypeMappings.findIndex((mapping) => getValueFromHydratedItem(mapping.typeName) === typeName);
    const dataTypeMapping =
        index !== -1
            ? dataTypeMappings[index]
            : {
                  typeName: {
                      value: typeName,
                      error: null
                  },
                  rowIndex
              };
    // Check if the value has actually changed
    if (index !== -1 && getValueFromHydratedItem(dataTypeMapping.typeValue) === typeValue) {
        return actionCall;
    }
    // Update the dynamic type mapping with the new value and validate it.
    const validation = getDynamicTypeMappingValidation(dataTypeMapping.rowIndex);
    const newDynamicTypeMapping = updateProperties(dataTypeMapping, {
        typeValue: {
            value: typeValue,
            error: validation.validateProperty('dynamicTypeMapping', typeValue)
        }
    });
    // Update dynamic type mappings in the state and return the new state.
    const newDynamicTypeMappings =
        index !== -1
            ? replaceItem(dataTypeMappings, newDynamicTypeMapping, index)
            : addItem(dataTypeMappings, newDynamicTypeMapping);

    return isConfigurable // not need to clear the params when type mapping is updated from custom property editor
        ? updateProperties(actionCall, {
              dataTypeMappings: newDynamicTypeMappings
          })
        : updateProperties(actionCall, {
              dataTypeMappings: newDynamicTypeMappings,
              ...clearGenericActionCallParameters(actionCall, typeName)
          });
}

/**
 * Creates a list of data type mappings for a given list of generic types. Uses type assignments from
 * the current data type mappings.
 *
 * @param {[GenericType]} [genericTypes] - Generic types
 * @param {*} [dataTypeMappings] - Current data type mappings
 * @param {*} disabled - Indicates if data type mappings are changeable
 * @returns {[{ name, value, rowIndex, comboboxConfig }]} - Collection of data type mapping data
 *  for rendering entity pickers
 */
const createDataTypeMappings = (genericTypes = [], dataTypeMappings = [], disabled = false) =>
    genericTypes.reduce((types, currentType) => {
        const { description: fieldLevelHelp, label, name, superType } = currentType;
        const flowType = getFlowType(superType);
        const type = (flowType && flowType.value) || FLOW_DATA_TYPE.SOBJECT.value;
        const dataTypeMapping =
            dataTypeMappings.find(({ typeName }) => getValueFromHydratedItem(typeName) === name) || {};
        const { typeValue = null, rowIndex = null, typeName = null } = dataTypeMapping;
        return [
            ...types,
            {
                comboboxConfig: getComboboxConfig({
                    label,
                    errorMessage: (typeValue && getErrorFromHydratedItem(typeValue)) || null,
                    required: true,
                    disabled,
                    type,
                    allowSObjectFields: false,
                    fieldLevelHelp
                }),
                typeName: typeName || { value: name, error: null },
                rowIndex: rowIndex || generateGuid(),
                typeValue: typeValue || { value: null, error: null }
            }
        ];
    }, []);

/**
 * merge the data type mappins in original node with all of the action's generic types
 *
 * @param {Object} state the original node
 * @param {*} props - object containing the genericTypes and whether the property editor is in new or in edit mode
 * @returns {Object} the updated node
 */
const mergeWithDataTypeMappings = (state, props) => {
    const dataTypeMappings = createDataTypeMappings(props.genericTypes, state.dataTypeMappings || [], !props.isNewMode);
    state = updateProperties(state, {
        dataTypeMappings
    });
    return state;
};

/**
 * Invocable action reducer, performs changes and validation on a invocable action editor
 *
 * @param {object} state  element / action call node
 * @param {object} event  event to process
 * @param elements
 * @returns {object}    the updated action call node
 */
export const invocableActionReducer = (state, event, elements) => {
    switch (event.type) {
        case PropertyChangedEvent.EVENT_NAME:
            return invocableActionPropertyChanged(state, event);
        case UpdateParameterItemEvent.EVENT_NAME:
            return updateParameterItem(state, event.detail);
        case DeleteParameterItemEvent.EVENT_NAME:
            return deleteParameterItem(state, event.detail);
        case ManuallyAssignVariablesChangedEvent.EVENT_NAME:
            return updateManuallyAssignVariables(state, event.detail);
        case MERGE_WITH_DATA_TYPE_MAPPINGS:
            return mergeWithDataTypeMappings(state, event.detail);
        case MERGE_WITH_PARAMETERS:
            return mergeWithInputOutputParameters(state, event.detail);
        case REMOVE_UNSET_PARAMETERS:
            return removeUnsetParameters(state);
        case DynamicTypeMappingChangeEvent.EVENT_NAME:
            return setDynamicTypeMappingTypeValue(state, event);
        case VALIDATE_ALL:
            return invocableActionValidation.validateAll(state);
        case ConfigurationEditorChangeEvent.EVENT_NAME:
        case ConfigurationEditorPropertyDeleteEvent.EVENT_NAME:
            return updateInputParameterItemConfigurationEditor(state, event.detail, elements);
        default:
            return state;
    }
};
