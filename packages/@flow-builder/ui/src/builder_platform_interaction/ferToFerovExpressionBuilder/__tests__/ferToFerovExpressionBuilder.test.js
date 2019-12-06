import { createElement } from 'lwc';
import FerToFerovExpressionBuilder from '../ferToFerovExpressionBuilder.js';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { numberVariable, accountSObjectVariable } from 'mock/storeData';
import {
    elementToParam,
    RULE_OPERATOR
} from 'builder_platform_interaction/ruleLib';
import {
    mutateFlowResourceToComboboxShape,
    getMenuItemForField,
    EXPRESSION_PROPERTY_TYPE,
    LHS_DISPLAY_OPTION
} from 'builder_platform_interaction/expressionUtils';
import { accountFields as mockAccountFields } from 'serverData/GetFieldsForEntity/accountFields.json';
import { FEROV_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import {
    GLOBAL_CONSTANTS,
    GLOBAL_CONSTANT_OBJECTS,
    setSystemVariables,
    getSystemVariables
} from 'builder_platform_interaction/systemLib';
import { addCurlyBraces } from 'builder_platform_interaction/commonUtils';
import { untilNoFailure } from 'builder_platform_interaction/builderTestUtils';
import { getFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { systemVariablesForFlow as systemVariables } from 'serverData/GetSystemVariables/systemVariablesForFlow.json';
import { ticks } from 'builder_platform_interaction/builderTestUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { allEntities as mockEntities } from "serverData/GetEntities/allEntities.json";

jest.mock('builder_platform_interaction/storeLib', () =>
    require('builder_platform_interaction_mocks/storeLib')
);

function createComponentForTest(props) {
    const el = createElement(
        'builder_platform_interaction-fer-to-ferov-expression-builder',
        { is: FerToFerovExpressionBuilder }
    );
    if (props) {
        Object.assign(el, props);
    }
    document.body.appendChild(el);
    return el;
}

function createMockPopulatedExpression() {
    return {
        [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
            value: numberVariable.guid,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
            value: RULE_OPERATOR.ASSIGN,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
            value: numberVariable.guid,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
            value: FEROV_DATA_TYPE.REFERENCE,
            error: null
        }
    };
}

const picklistField = 'AccountSource';
const accountField = mockAccountFields.AccountSource;
const accountVariableComboboxShape = mutateFlowResourceToComboboxShape(
    accountSObjectVariable
);
const systemVariableReference = '$Flow.CurrentRecord';

function createMockPopulatedFieldExpression() {
    return {
        [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
            value: accountSObjectVariable.guid + '.' + picklistField,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
            value: RULE_OPERATOR.EQUAL_TO,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
            value: accountSObjectVariable.guid + '.' + picklistField,
            error: null
        },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
            value: FEROV_DATA_TYPE.REFERENCE,
            error: null
        }
    };
}

function getBaseExpressionBuilder(ferToFerovWrapper) {
    return ferToFerovWrapper.shadowRoot.querySelector(
        'builder_platform_interaction-base-expression-builder'
    );
}

jest.mock('builder_platform_interaction/ruleLib', () => {
    const actual = require.requireActual('builder_platform_interaction/ruleLib');
    return {
        getLHSTypes: jest.fn(),
        getOperators: jest.fn().mockImplementation(() => {
            return ['Assign', 'Add'];
        }),
        getRHSTypes: jest.fn(),
        getDataType: actual.getDataType,
        transformOperatorsForCombobox: jest.fn().mockReturnValue([]),
        elementToParam: actual.elementToParam,
        isCollectionRequired: jest
            .fn()
            .mockReturnValue(false)
            .mockName('isCollectionRequired'),
        RULE_OPERATOR: actual.RULE_OPERATOR,
        PARAM_PROPERTY: actual.PARAM_PROPERTY
    };
});

// Mocking out the fetch function to return Account fields
jest.mock('builder_platform_interaction/serverDataLib', () => {
    return {
        SERVER_ACTION_TYPE: require.requireActual(
            'builder_platform_interaction/serverDataLib'
        ).SERVER_ACTION_TYPE
    };
});

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getFieldsForEntity: jest
            .fn()
            .mockImplementation(() => mockAccountFields),
        fetchFieldsForEntity: jest
            .fn()
            .mockImplementation(() => Promise.resolve(mockAccountFields)),
        getEntity: jest
            .fn()
            .mockImplementation(apiName =>
                mockEntities.find(entity => entity.apiName === apiName)
            )
    };
});

const INVALID_VALUE = 'invalidValue';

const labels = ['lhsLabel', 'operatorLabel', 'rhsLabel'];
const placeholders = [
    'lhsPlaceholder',
    'operatorPlaceholder',
    'rhsPlaceholder'
];

