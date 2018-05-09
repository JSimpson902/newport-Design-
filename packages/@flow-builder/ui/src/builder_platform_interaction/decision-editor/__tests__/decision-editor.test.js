import {createElement} from 'engine';
import DecisionEditor from 'builder_platform_interaction-decision-editor';
import {
    DeleteOutcomeEvent,
} from 'builder_platform_interaction-events';

const mockNewState = {
    outcomes: [{
        guid: 'outcome 3',
        label: { value: ''},
        conditionLogic: { value: ''},
        conditions: []
    }]
};

jest.mock('../decision-reducer', () => {
    return {
        decisionReducer: jest.fn(() => {
            return mockNewState;
        })
    };
});

const SELECTORS = {
    OUTCOME: 'builder_platform_interaction-outcome',
    REORDERABLE_NAV: 'builder_platform_interaction-reorderable-vertical-navigation'
};

const decisionWithOneOutcome = {
    label: {value: 'Test Name of the Decision'},
    name: {value: 'Test Dev Name'},
    guid: {value: 'decision2'},
    outcomes: [
        {
            guid: 'outcome1',
            label: { value: ''},
            conditionLogic: { value: ''},
            conditions: []
        }
    ]
};

const decisionWithTwoOutcomes = {
    label: {value: 'Test Name of the Decision'},
    name: {value: 'Test Dev Name'},
    guid: {value: 'decision1'},
    outcomes: [
        {
            guid: 'outcome1',
            label: { value: ''},
            conditionLogic: { value: ''},
            conditions: []
        },
        {
            guid: 'outcome2',
            label: { value: ''},
            conditionLogic: { value: ''},
            conditions: []
        },
    ]
};

const createComponentForTest = (node) => {
    const el = createElement('builder_platform_interaction-decision-editor', {
        is: DecisionEditor
    });

    el.node = node;

    document.body.appendChild(el);

    return el;
};

describe('Decision Editor', () => {
    describe('handleDeleteOutcome', () => {
        it('calls the reducer with the passed in action', () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
            return Promise.resolve().then(() => {
                const deleteOutcomeEvent = new DeleteOutcomeEvent('outcomeGuid');

                const outcome = decisionEditor.querySelector(SELECTORS.OUTCOME);
                outcome.dispatchEvent(deleteOutcomeEvent);

                expect(decisionEditor.node).toEqual(mockNewState);
            });
        });

        // TODO: Figure out rendering issue (outcome is not being re-rendered) due to slots
        // it('sets the first outcome as active', () => {
        //     const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
        //
        //     return Promise.resolve().then(() => {
        //         const deleteOutcomeEvent = new DeleteOutcomeEvent('outcomeGuid');
        //
        //         const outcomeElement = decisionEditor.querySelector(selectors.outcome);
        //         outcomeElement.dispatchEvent(deleteOutcomeEvent);
        //     }).then(() => {
        //         const outcomeElement = decisionEditor.querySelector(selectors.outcome);
        //         debugger;
        //         expect(outcomeElement.outcome).toEqual(mockNewState.outcomes[0]);
        //     });
        // });
    });

    describe('showDeleteOutcome', () => {
        it('is true when more than one outcome is present', () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

            return Promise.resolve().then(() => {
                const outcomeElement = decisionEditor.querySelector(SELECTORS.OUTCOME);
                expect(outcomeElement.showDelete).toBe(true);
            });
        });
        it('is false when only one outcome is present', () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);

            return Promise.resolve().then(() => {
                const outcomeElement = decisionEditor.querySelector(SELECTORS.OUTCOME);
                expect(outcomeElement.showDelete).toBe(false);
            });
        });
    });

    describe('outcome menu', () => {
        describe('array of menu items', () => {
            it('contains all outcomes in order', () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                return Promise.resolve().then(() => {
                    const reorderableOutcomeNav = decisionEditor.querySelector(SELECTORS.REORDERABLE_NAV);
                    const menuItems = reorderableOutcomeNav.menuItems;

                    expect(menuItems).toHaveLength(2);
                    expect(menuItems[0].element).toEqual(decisionWithTwoOutcomes.outcomes[0]);
                    expect(menuItems[1].element).toEqual(decisionWithTwoOutcomes.outcomes[1]);
                });
            });
            it('outcomes are draggable', () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);

                return Promise.resolve().then(() => {
                    const reorderableOutcomeNav = decisionEditor.querySelector(SELECTORS.REORDERABLE_NAV);
                    const menuItems = reorderableOutcomeNav.menuItems;

                    expect(menuItems[0].isDraggable).toBeTruthy();
                    expect(menuItems[1].isDraggable).toBeTruthy();
                });
            });
        });
    });
});