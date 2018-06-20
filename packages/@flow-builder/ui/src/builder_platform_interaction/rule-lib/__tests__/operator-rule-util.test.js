import { isMatch, getLHSTypes, getOperators, getRHSTypes } from 'builder_platform_interaction-rule-lib';
import { mockRules, dateParam, stageParam, stringParam, numberParamMustBeField, numberParamCannotBeField, numberParamCanBeField,
    dateCollectionParam, dateParamMissingCollection, dateParamMustBeElements, dateParamCannotBeElements,
    dateParamNoElementsList } from 'mock-rule-service';
import { elements, dateVariableGuid, dateCollectionVariableGuid, stageGuid, stringVariableGuid, accountSObjectVariableGuid,
    hydratedElements } from 'mock-store-data';
import { RULE_TYPES, RULE_PROPERTY } from '../rules';
import { ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';

const { ASSIGNMENT, COMPARISON } = RULE_TYPES;
const ASSIGNMENT_OPERATOR = 'Assign';
const EQUALS_OPERATOR = 'Equals';
const { LEFT, RHS_PARAMS } = RULE_PROPERTY;
const mockAccountField = {
    "sobjectName":"Account",
    "dataType":"Number",
};

describe('Operator Rule Util', () => {
    describe('isMatch util', () => {
        it('should return true if rule param and store element hydrated with errors match', () => {
            const isEqual = isMatch(stringParam, hydratedElements[stringVariableGuid]);
            expect(isEqual).toBeTruthy();
        });

        it('should throw an error when given an empty rule param object', () => {
            expect(() => {
                isMatch({}, elements[dateVariableGuid]);
            }).toThrow();
        });

        it('should throw an error when given an empty element object', () => {
            expect(() => {
                isMatch(stageParam, {});
            }).toThrow();
        });
        it('rule with collection = true should only match collection elements', () => {
            let isEqual = isMatch(dateCollectionParam, elements[dateCollectionVariableGuid]);
            expect(isEqual).toBeTruthy();
            isEqual = isMatch(dateCollectionParam, elements[dateVariableGuid]);
            expect(isEqual).toBeFalsy();
        });
        it('rule with collection = false should not match collection elements', () => {
            let isEqual = isMatch(dateParam, elements[dateVariableGuid]);
            expect(isEqual).toBeTruthy();
            isEqual = isMatch(dateParam, elements[dateCollectionVariableGuid]);
            expect(isEqual).toBeFalsy();
        });
        it('rule with collection undefined should match noncollection or collection elements', () => {
            let isEqual = isMatch(dateParamMissingCollection, elements[dateVariableGuid]);
            expect(isEqual).toBeTruthy();
            isEqual = isMatch(dateParamMissingCollection, elements[dateCollectionVariableGuid]);
            expect(isEqual).toBeTruthy();
        });
        it('for dataType param, elementType can be in canBe or mustBe list', () => {
            let isEqual = isMatch(dateParam, elements[dateVariableGuid]);
            expect(isEqual).toBeTruthy();
            isEqual = isMatch(dateParamMustBeElements, elements[dateVariableGuid]);
            expect(isEqual).toBeTruthy();
        });
        it('for dataType param, elementType can not be in cannotBe list', () => {
            const isEqual = isMatch(dateParamCannotBeElements, elements[dateVariableGuid]);
            expect(isEqual).toBeFalsy();
        });
        it('dataType param should match if elementType is not mentioned', () => {
            const isEqual = isMatch(dateParamNoElementsList, elements[dateVariableGuid]);
            expect(isEqual).toBeTruthy();
        });
        it('field should not be allowed if operator param says cannotBe sObjectField', () => {
            const isEqual = isMatch(numberParamCannotBeField, mockAccountField);
            expect(isEqual).toBeFalsy();
        });
        it('field should be allowed if operator param says canBe or mustBe sObjectField', () => {
            let isEqual = isMatch(numberParamCanBeField, mockAccountField);
            expect(isEqual).toBeTruthy();
            isEqual = isMatch(numberParamMustBeField, mockAccountField);
            expect(isEqual).toBeTruthy();
        });
    });

    describe('get left hand side types util', () => {
        it('should return an object', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, ASSIGNMENT);
            expect(rules).toEqual(expect.any(Object));
        });

        it('should return an object with data type to param type mapping', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, ASSIGNMENT);
            const keys = Object.keys(rules);
            expect(rules).toMatchObject({
                [keys[0]] : expect.any(Array),
            });
        });

        it('should return all the left hand side types for assignment rules, excluding appropriately', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, ASSIGNMENT);
            const expectedDate = mockRules[0][LEFT];
            const expectedStage = mockRules[2][LEFT];
            const expectedSObject = mockRules[5][LEFT];
            expect(rules).toMatchObject({
                'Date': [expectedDate],
                'STAGE': [expectedStage],
                'SObject': [expectedSObject],
            });
        });

        it('should return all the left hand side types for assignment rules', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.RECORD_CREATE, mockRules, ASSIGNMENT);
            const expectedDate = mockRules[0][LEFT];
            const expectedDateTime = mockRules[1][LEFT];
            const expectedStage = mockRules[2][LEFT];
            const expectedSObject = mockRules[5][LEFT];
            expect(rules).toMatchObject({
                'Date': [expectedDate],
                'DateTime': [expectedDateTime],
                'STAGE': [expectedStage],
                'SObject': [expectedSObject],
            });
        });

        it('should return all the left hand side types for comparison rules', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, COMPARISON);
            const expectedStage1 = mockRules[3][LEFT];
            const expectedStage2 = mockRules[7][LEFT];
            expect(rules).toMatchObject({
                'STAGE': [expectedStage1, expectedStage2],
            });
        });

        it('should remove duplicates from list of left hand side types', () => {
            const rules = getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, COMPARISON);
            expect(Object.keys(rules)).toHaveLength(1);
        });

        it('does not throw an error when given an undefined rule type', () => {
            expect(() => {
                getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules);
            }).not.toThrow();
        });

        it('throws an error when the give rules are not an Array', () => {
            expect(() => {
                getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, 42, ASSIGNMENT);
            }).toThrow();
        });

        it('throws an error when given an invalid rule type', () => {
            expect(() => {
                getLHSTypes(ELEMENT_TYPE.ASSIGNMENT, mockRules, 'invalidRuleType');
            }).toThrow();
        });
    });

    describe('get operator types util', () => {
        it('should only return results from the given rule type', () => {
            let operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], mockRules, ASSIGNMENT);
            expect(operators).toHaveLength(1);
            operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[stageGuid], mockRules, COMPARISON);
            expect(operators).toHaveLength(1);
        });

        it('should return an empty array if given no lhs information', () => {
            const operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, undefined, mockRules, ASSIGNMENT);
            expect(operators).toHaveLength(0);
        });

        it('should return all the operators per rule type', () => {
            let operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], mockRules, ASSIGNMENT);
            expect(operators[0]).toEqual(ASSIGNMENT_OPERATOR);
            operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[stageGuid], mockRules, COMPARISON);
            expect(operators[0]).toEqual(EQUALS_OPERATOR);
        });

        it('should remove duplicates from the list of operators', () => {
            const operators = getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[stageGuid], mockRules, COMPARISON);
            expect(operators).toHaveLength(1);
        });

        it('does not throw an error when given an undefined rule type', () => {
            expect(() => {
                getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], mockRules);
            }).not.toThrow();
        });

        it('throws an error when the give rules are not an Array', () => {
            expect(() => {
                getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], 42, ASSIGNMENT);
            }).toThrow();
        });

        it('throws an error when given an invalid rule type', () => {
            expect(() => {
                getOperators(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], mockRules, 'invalidRuleType');
            }).toThrow();
        });
    });

    describe('get right hand side types util', () => {
        it('should return an empty object if given no lhs information', () => {
            const rhsTypes = getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, undefined, 'someOperator', mockRules, ASSIGNMENT);
            expect(Object.keys(rhsTypes)).toHaveLength(0);
        });

        it('should return an object with data type to param type mapping', () => {
            let rhsTypes = getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], ASSIGNMENT_OPERATOR, mockRules, ASSIGNMENT);
            expect(Object.keys(rhsTypes)).toHaveLength(2);
            expect(rhsTypes).toMatchObject({
                'Date': expect.any(Array),
                'DateTime': expect.any(Array),
            });
            rhsTypes = getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[stageGuid], EQUALS_OPERATOR, mockRules, COMPARISON);
            expect(Object.keys(rhsTypes)).toHaveLength(1);
            expect(rhsTypes).toMatchObject({
                'STAGE': expect.any(Array),
            });
        });

        it('should return all the rhsTypes for assignment rules', () => {
            const rhsTypes = getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], ASSIGNMENT_OPERATOR, mockRules, ASSIGNMENT);
            const expectedDate = mockRules[0][RHS_PARAMS][0];
            const expectedDateTime = mockRules[0][RHS_PARAMS][1];
            expect(rhsTypes).toMatchObject({
                'Date': [expectedDate],
                'DateTime': [expectedDateTime],
            });
        });

        it('should return all the rhsTypes for the comparison rules, excluding appropriately', () => {
            const rhsTypes = getRHSTypes(ELEMENT_TYPE.DECISION, elements[stageGuid], EQUALS_OPERATOR, mockRules, COMPARISON);
            const expectedDateTime = mockRules[6][RHS_PARAMS][0];
            expect(rhsTypes).toMatchObject({
                'DateTime': [expectedDateTime],
            });
        });

        it('should return all the rhsTypes for the comparison rules', () => {
            const rhsTypes = getRHSTypes(ELEMENT_TYPE.RECORD_UPDATE, elements[stageGuid], EQUALS_OPERATOR, mockRules, COMPARISON);
            const expectedStage = mockRules[2][RHS_PARAMS][0];
            expect(rhsTypes).toMatchObject({
                'STAGE': [expectedStage],
            });
        });

        it('should sort sObjects by object type', () => {
            const rhsTypes = getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[accountSObjectVariableGuid], ASSIGNMENT_OPERATOR, mockRules, ASSIGNMENT);
            expect(rhsTypes).toHaveProperty('Account');
        });

        it('throws an error when given an invalid rule type', () => {
            expect(() => {
                getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], ASSIGNMENT_OPERATOR, mockRules, 'invalidRuleType');
            }).toThrow();
        });

        it('does not throw an error when given an undefined rule type', () => {
            expect(() => {
                getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], ASSIGNMENT_OPERATOR, mockRules);
            }).not.toThrow();
        });

        it('throws an error when the give rules are not an Array', () => {
            expect(() => {
                getRHSTypes(ELEMENT_TYPE.ASSIGNMENT, elements[dateVariableGuid], ASSIGNMENT_OPERATOR, 42, ASSIGNMENT);
            }).toThrow();
        });
    });
});