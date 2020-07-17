// @ts-nocheck
import { decisionReducer, resetDeletedGuids } from '../decisionReducer';
import {
    PropertyChangedEvent,
    DeleteOutcomeEvent,
    AddConditionEvent,
    DeleteConditionEvent,
    UpdateConditionEvent
} from 'builder_platform_interaction/events';
import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import { EXPRESSION_PROPERTY_TYPE, checkExpressionForDeletedElem } from 'builder_platform_interaction/expressionUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        checkExpressionForDeletedElem: jest.fn(),
        EXPRESSION_PROPERTY_TYPE: jest.requireActual('builder_platform_interaction/expressionUtils')
            .EXPRESSION_PROPERTY_TYPE
    };
});

jest.mock('builder_platform_interaction/storeUtils', () => {
    return {
        getElementByGuid: jest.fn(),
        isExecuteOnlyWhenChangeMatchesConditionsPossible: jest.fn().mockReturnValue(true),
        shouldUseAutoLayoutCanvas: jest.fn()
    };
});

describe('decision-reducer', () => {
    let originalState;
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    beforeEach(() => {
        originalState = {
            label: 'decisionLabel',
            name: 'decisionDevName',
            elementType: 'DECISION',
            guid: 'decisionGuid',
            isCanvasElement: true,
            outcomes: [
                {
                    guid: '456',
                    conditions: [{}],
                    label: 'outcomeLabel1',
                    name: 'outcomeName1',
                    processMetadataValues: [],
                    dataType: 'Boolean',
                    elementType: 'OUTCOME',
                    isCanvasElement: false
                },
                {
                    guid: '123',
                    conditions: [{}],
                    label: 'outcomeLabel2',
                    name: 'outcomeName2',
                    processMetadataValues: [],
                    dataType: 'Boolean',
                    elementType: 'OUTCOME',
                    isCanvasElement: false
                }
            ]
        };
        resetDeletedGuids();
    });

    describe('PropertyChangedEvent', () => {
        describe('without guid (decision)', () => {
            let decisionPropertyChangedEvent;
            beforeEach(() => {
                decisionPropertyChangedEvent = new PropertyChangedEvent('label', 'val', 'anError');
            });

            it('to return a new state object', () => {
                const newState = decisionReducer(originalState, decisionPropertyChangedEvent);

                expect(newState).not.toBe(originalState);
            });

            it('to update the specified property on only the decision', () => {
                const newState = decisionReducer(originalState, decisionPropertyChangedEvent);

                expect(newState.label.value).toEqual('val');
                expect(newState.label.error).toEqual('anError');
                expect(newState.outcomes[0].label).toBe(originalState.outcomes[0].label);
                expect(newState.outcomes[1].label).toBe(originalState.outcomes[1].label);
            });
        });
        describe('with guid (outcome)', () => {
            let outcomePropertyChangedEvent;

            beforeEach(() => {
                outcomePropertyChangedEvent = new PropertyChangedEvent(
                    'label',
                    'val',
                    'anError',
                    originalState.outcomes[1].guid
                );
            });

            it('to return a new state object', () => {
                const newState = decisionReducer(originalState, outcomePropertyChangedEvent);

                expect(newState).not.toBe(originalState);
            });

            it('to update the specified property on only the specified outcome', () => {
                const newState = decisionReducer(originalState, outcomePropertyChangedEvent);
                expect(newState.label).toBe(originalState.label);
                expect(newState.outcomes[0].label).toBe(originalState.outcomes[0].label);
                expect(newState.outcomes[1].label.value).toEqual('val');
                expect(newState.outcomes[1].label.error).toEqual('anError');
            });
        });
    });

    describe('Add Outcome', () => {
        it('adds outcomes', () => {
            const storeLib = require('builder_platform_interaction/storeLib');

            const mockGuid1 = 'ABC';
            storeLib.generateGuid = jest.fn().mockReturnValue(mockGuid1);

            const addOutcomeAction = {
                type: PROPERTY_EDITOR_ACTION.ADD_DECISION_OUTCOME
            };

            let newState = decisionReducer(originalState, addOutcomeAction);

            expect(newState.outcomes).toHaveLength(3);
            expect(newState.outcomes[2].guid).toEqual(mockGuid1);
            expect(newState.outcomes[2].showOutcomeExecutionOptions).toBeTruthy();

            const mockGuid2 = 'XYZ';
            storeLib.generateGuid = jest.fn().mockReturnValue(mockGuid2);

            const storeUtils = require('builder_platform_interaction/storeUtils');
            storeUtils.isExecuteOnlyWhenChangeMatchesConditionsPossible = jest.fn().mockReturnValue(false);

            newState = decisionReducer(newState, addOutcomeAction);

            expect(newState.outcomes).toHaveLength(4);
            expect(newState.outcomes[3].guid).toEqual(mockGuid2);
            expect(newState.outcomes[3].showOutcomeExecutionOptions).toBeFalsy();
        });
    });

    describe('Delete Outcome', () => {
        it('with a valid guid deletes the outcome', () => {
            const deleteOutcomeAction = {
                type: DeleteOutcomeEvent.EVENT_NAME,
                detail: {
                    guid: originalState.outcomes[0].guid
                }
            };
            const newState = decisionReducer(originalState, deleteOutcomeAction);

            expect(newState.outcomes).toHaveLength(1);
            expect(newState.outcomes[0]).toEqual(originalState.outcomes[1]);
        });

        it('with an invalid guid does nothing', () => {
            const deleteOutcomeAction = {
                type: DeleteOutcomeEvent.EVENT_NAME,
                detail: {
                    guid: 'guidNotPresent'
                }
            };

            const newState = decisionReducer(originalState, deleteOutcomeAction);

            expect(newState.outcomes).toHaveLength(2);
        });
    });

    describe('AddConditionEvent', () => {
        it('adds valid condition with rowIndex', () => {
            const mockGuid = 'ABC';

            const storeLib = require('builder_platform_interaction/storeLib');
            storeLib.generateGuid = jest.fn().mockReturnValue(mockGuid);

            const outcome = originalState.outcomes[1];

            const addConditionEvent = new AddConditionEvent(outcome.guid);
            const newState = decisionReducer(originalState, addConditionEvent);

            const newOutcome = newState.outcomes[1];
            const hydratedNewObject = { value: '', error: null };

            expect(newOutcome.conditions).toHaveLength(2);
            expect(newOutcome.conditions[1].rowIndex).toEqual(mockGuid);
            expect(newOutcome.conditions[1].leftHandSide).toMatchObject(hydratedNewObject);
            expect(newOutcome.conditions[1].operator).toMatchObject(hydratedNewObject);
            expect(newOutcome.conditions[1].rightHandSide).toMatchObject(hydratedNewObject);
            expect(newOutcome.conditions[1].rightHandSideDataType).toMatchObject(hydratedNewObject);
        });

        it('does not add condition to other outcomes', () => {
            const addConditionEvent = new AddConditionEvent(originalState.outcomes[0].guid);
            const newState = decisionReducer(originalState, addConditionEvent);

            expect(newState.outcomes[1].conditions).toHaveLength(1);
        });
    });

    describe('DeleteConditionEvent', () => {
        it('deletes condition based on index', () => {
            const deleteConditionEvent = new DeleteConditionEvent(originalState.outcomes[0].guid, 0);
            const newState = decisionReducer(originalState, deleteConditionEvent);

            const newOutcome = newState.outcomes[0];

            expect(newOutcome.conditions).toHaveLength(0);
        });

        it('does not delete condition from other outcomes', () => {
            const deleteConditionEvent = new DeleteConditionEvent(originalState.outcomes[0].guid, 0);
            const newState = decisionReducer(originalState, deleteConditionEvent);

            expect(newState.outcomes[1].conditions).toHaveLength(1);
        });
    });

    describe('UpdateConditionEvent', () => {
        it('updates condition based on index', () => {
            const mockLHS = { value: 'val', error: 'err' };
            const updateConditionEvent = new UpdateConditionEvent(originalState.outcomes[0].guid, 0, {
                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: mockLHS
            });
            const newState = decisionReducer(originalState, updateConditionEvent);

            const newOutcome = newState.outcomes[0];
            const modifiedCondition = newOutcome.conditions[0];

            expect(newOutcome.conditions).toHaveLength(1);
            expect(modifiedCondition[EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]).toEqual({
                value: mockLHS.value,
                error: mockLHS.error
            });
            expect(checkExpressionForDeletedElem).toHaveBeenCalledTimes(1);
        });

        it('does not delete condition from other outcomes', () => {
            const updateConditionEvent = new UpdateConditionEvent(
                originalState.outcomes[0].guid,
                0,
                'name',
                'val',
                'err'
            );
            const newState = decisionReducer(originalState, updateConditionEvent);

            const newOutcome = newState.outcomes[1];

            expect(newOutcome.conditions).toEqual(originalState.outcomes[1].conditions);
        });
    });
});
