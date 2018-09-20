import * as ValidationRules from "builder_platform_interaction/validationRules";
import { Validation } from "builder_platform_interaction/validation";

/**
 * @constant additionalRules - map of propertyName to validation rules
 * @type {Object}
 */
const additionalRules = {
    'stageOrder': [
        ValidationRules.shouldNotBeBlank,
        ValidationRules.shouldBePositiveOrNegativeIntegers
    ]
};

export const stageValidation = new Validation(additionalRules);