// @ts-nocheck
import * as ValidationRules from 'builder_platform_interaction/validationRules';
import { Validation } from 'builder_platform_interaction/validation';
import { CONDITION_LOGIC, RECORD_UPDATE_WAY_TO_FIND_RECORDS } from 'builder_platform_interaction/flowMetadata';

/**
 * Validate the filter item.
 * @return {function} the function to be called with each filter item to return the array of rules.
 */
const validateAssignments = () => ValidationRules.validateExpressionWith2Properties();

/**
 * Validate the filter item. Here we can't use the ValidationRules.validateExpressionWith3Properties because this function allows empty RHS
 * @return {function} the function to be called with each filter item to return the array of rules.
 */
const validateInputReference = (index) => {
    return [
        ValidationRules.shouldNotBeBlank,
        ValidationRules.shouldNotBeNullOrUndefined,
        ValidationRules.validateResourcePicker(index)
    ];
};

/**
 * Validate the filter item.
 * @return {function} the function to be called with each filter item to return the array of rules.
 */
const validateFilter = () => {
    return ValidationRules.validateExpressionWith3PropertiesWithNoEmptyRHS();
};

export const recordUpdateValidation = new Validation();

/**
 * @param {Object} nodeElement the element that need to be validated
 * @return {Object} the override rules
 */
export const getRules = (nodeElement) => {
    const overrideRules = Object.assign({}, recordUpdateValidation.finalizedRules);
    // case where a sObject has been selected
    if (nodeElement.wayToFindRecords.value === RECORD_UPDATE_WAY_TO_FIND_RECORDS.SOBJECT_REFERENCE) {
        overrideRules.inputReference = validateInputReference(nodeElement.inputReferenceIndex);
    } else if (nodeElement.wayToFindRecords.value === RECORD_UPDATE_WAY_TO_FIND_RECORDS.TRIGGERING_RECORD) {
        overrideRules.inputAssignments = validateAssignments();
        overrideRules.filterLogic = [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank];
        // validate filters if filter logic is not equal to 'No conditions'
        if (nodeElement.filterLogic.value !== CONDITION_LOGIC.NO_CONDITIONS) {
            overrideRules.filters = validateFilter();
        }
    } else if (nodeElement.wayToFindRecords.value === RECORD_UPDATE_WAY_TO_FIND_RECORDS.RECORD_LOOKUP) {
        overrideRules.object = validateInputReference(nodeElement.objectIndex);
        if (nodeElement.object.value !== '' && !nodeElement.object.error) {
            overrideRules.inputAssignments = validateAssignments();
            overrideRules.filterLogic = [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank];
            // validate filters if filter logic is not equal to 'No conditions'
            if (nodeElement.filterLogic.value !== CONDITION_LOGIC.NO_CONDITIONS) {
                overrideRules.filters = validateFilter();
            }
        }
    }

    return overrideRules;
};