describe('fer-to-ferov-expression-builder', () => {
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    describe('label sanity checks', () => {
        for (let i = 0; i < 3; i++) {
            it(`has the ${labels[i]} defined`, () => {
                const expressionBuilder = createComponentForTest({
                    containerElement: ELEMENT_TYPE.ASSIGNMENT,
                    lhsLabel: 'LHS',
                    operatorLabel: 'operator',
                    rhsLabel: 'RHS',
                    expression: createMockPopulatedExpression()
                });
                expect(expressionBuilder[labels[i]]).toBeDefined();
            });
        }
    });
    describe('placeholder sanity checks', () => {
        for (let i = 0; i < 3; i++) {
            it(`has the ${placeholders[i]} defined`, () => {
                const expressionBuilder = createComponentForTest({
                    containerElement: ELEMENT_TYPE.ASSIGNMENT,
                    lhsPlaceholder: 'LHS',
                    operatorPlaceholder: 'operator',
                    rhsPlaceholder: 'RHS',
                    expression: createMockPopulatedExpression()
                });
                expect(expressionBuilder[placeholders[i]]).toBeDefined();
            });
        }
    });
    describe('default operator', () => {
        it('passes default operator to the base expression builder', () => {
            const defaultOperator = 'someDefaultOperator';
            const expressionBuilder = createComponentForTest({
                defaultOperator,
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedExpression()
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );

            expect(baseExpressionBuilder.defaultOperator).toEqual(
                defaultOperator
            );
        });
    });
    describe('parsing LHS', () => {
        it('should handle FER on LHS', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedExpression()
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.lhsValue).toMatchObject(
                mutateFlowResourceToComboboxShape(numberVariable)
            );
            expect(baseExpressionBuilder.lhsParam).toMatchObject(
                elementToParam(numberVariable)
            );
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeDefined();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeFalsy();
            expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                LHS_DISPLAY_OPTION.NOT_FIELD
            );
            expect(baseExpressionBuilder.lhsFields).toBeDefined();
            expect(baseExpressionBuilder.lhsFields).toBeFalsy();
        });
        it('should handle field on sobject var on LHS', async () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedFieldExpression()
            });
            await untilNoFailure(() => {
                const baseExpressionBuilder = getBaseExpressionBuilder(
                    expressionBuilder
                );
                expect(baseExpressionBuilder.lhsValue).toMatchObject(
                    getMenuItemForField(
                        accountField,
                        accountVariableComboboxShape,
                        {
                            showAsFieldReference: true,
                            showSubText: true
                        }
                    )
                );
                expect(baseExpressionBuilder.lhsParam).toMatchObject(
                    elementToParam(accountField)
                );
                expect(
                    baseExpressionBuilder.lhsActivePicklistValues
                ).toMatchObject(accountField.activePicklistValues);
                expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                    LHS_DISPLAY_OPTION.FIELD_ON_VARIABLE
                );
                expect(baseExpressionBuilder.lhsFields).toBeTruthy();
            });
        });
        it('should handle field if no access to sobject fields on LHS', async () => {
            getFieldsForEntity.mockImplementationOnce(() => undefined);
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedFieldExpression()
            });
            const displayValue = '{!accountSObjectVariable.AccountSource}';
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            await ticks();
            expect(baseExpressionBuilder.lhsValue).toEqual(displayValue);
            expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                LHS_DISPLAY_OPTION.FIELD_ON_VARIABLE
            );
        });
        it('should handle system variable on LHS', () => {
            setSystemVariables(systemVariables);
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value: systemVariableReference,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: addCurlyBraces(
                            accountSObjectVariable.name + '.' + picklistField
                        ),
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.lhsValue).toMatchObject(
                mutateFlowResourceToComboboxShape(
                    getSystemVariables()[systemVariableReference]
                )
            );
            expect(baseExpressionBuilder.lhsParam).toMatchObject(
                elementToParam(getSystemVariables()[systemVariableReference])
            );
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeDefined();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeFalsy();
            expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                LHS_DISPLAY_OPTION.NOT_FIELD
            );
            expect(baseExpressionBuilder.lhsFields).toBeDefined();
            expect(baseExpressionBuilder.lhsFields).toBeFalsy();
        });
        it('should pass plain lhs value if there is an error', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value: INVALID_VALUE,
                        error: INVALID_VALUE
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: addCurlyBraces(
                            accountSObjectVariable.name + '.' + picklistField
                        ),
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.lhsValue).toEqual(INVALID_VALUE);
            expect(baseExpressionBuilder.lhsParam).toBeDefined();
            expect(baseExpressionBuilder.lhsParam).toBeFalsy();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeDefined();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeFalsy();
            expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                LHS_DISPLAY_OPTION.NOT_FIELD
            );
            expect(baseExpressionBuilder.lhsFields).toBeDefined();
            expect(baseExpressionBuilder.lhsFields).toBeFalsy();
        });
        it('should pass plain lhs value if invalid but there is no error', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value: INVALID_VALUE,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: addCurlyBraces(
                            accountSObjectVariable.name + '.' + picklistField
                        ),
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.lhsValue).toEqual(INVALID_VALUE);
            expect(baseExpressionBuilder.lhsParam).toBeDefined();
            expect(baseExpressionBuilder.lhsParam).toBeFalsy();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeDefined();
            expect(baseExpressionBuilder.lhsActivePicklistValues).toBeFalsy();
            expect(baseExpressionBuilder.lhsDisplayOption).toBe(
                LHS_DISPLAY_OPTION.NOT_FIELD
            );
            expect(baseExpressionBuilder.lhsFields).toBeDefined();
            expect(baseExpressionBuilder.lhsFields).toBeFalsy();
        });

        it('passes lhsMustBeWritable to the baseExpressionBuilder', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedFieldExpression(),
                lhsMustBeWritable: true
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.lhsMustBeWritable).toEqual(true);
        });
    });
    describe('parsing RHS', () => {
        it('should handle FER on RHS', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedExpression()
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.rhsValue).toMatchObject(
                mutateFlowResourceToComboboxShape(numberVariable)
            );
            expect(baseExpressionBuilder.rhsIsField).toBeDefined();
            expect(baseExpressionBuilder.rhsIsField).toBeFalsy();
            expect(baseExpressionBuilder.rhsFields).toBeDefined();
            expect(baseExpressionBuilder.rhsFields).toBeFalsy();
        });
        it('should handle field on sobject var on RHS', async () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: createMockPopulatedFieldExpression()
            });
            await untilNoFailure(() => {
                const baseExpressionBuilder = getBaseExpressionBuilder(
                    expressionBuilder
                );
                expect(baseExpressionBuilder.rhsValue).toMatchObject(
                    getMenuItemForField(
                        accountField,
                        accountVariableComboboxShape,
                        {
                            showAsFieldReference: true,
                            showSubText: true
                        }
                    )
                );
                expect(baseExpressionBuilder.rhsIsField).toBeTruthy();
                expect(baseExpressionBuilder.rhsFields).toBeTruthy();
            });
        });
        it('should handle system variable on RHS', () => {
            setSystemVariables(systemVariables);
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value:
                            accountSObjectVariable.guid + '.' + picklistField,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: systemVariableReference,
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.rhsValue).toMatchObject(
                mutateFlowResourceToComboboxShape(
                    getSystemVariables()[systemVariableReference]
                )
            );
        });
        it('should handle Global Constant on RHS', () => {
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value:
                            accountSObjectVariable.guid + '.' + picklistField,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: addCurlyBraces(GLOBAL_CONSTANTS.BOOLEAN_FALSE),
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
                        value: FEROV_DATA_TYPE.BOOLEAN,
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.rhsValue).toMatchObject(
                mutateFlowResourceToComboboxShape(
                    GLOBAL_CONSTANT_OBJECTS[GLOBAL_CONSTANTS.BOOLEAN_FALSE]
                )
            );
            expect(baseExpressionBuilder.rhsIsField).toBeDefined();
            expect(baseExpressionBuilder.rhsIsField).toBeFalsy();
            expect(baseExpressionBuilder.rhsFields).toBeDefined();
            expect(baseExpressionBuilder.rhsFields).toBeFalsy();
        });
        it('should handle literal on RHS', () => {
            const literal = 'abc';
            const expressionBuilder = createComponentForTest({
                containerElement: ELEMENT_TYPE.ASSIGNMENT,
                expression: {
                    [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                        value:
                            accountSObjectVariable.guid + '.' + picklistField,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.OPERATOR]: {
                        value: RULE_OPERATOR.EQUAL_TO,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: {
                        value: literal,
                        error: null
                    },
                    [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
                        value: FEROV_DATA_TYPE.BOOLEAN,
                        error: null
                    }
                }
            });
            const baseExpressionBuilder = getBaseExpressionBuilder(
                expressionBuilder
            );
            expect(baseExpressionBuilder.rhsValue).toBe(literal);
            expect(baseExpressionBuilder.rhsIsField).toBeDefined();
            expect(baseExpressionBuilder.rhsIsField).toBeFalsy();
            expect(baseExpressionBuilder.rhsFields).toBeDefined();
            expect(baseExpressionBuilder.rhsFields).toBeFalsy();
        });
    });
});
