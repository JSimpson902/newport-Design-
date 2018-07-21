// TODO here to replace the expected error message with a reference to the label file once we have that in place
import { Validation } from 'builder_platform_interaction-validation';
import * as ValidationRules from 'builder_platform_interaction-validation-rules';

const TRAILING_UNDERSCORE_ERROR = ValidationRules.LABELS.shouldNotBeginOrEndWithUnderscores;


describe('Default Validations', () => {
    const validation = new Validation();

    describe('when props set to LABEL', () => {
        it('and when valid string is passed should return - null', () => {
            expect(validation.validateProperty('label', 'valid string')).toBeNull();
        });

        it('and when a empty string is passed should return the error message - {string} Cannot be blank.', () => {
            expect(validation.validateProperty('label', '')).toBe(ValidationRules.LABELS.cannotBeBlank);
        });
    });

    describe('when props set to NAME', () => {
        it('and when valid string is passed should return - null', () => {
            expect(validation.validateProperty('name', 'valid string')).toBeNull();
        });

        it('and when a empty string is passed should return the error message - {string} Cannot be blank.', () => {
            expect(validation.validateProperty('name', '')).toBe(ValidationRules.LABELS.cannotBeBlank);
        });

        it('and when a string has trailing underscores at the end should return the error message- {string} Should not have trailing empty spaces at the beginning or ending.', () => {
            expect(validation.validateProperty('name', 'valid_string_')).toBe(TRAILING_UNDERSCORE_ERROR);
        });

        it('and when a string has trailing underscores at the beginning should return the error message - {string} Should not have trailing underscores to begin with (or) end with (or) should not have consecutive underscores.', () => {
            expect(validation.validateProperty('name', '_valid_string')).toBe(TRAILING_UNDERSCORE_ERROR);
        });
    });
});
describe('runRulesOnData method', () => {
    const validation = new Validation();
    it('returns null if no rule is specified in rules list', () => {
        expect(validation.runRulesOnData({}, '__test data__')).toBeNull();
    });
    it('returns the error message from the first failed rule', () => {
        expect(validation.runRulesOnData([
            ValidationRules.shouldNotBeBlank,
            ValidationRules.shouldNotBeginOrEndWithUnderscores,
            ValidationRules.maximumCharactersLimit(3)
        ], 'testNameWithATrailingUnderScore_')).toBe(TRAILING_UNDERSCORE_ERROR);
    });
});
describe('getMergedRules method', () => {
    const validation = new Validation();
    it('returns the existing/default rules if no additional rules are specified', () => {
        expect(validation.getMergedRules({name:['rule1', 'rule2']})).toEqual({name:['rule1', 'rule2']});
    });
    it('returns the appended set of rules (and inner subkeys) for the same key', () => {
        const ruleSet1 = {
            'name': ['nRule1', 'nRule2'],
            'label': ['lRule1', 'lRule2'],
            'assignmentItems': {
                'leftHandSide' : ['lhsRule1']
            }
        };
        const ruleSet2 = {
            'name': ['nRule3'],
            'assignmentItems': {
                'leftHandSide' : ['lhsRule2'],
                'rightHandSide' : ['rhsRule1']
            }
        };
        const expectedRuleSet = {
            'name' : ['nRule1', 'nRule2', 'nRule3'],
            'label': ['lRule1', 'lRule2'],
            'assignmentItems': {
                'leftHandSide': ['lhsRule1', 'lhsRule2'],
                'rightHandSide': ['rhsRule1']
            }
        };
        expect(validation.getMergedRules(ruleSet1, ruleSet2)).toEqual(expectedRuleSet);
    });
    it('returns the appended keys in rules object if there are different keys in exisitng and additional rules', () => {});
});
describe('validateProperties function', () => {
    it('validates using complex validation rules that include child validation [validation inside validation]', () => {
        const rules = {
            'name'  : [
                ValidationRules.maximumCharactersLimit(30)
            ],
            'fields' : {
                'name' : [
                    ValidationRules.maximumCharactersLimit(25)
                ],
                'type.name="Number"': {
                    'scale' : [
                        ValidationRules.shouldBeAPositiveIntegerOrZero
                    ]
                },
                'type.name="Date"': {
                    name: [
                        ValidationRules.maximumCharactersLimit(50)
                    ],
                    'defaultValue' : [
                        ValidationRules.shouldBeADate
                    ]
                }
            }
        };

        const validationRules = new Validation(rules);

        // Screen
        expect(validationRules.validateProperty('name', 'valueWithNoErrors')).toBeNull();
        expect(validationRules.validateProperty('name', 'valueWithError(> 30 chars)-----')).toEqual(ValidationRules.LABELS.maximumCharactersLimit);

        // Field Name
        expect(validationRules.validateProperty('fields', 'valueWithNoErrors')).toBeNull();
        expect(validationRules.validateProperty('fields.name', 'valueWithError(> 25 chars)')).toEqual(ValidationRules.LABELS.maximumCharactersLimit);

        // Field scale
        expect(validationRules.validateProperty('fields[type.name="Number"].scale', '2')).toBeNull();
        expect(validationRules.validateProperty('fields[type.name="Number"].scale', '2.1')).toEqual(ValidationRules.LABELS.shouldBeAPositiveIntegerOrZero);

        // Field name
        expect(validationRules.validateProperty('fields[type.name="Date"].name', 'valueWithoutError(> 25 chars)')).toBeNull();
        expect(validationRules.validateProperty('fields[type.name="Date"].defaultValue', new Date().toString())).toBeNull();
        expect(validationRules.validateProperty('fields[type.name="Date"].defaultValue', 'valueWithError(NotADate)')).toEqual(ValidationRules.LABELS.mustBeAValidDate);
    });
});
describe('validateAll method', () => {
    it('returns the same object if no applicable rule is present', () => {
        const testObj = {
            name1: {value:' testValue ', error:null},
            label1: {value:'', error: null}
        };
        const validation = new Validation();
        expect(validation.validateAll(testObj)).toBe(testObj);
    });
    it('returns the same object if no rule is failed', () => {
        const testObj = {
            name: {value:'testValueWithNoErrors', error:null},
            label: {value:'testValueWithNoErrors', error: null}
        };
        const validation = new Validation();
        expect(validation.validateAll(testObj)).toBe(testObj);
    });
    it('validates using complex validation rules that include child validation [validation inside validation]', () => {
        const rules = {
            'label' : [
                ValidationRules.maximumCharactersLimit(255)
            ],
            'name'  : [
                ValidationRules.shouldNotBeginWithNumericOrSpecialCharacters,
                ValidationRules.shouldAcceptOnlyAlphanumericCharacters,
                ValidationRules.maximumCharactersLimit(80)
            ],
            'helpText' : [
                ValidationRules.maximumCharactersLimit(20)
            ],
            'fields' : {
                'name' : [
                    ValidationRules.shouldNotBeginWithNumericOrSpecialCharacters,
                    ValidationRules.shouldAcceptOnlyAlphanumericCharacters,
                    ValidationRules.maximumCharactersLimit(80)
                ],
                'type.name="Number"': {
                    'scale' : [
                        ValidationRules.shouldBeAPositiveIntegerOrZero
                    ]
                },
                'type.name="Date"': {
                    'defaultValue' : [
                        ValidationRules.shouldBeADate
                    ]
                }
            }
        };

        const objNoErrors = {
            name: {value:'valueWithNoErrors', error:null},
            label: {value:'valueWithNoErrors', error:null},
            helpText: {value:'valueWithNoErrors', error:null},
            fields: [
                {
                    type: {name: 'Number'},
                    scale: {value:'2', error: null}
                },
                {
                    type: {name: 'Date'},
                    defaultValue: {value:new Date().toString(), error:null}
                }
            ]
        };

        const objWithErrors = {
            name: {value:'valueWithError(trailingSpaces)_', error:null},
            label: {value:'valueWithError(InvalidCharacter)~', error:null},
            helpText: {value:'valueWithNoErrors(tooLong)', error:null},
            fields: [
                {
                    type: {name: 'Number'},
                    scale: {value:'2.1', error: null}
                },
                {
                    type: {name: 'Date'},
                    defaultValue: {value:'valueWithError(notADate)', error:null}

                }
            ]
        };

        const objWithValidationErrors =  {
            name: {error: ValidationRules.LABELS.shouldNotBeginOrEndWithUnderscores, value: 'valueWithError(trailingSpaces)_'},
            label: {error: null, value: 'valueWithError(InvalidCharacter)~'},
            helpText: {error: ValidationRules.LABELS.maximumCharactersLimit, value: 'valueWithNoErrors(tooLong)'},
            fields: [
                {
                    scale: {error: ValidationRules.LABELS.shouldBeAPositiveIntegerOrZero, value: '2.1'},
                    type: {name: 'Number'}
                },
                {
                    defaultValue: {error: ValidationRules.LABELS.mustBeAValidDate, value: 'valueWithError(notADate)'},
                    type: {'name': 'Date'}
                }
            ]
        };

        const validationRules = new Validation(rules);
        expect(validationRules.validateAll(objWithErrors)).toEqual(objWithValidationErrors);
        expect(validationRules.validateAll(objNoErrors)).toEqual(objNoErrors);
    });
    it('returns the object with errors when rules fail at various level of properties', () => {
        // This function is to prove that we can validate RHS using the LHS value
        const validateRHS = (condition) => {
            return () => {
                return 'LHS is ' + condition.leftHandSide.value;
            };
        };
        const additionalRules = {
            outcomes: () => {
                return {
                    name: [ValidationRules.maximumCharactersLimit(10)],
                    conditions: (condition) => {
                        return {
                            leftHandSide: [ValidationRules.maximumCharactersLimit(50), ValidationRules.shouldNotBeBlank],
                            rightHandSide: [validateRHS(condition)],
                        };
                    },
                };
            }
        };
        const testObj = {
            name: {value: 'valueWithError(trailingSpaces)_', error: null},
            label: {value: 'valueWithNoErrors', error: null},
            outcomes : [{
                name: {value: 'valueWithMaximumCharLimitExceeded', error: null},
                devName: {value:'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: '', error:null}
                    },
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    }
                ]
            },
            {
                name: {value: 'RHSError', error: null},
                devName: {value: 'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error: null},
                        rightHandSide: {value: 'valueWithError', error: null},
                    }
                ]
            },
            {
                name: {value: 'valueNoErr', error: null},
                devName: {value:'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    },
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    }
                ]
            }]
        };
        const expectedObjectAfterValidateAll = {
            name: {value: 'valueWithError(trailingSpaces)_', error: TRAILING_UNDERSCORE_ERROR},
            label: {value: 'valueWithNoErrors', error: null},
            outcomes : [{
                name: {value: 'valueWithMaximumCharLimitExceeded', error: ValidationRules.LABELS.maximumCharactersLimit},
                devName: {value:'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: '', error: ValidationRules.LABELS.cannotBeBlank}
                    },
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    }
                ]
            },
            {
                name: {value: 'RHSError', error: null},
                devName: {value: 'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error: null},
                        rightHandSide: {value: 'valueWithError', error: 'LHS is valueWithNoErrors'},
                    }
                ]
            },
            {
                name: {value: 'valueNoErr', error: null},
                devName: {value:'mockValue', error:null},
                conditions: [
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    },
                    {
                        leftHandSide: {value: 'valueWithNoErrors', error:null}
                    }
                ]
            }]
        };
        const validationClassWithAdditionalRules = new Validation(additionalRules);
        expect(validationClassWithAdditionalRules.validateAll(testObj)).toEqual(expectedObjectAfterValidateAll);
    });
});
