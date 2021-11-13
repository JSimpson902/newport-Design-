import * as ValidationRules from 'builder_platform_interaction/validationRules';
import { CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';
import { Validation } from 'builder_platform_interaction/validation';
import { Store } from 'builder_platform_interaction/storeLib';

/**
 * Validate the collectionReferenceIndex item.
 *
 * @param elements all elements in store
 * @returns list of function
 */
export const validateCollectionReference = (elements) => {
    return [
        ValidationRules.shouldNotBeBlank,
        ValidationRules.shouldNotBeNullOrUndefined,
        ValidationRules.shouldReferenceACollection(elements, false)
    ];
};

// this rule avoids empty RHS
const validateFilterItems = () => ValidationRules.validateExpressionWith3PropertiesWithNoEmptyRHS();

const additionalRules = {
    conditionLogic: [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank],
    assignNextValueToReference: [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank]
};

export const filterValidation = new Validation(additionalRules);

/**
 * Build specific overridden rules
 *
 * @param state {Object}
 * @returns {Object} the overridden rules
 */
export const getRules = (state) => {
    const overriddenRules = { ...filterValidation.finalizedRules };
    const elements = Store.getStore().getCurrentState().elements;

    overriddenRules.collectionReference = validateCollectionReference(elements);

    if (state.conditionLogic.value === CONDITION_LOGIC.FORMULA) {
        overriddenRules.formula = [
            ValidationRules.maximumCharactersLimit(3900),
            ValidationRules.shouldNotBeBlank,
            ValidationRules.isValidFormulaExpression
        ];
    } else {
        overriddenRules.conditions = validateFilterItems();
    }
    return overriddenRules;
};
