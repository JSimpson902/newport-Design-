import * as rules from 'builder_platform_interaction-validation-rules';
import { numberParamCanBeField, stringParam } from 'mock-rule-service';
import { numberVariableGuid, accountSObjectVariableGuid, assignmentElementGuid, assignmentElementName } from 'mock-store-data';
import { mockAccountFields } from 'mock-server-entity-data';
import { EXPRESSION_PROPERTY_TYPE } from 'builder_platform_interaction-expression-utils';
import { getRHSTypes } from 'builder_platform_interaction-rule-lib';
import { LABELS } from '../validation-rules-labels';

jest.mock('builder_platform_interaction-rule-lib', () => {
    return {
        getRulesForContext: jest.fn().mockReturnValue([]),
        elementToParam: require.requireActual('builder_platform_interaction-rule-lib').elementToParam,
        isMatch: require.requireActual('builder_platform_interaction-rule-lib').isMatch,
        getRHSTypes: jest.fn(),
    };
});

// Mocking out the fetch function to return Account fields
jest.mock('builder_platform_interaction-server-data-lib', () => {
    return {
        fetch: jest.fn().mockImplementation((actionType, callback) => {
            callback({
                data: JSON.stringify(mockAccountFields),
            });
        }),
        SERVER_ACTION_TYPE: require.requireActual('builder_platform_interaction-server-data-lib').SERVER_ACTION_TYPE,
    };
});

