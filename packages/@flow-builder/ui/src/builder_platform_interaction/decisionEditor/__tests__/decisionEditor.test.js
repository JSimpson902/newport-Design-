import { createElement } from 'lwc';
import DecisionEditor from 'builder_platform_interaction/decisionEditor';
import { decisionReducer } from '../decisionReducer';
import { DeleteOutcomeEvent, PropertyChangedEvent, UpdateNodeEvent } from 'builder_platform_interaction/events';
import { ticks } from 'builder_platform_interaction/builderTestUtils';
import { deepCopy } from 'builder_platform_interaction/storeLib';

const mockNewState = {
    label: { value: 'New Decision' },
    name: { value: 'New Dec Dev Name' },
    guid: { value: 'decision99' },
    defaultConnectorLabel: { value: 'foo' },
    outcomes: [
        {
            guid: 'outcome 3',
            label: { value: '' },
            name: { value: '' },
            conditionLogic: { value: '' },
            conditions: []
        }
    ]
};

const DEFAULT_OUTCOME_ID = 'defaultOutcome';

jest.mock('../decisionReducer', () => {
    return {
        decisionReducer: jest.fn(() => {
            return mockNewState;
        }),
        resetDeletedGuids: jest.requireActual('../decisionReducer').resetDeletedGuids
    };
});

jest.mock('builder_platform_interaction/dataMutationLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/dataMutationLib');
    return {
        pick: actual.pick,
        getErrorsFromHydratedElement: jest.fn(() => {
            return ['some error'];
        }),
        updateProperties: actual.updateProperties
    };
});

const SELECTORS = {
    OUTCOME: 'builder_platform_interaction-outcome',
    REORDERABLE_NAV: 'builder_platform_interaction-reorderable-vertical-navigation',
    DEFAULT_OUTCOME: 'builder_platform_interaction-label-description.defaultOutcome',
    ADD_OUTCOME_BUTTON: 'lightning-button-icon',
    LABEL_DESCRIPTION: 'div.slds-p-horizontal_small.slds-p-top_small builder_platform_interaction-label-description'
};

let decisionWithOneOutcome;
let decisionWithTwoOutcomes;

beforeEach(() => {
    decisionWithOneOutcome = {
        label: { value: 'Test Name of the Decision' },
        name: { value: 'Test Dev Name' },
        guid: { value: 'decision2' },
        outcomes: [
            {
                guid: 'outcome1',
                label: { value: '' },
                conditionLogic: { value: '' },
                conditions: []
            }
        ]
    };

    decisionWithTwoOutcomes = {
        label: { value: 'Test Name of the Decision' },
        name: { value: 'Test Dev Name' },
        guid: { value: 'decision1' },
        outcomes: [
            {
                guid: 'outcome1',
                label: { value: '' },
                conditionLogic: { value: '' },
                conditions: []
            },
            {
                guid: 'outcome2',
                label: { value: '' },
                conditionLogic: { value: '' },
                conditions: []
            }
        ]
    };
});

const createComponentForTest = (
    node,
    props = {
        editorParams: { panelConfig: { isLabelCollapsibleToHeader: false } }
    }
) => {
    const el = createElement('builder_platform_interaction-decision-editor', {
        is: DecisionEditor
    });

    el.node = node;
    el.editorParams = props.editorParams;
    document.body.appendChild(el);

    return el;
};

