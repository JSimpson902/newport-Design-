import * as ValidationRules from 'builder_platform_interaction-validation-rules';
import { Validation } from 'builder_platform_interaction-validation';

/**
 * @constant additionalRules - map of propertyName to validation rules
 * @type {Object}
 */
const additionalRules = {
    'name'  : [
        ValidationRules.shouldNotBeginWithNumericOrSpecialCharacters,
        ValidationRules.shouldAcceptOnlyAlphanumericCharacters,
        ValidationRules.maximumCharactersLimit(80)
    ],
    'dataType': [ValidationRules.shouldNotBeNullOrUndefined],
    'expression' : [
        ValidationRules.maximumCharactersLimit(3900),
        ValidationRules.shouldNotBeBlank
    ]
};

export const formulaValidation = new Validation(additionalRules);