describe('shouldNotBeBlank method', () => {
    it('should return null with a non blank value', () => {
        expect(rules.shouldNotBeBlank('test value')).toBeNull();
    });
    it('should return an error message with a blank value', () => {
        expect(rules.shouldNotBeBlank('')).toBe(LABELS.cannotBeBlank);
    });
});
describe('shouldNotBeginOrEndWithUnderscores method', () => {
    it('should return null when the value does not start or end with an underscore', () => {
        expect(rules.shouldNotBeginOrEndWithUnderscores('test value')).toBeNull();
    });
    it('should return an error message when the value starts with an underscore', () => {
        expect(rules.shouldNotBeginOrEndWithUnderscores('_test value')).toBe(LABELS.shouldNotBeginOrEndWithUnderscores);
    });
    it('should return an error message when the value ends with an underscore', () => {
        expect(rules.shouldNotBeginOrEndWithUnderscores('test value_')).toBe(LABELS.shouldNotBeginOrEndWithUnderscores);
    });
    it('should return null when the value ends with _0', () => {
        expect(rules.shouldNotBeginOrEndWithUnderscores('Assignment_0')).toBeNull();
    });
});
describe('shouldAcceptOnlyAlphanumericOrSpecialCharacters method', () => {
    it('should return null when the input has only alphanumeric or special characters', () => {
        expect(rules.shouldAcceptOnlyAlphanumericOrSpecialCharacters('Aa23$%&^*')).toBeNull();
    });
    it('should return an error message when the input has non alphanumeric or non-special characters', () => {
        expect(rules.shouldAcceptOnlyAlphanumericOrSpecialCharacters('°°°°°°°°°°')).toBe(LABELS.shouldAcceptOnlyAlphanumericOrSpecialCharacters);
    });
});
describe('shouldNotBeginWithNumericOrSpecialCharacters method', () => {
    it('should return null when the input does not begin with numeric or special characters', () => {
        expect(rules.shouldNotBeginWithNumericOrSpecialCharacters('s123')).toBeNull();
    });
    it('should return an error message when the input begins with numeric characters', () => {
        expect(rules.shouldNotBeginWithNumericOrSpecialCharacters('123s')).toBe(LABELS.shouldNotBeginWithNumericOrSpecialCharacters);
    });
    it('should return an error message when the input begins with special characters', () => {
        expect(rules.shouldNotBeginWithNumericOrSpecialCharacters('#123s')).toBe(LABELS.shouldNotBeginWithNumericOrSpecialCharacters);
    });
});
describe('shouldAcceptOnlyAlphanumericCharacters method', () => {
    it('should return null when the input contains only alphanumeric characters', () => {
        expect(rules.shouldAcceptOnlyAlphanumericCharacters('AlphanumericOnly1234')).toBeNull();
    });
    it('should return an error when the input contains non-alphanumeric characters', () => {
        expect(rules.shouldAcceptOnlyAlphanumericCharacters('aa*^*^')).toBe(LABELS.shouldAcceptOnlyAlphanumericCharacters);
    });
});
describe('shouldBeAPositiveIntegerOrZero method', () => {
    it('should return null when the input contains a positive integer or 0', () => {
        expect(rules.shouldBeAPositiveIntegerOrZero('1')).toBeNull();
        expect(rules.shouldBeAPositiveIntegerOrZero('0')).toBeNull();
    });
    it('should return an error when the input contains a negative integer, a float or NaN', () => {
        expect(rules.shouldBeAPositiveIntegerOrZero('-1')).toBe(LABELS.shouldBeAPositiveIntegerOrZero);
        expect(rules.shouldBeAPositiveIntegerOrZero('1.01')).toBe(LABELS.shouldBeAPositiveIntegerOrZero);
        expect(rules.shouldBeAPositiveIntegerOrZero('1AF')).toBe(LABELS.shouldBeAPositiveIntegerOrZero);
    });
});
describe('shouldBeADate method', () => {
    it('should return null when the input contains a valid date string', () => {
        expect(rules.shouldBeADate(new Date().toString())).toBeNull();
    });
    it('should return an error when the input contains non-alphanumeric characters', () => {
        expect(rules.shouldBeADate('aaa')).toBe(LABELS.mustBeAValidDate);
        expect(rules.shouldBeADate('13/13/13')).toBe(LABELS.mustBeAValidDate);
    });
});
describe('maximumCharactersLimit method', () => {
    const charLimit = 12;
    it('should return null if the input is within the character limit', () => {
        expect(rules.maximumCharactersLimit(charLimit)('right input')).toBeNull();
    });
    it('should return an error message if the input exceeds the character limit', () => {
        expect(rules.maximumCharactersLimit(charLimit)('wrong input which exceeds character limit')).toBe(LABELS.maximumCharactersLimit);
    });
});
describe('validateExpressionWith3Properties', () => {
    it('should always return an object containing LHS rule shouldNotBeBlank', () => {
        const rulesObject = rules.validateExpressionWith3Properties()(
            {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {},
                [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {},
                [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {}
            });
        expect(rulesObject).toMatchObject({[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: [rules.shouldNotBeBlank]});
    });
    it('should return an object containing operator rule if LHS is populated', () => {
        const rulesObject = rules.validateExpressionWith3Properties()(
            {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {value: 'populated'},
                [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {},
                [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {}
            });
        expect(rulesObject).toMatchObject({[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: [rules.shouldNotBeBlank], [EXPRESSION_PROPERTY_TYPE.OPERATOR]: [rules.shouldNotBeBlank]});
    });
    it('should not contain RHS rule if LHS, operator, and RHS are all populated', () => {
        const rulesObject = rules.validateExpressionWith3Properties()(
            {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {value: 'populated'},
                [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {value: 'populated'},
                [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {value: 'populated'}
            });
        expect(rulesObject).toEqual({[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: [rules.shouldNotBeBlank], [EXPRESSION_PROPERTY_TYPE.OPERATOR]: [rules.shouldNotBeBlank]});
    });
});
describe('RHS validation', () => {
    beforeAll(() => {
        getRHSTypes.mockReturnValue({
            String : [stringParam],
            Number : [numberParamCanBeField],
        });
    });

    it('allows null when valid', () => {
        const rulesArray = rules.validateExpressionWith3Properties({elementType: 'ASSIGNMENT'})(
            {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {value: numberVariableGuid},
                [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {value:'ASSIGN'},
                [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {}
            });
        const result = rulesArray.rightHandSide[0]();
        expect(result).toBeNull();
    });
    it('allows null when valid with sobject field', () => {
        const rulesArray = rules.validateExpressionWith3Properties({elementType: 'ASSIGNMENT'})(
            {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {value: accountSObjectVariableGuid + '.Name'},
                [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {value:'ASSIGN'},
                [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {}
            });
        const result = rulesArray.rightHandSide[0]();
        expect(result).toBeNull();
    });
});

describe('isUniqueDevNameInStore method', () => {
    it('returns null when a unique dev name is tested against store data', () => {
        const uniqueName = 'idiosyncraticName';
        expect(rules.isUniqueDevNameInStore(uniqueName)).toBeNull();
    });
    it('returns null when a unique dev name is tested against store data while using the listOfGuidsToSkip param', () => {
        expect(rules.isUniqueDevNameInStore(assignmentElementName, [assignmentElementGuid])).toBeNull();
    });
    it('returns an error when the dev name is not unique (uniqueness is case insensitive)', () => {
        expect(rules.isUniqueDevNameInStore(assignmentElementName.toUpperCase())).toBe(LABELS.fieldNotUnique);
    });
});