describe('Decision Editor', () => {
    describe('handleDeleteOutcome', () => {
        it('calls the reducer with the passed in action', async () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
            await ticks(1);
            const deleteOutcomeEvent = new DeleteOutcomeEvent('outcomeGuid');

            const outcome = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
            outcome.dispatchEvent(deleteOutcomeEvent);

            expect(decisionEditor.node).toEqual(mockNewState);
        });

        it('sets the first outcome as active', () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

            return Promise.resolve()
                .then(() => {
                    const deleteOutcomeEvent = new DeleteOutcomeEvent('outcome1');

                    const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    outcomeElement.dispatchEvent(deleteOutcomeEvent);
                })
                .then(() => {
                    const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    expect(outcomeElement.outcome).toEqual(mockNewState.outcomes[0]);
                });
        });

        it('does not change the active outcome if the outcome was not deleted', () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
            const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
            reorderableOutcomeNav.dispatchEvent(
                new CustomEvent('itemselected', {
                    detail: { itemId: 'outcome2' }
                })
            );

            return Promise.resolve()
                .then(() => {
                    decisionReducer.mockReturnValueOnce(decisionWithTwoOutcomes);
                    const deleteOutcomeEvent = new DeleteOutcomeEvent('outcome1');

                    const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    outcomeElement.dispatchEvent(deleteOutcomeEvent);
                })
                .then(() => {
                    const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    expect(outcomeElement.outcome).toEqual(decisionWithTwoOutcomes.outcomes[1]);
                });
        });
    });

    describe('showDeleteOutcome', () => {
        it('is true when more than one outcome is present', async () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

            await ticks(1);
            const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
            expect(outcomeElement.showDelete).toBe(true);
        });
        it('is false when only one outcome is present', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            await ticks(1);
            const outcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
            expect(outcomeElement.showDelete).toBe(false);
        });
    });

    describe('outcome menu', () => {
        describe('array of menu items', () => {
            it('contains all outcomes in order plus default at end', async () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                await ticks(1);
                const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
                const menuItems = reorderableOutcomeNav.menuItems;

                // menu includes the default
                expect(menuItems).toHaveLength(3);
                expect(menuItems[0].element).toEqual(decisionWithTwoOutcomes.outcomes[0]);
                expect(menuItems[1].element).toEqual(decisionWithTwoOutcomes.outcomes[1]);
                expect(menuItems[2]).toEqual({
                    element: {
                        guid: DEFAULT_OUTCOME_ID
                    },
                    label: 'FlowBuilderDecisionEditor.emptyDefaultOutcomeLabel',
                    isDraggable: false
                });
            });
            it('outcomes are draggable', async () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                await ticks(1);
                const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
                const menuItems = reorderableOutcomeNav.menuItems;

                expect(menuItems[0].isDraggable).toBeTruthy();
                expect(menuItems[1].isDraggable).toBeTruthy();
            });
            it('default outcome is not draggable', async () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                await ticks(1);
                const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
                const menuItems = reorderableOutcomeNav.menuItems;

                expect(menuItems[2].isDraggable).toBeFalsy();
            });
            it('shows an error icon when there is an error in the outcome', async () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                await ticks(1);
                const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
                const menuItems = reorderableOutcomeNav.menuItems;

                // We mocked getErrorsFromHydratedElement to always return an error
                // so all non-default outcomes will show the error
                expect(menuItems[0].hasErrors).toBeTruthy();
                expect(menuItems[1].hasErrors).toBeTruthy();
            });
        });
    });

    describe('default outcome', () => {
        it('calls the reducer with the passed in action and a propertyName of defaultConnectorLabel', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);
            // trigger showing of default outcome
            const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
            reorderableOutcomeNav.dispatchEvent(
                new CustomEvent('itemselected', {
                    detail: { itemId: DEFAULT_OUTCOME_ID }
                })
            );

            await ticks(1);
            const modifyDefaultOutcomeEvent = new PropertyChangedEvent('name', 'newValue');

            const defaultOutcome = decisionEditor.shadowRoot.querySelector(SELECTORS.DEFAULT_OUTCOME);

            defaultOutcome.dispatchEvent(modifyDefaultOutcomeEvent);

            const mockCallParams = decisionReducer.mock.calls[0];
            const decisionReducerEvent = mockCallParams[1];

            expect(mockCallParams[0]).toEqual(decisionWithOneOutcome);

            const expectedReducerEvent = {
                type: 'propertychanged',
                detail: {
                    propertyName: 'defaultConnectorLabel',
                    value: modifyDefaultOutcomeEvent.detail.value
                }
            };

            expect(decisionReducerEvent.type).toEqual(expectedReducerEvent.type);
            expect(decisionReducerEvent.detail.propertyName).toEqual(expectedReducerEvent.detail.propertyName);
            expect(decisionReducerEvent.detail.value).toEqual(expectedReducerEvent.detail.value);
        });
        it('initial default outcome does not have an error', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            await ticks(1);
            const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
            const menuItems = reorderableOutcomeNav.menuItems;

            expect(menuItems[1].hasErrors).toBeFalsy();
        });
        it('default outcome has an error if there is no label', async () => {
            decisionWithOneOutcome.defaultConnectorLabel = {
                value: '',
                error: 'Label should not be empty'
            };
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            await ticks(1);
            const reorderableOutcomeNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
            const menuItems = reorderableOutcomeNav.menuItems;

            expect(menuItems[1].hasErrors).toBeTruthy();
        });
    });

    describe('handleAddOutcome', () => {
        it('should set shouldFocus to true when outcome component is not already displayed', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            await ticks(1);
            const addButton = decisionEditor.shadowRoot.querySelector(SELECTORS.ADD_OUTCOME_BUTTON);
            addButton.dispatchEvent(new CustomEvent('click'));

            // renderedCallBack() will reset shouldFocus to false after ticks,
            // promise is used to make sure we get shouldFocus's actual value after adding new outcome
            return Promise.resolve().then(() => {
                const outcome = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                expect(outcome.shouldFocus).toBe(true);
            });
        });
        it('should set shouldFocus to false when outcome component is already displayed', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            await ticks(1);
            const outcome = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
            expect(outcome.shouldFocus).toBe(false);
        });
    });

    describe('handlePropertyChangedEvent', () => {
        it('property changed event dispatches an UpdateNodeEvent', async () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);
            decisionEditor.node = deepCopy(mockNewState);

            const updateNodeCallBack = jest.fn();
            decisionEditor.addEventListener(UpdateNodeEvent.EVENT_NAME, updateNodeCallBack);

            await ticks(1);
            const event = new PropertyChangedEvent('description', 'new desc', null);
            const labelDescription = decisionEditor.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION);
            labelDescription.dispatchEvent(event);

            expect(updateNodeCallBack).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { node: decisionEditor.node }
                })
            );
        });
    });

    describe('collapsible label description', () => {
        it('applies styling to label description when isLabelCollapsibleToHeader set to false', async () => {
            expect.assertions(1);
            const decisionEditor = createComponentForTest(decisionWithOneOutcome, {
                editorParams: {
                    panelConfig: { isLabelCollapsibleToHeader: false }
                }
            });

            await ticks(1);
            const labelDescription = decisionEditor.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION);
            expect(labelDescription).not.toBeNull();
        });
        it('does not apply styling to label description when isLabelCollapsibleToHeader set to true', async () => {
            expect.assertions(1);
            const decisionEditor = createComponentForTest(decisionWithOneOutcome, {
                editorParams: {
                    panelConfig: { isLabelCollapsibleToHeader: true }
                }
            });

            await ticks(1);
            const labelDescription = decisionEditor.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION);
            expect(labelDescription).toBeNull();
        });
    });
});
