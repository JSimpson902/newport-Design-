// @ts-nocheck
import { updateProperties } from 'builder_platform_interaction/dataMutationLib';
import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { variableConstantValidation, getRules } from './variableConstantValidation';

const dataTypeChanged = (state, action) => {
    const value = action.payload.value;
    if (value.isVariable && typeof value.scale !== 'number') {
        value.scale = 2;
    }
    const updatedValues = {
        dataType: { error: null, value: value.dataType },
        scale: value.scale,
        isCollection: value.isCollection
    };
    return updateProperties(state, updatedValues);
};

/**
 * Variable/constant reducer function runs validation rules and returns back the updated variable
 * @param {object} variableOrConstant - element / node state
 * @param {object} action - object containing type and payload eg: {type:"xyz", payload: {propertyName: '', value: '' , error: ''}}
 * @returns {object} variableOrConstant - updated variable/constant
 */
export const variableConstantReducer = (variableOrConstant, action) => {
    switch (action.type) {
        case PROPERTY_EDITOR_ACTION.UPDATE_ELEMENT_PROPERTY: {
            const error =
                action.payload.error ||
                variableConstantValidation.validateProperty(action.payload.propertyName, action.payload.value);
            const propertyValue = {
                error,
                value: action.payload.value
            };
            return updateProperties(variableOrConstant, {
                [action.payload.propertyName]: propertyValue
            });
        }
        case PROPERTY_EDITOR_ACTION.CHANGE_DATA_TYPE:
            return dataTypeChanged(variableOrConstant, action);
        case VALIDATE_ALL:
            return variableConstantValidation.validateAll(variableOrConstant, getRules(variableOrConstant));
        default:
            return variableOrConstant;
    }
};
