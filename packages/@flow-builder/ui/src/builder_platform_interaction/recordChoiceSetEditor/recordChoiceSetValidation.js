import * as ValidationRules from 'builder_platform_interaction/validationRules';
import { Validation } from 'builder_platform_interaction/validation';
import { RECORD_FILTER_CRITERIA, SORT_ORDER } from 'builder_platform_interaction/recordEditorLib';
import { EXPRESSION_PROPERTY_TYPE } from "builder_platform_interaction/expressionUtils";
const additionalRules = {
    object: [
        ValidationRules.shouldNotBeNullOrUndefined,
        ValidationRules.shouldNotBeBlank,
    ],
    limit: [
        ValidationRules.shouldBeInRange(1, 200)
    ]
};
/**
 * Validate the filter item. Here we can't use the ValidationRules.validateExpressionWith3Properties because this function allows empty RHS
 * @return {function} the function to be called with each filter item to return the array of rules.
 */
const validateFilter = () => {
    return (filter) => {
        const rules = {
            [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: [ValidationRules.shouldNotBeBlank]
        };
        if (filter[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE].value) {
            rules[EXPRESSION_PROPERTY_TYPE.OPERATOR] = [ValidationRules.shouldNotBeBlank];
            if (filter[EXPRESSION_PROPERTY_TYPE.OPERATOR].value) {
                rules[EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE] = [ValidationRules.shouldNotBeBlank];
            }
        }
        return rules;
    };
};

/**
 * Validate the outputAssignments item. We only need to validate when either LHS or RHS is filled.
 * @return {function} the function to be called with each outputAssignment item to return the array of rules.
 */
const validateOutputAssignments = () => {
    return (outputAssignment) => {
        const rules = {};

        if (outputAssignment[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE].value) {
            rules[EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE] = [ValidationRules.shouldNotBeBlank];
        }

        if (outputAssignment[EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE].value) {
            rules[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE] = [ValidationRules.shouldNotBeBlank];
        }

        return rules;
    };
};

export const recordChoiceSetValidation = new Validation(additionalRules);
export const getRules = (recordChoice, showSecondSection) => {
    const overrideRules = Object.assign({}, recordChoiceSetValidation.finalizedRules);
    overrideRules.object.push(ValidationRules.validateResourcePicker(recordChoice.objectIndex));
    if (recordChoice.filterType && recordChoice.filterType.value === RECORD_FILTER_CRITERIA.ALL) {
        overrideRules.filters = validateFilter();
    }

    // validate sortField when sortOrder !== NOT_SORTED
    if (recordChoice.sortOrder.value !== SORT_ORDER.NOT_SORTED) {
        overrideRules.sortField = [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank];
    }

    // Validating the following fields only after the second section is made visible
    if (showSecondSection) {
        overrideRules.displayField = [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank];
        overrideRules.dataType = [ValidationRules.shouldNotBeNullOrUndefined, ValidationRules.shouldNotBeBlank];
        overrideRules.outputAssignments = validateOutputAssignments();
    }

    return overrideRules;
};