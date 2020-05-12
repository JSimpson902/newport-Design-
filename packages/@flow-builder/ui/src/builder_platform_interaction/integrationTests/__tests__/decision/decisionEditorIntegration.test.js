// @ts-nocheck
import { createElement, unwrap } from 'lwc';
import DecisionEditor from 'builder_platform_interaction/decisionEditor';
import { ReorderListEvent } from 'builder_platform_interaction/events';
import { CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';
import { resolveRenderCycles } from '../resolveRenderCycles';

jest.mock('builder_platform_interaction/storeLib', () => {
    const mockStoreLib = require('builder_platform_interaction_mocks/storeLib');
    const originalCreateSelector = jest.requireActual('builder_platform_interaction/storeLib').createSelector;
    const partialStoreLibMock = Object.assign({}, mockStoreLib);
    partialStoreLibMock.createSelector = originalCreateSelector;

    return partialStoreLibMock;
});

jest.mock('builder_platform_interaction/loggingUtils', () => {
    return {
        logPerfTransactionStart: jest.fn(),
        logPerfTransactionEnd: jest.fn()
    };
});

jest.mock('builder_platform_interaction/ruleLib', () => {
    const ruleLib = jest.requireActual('builder_platform_interaction/ruleLib');
    return Object.assign({}, ruleLib);
});

const SELECTORS = {
    OUTCOME: 'builder_platform_interaction-outcome',
    VERTICAL_TAB_NAV_ITEM: '.slds-vertical-tabs__nav-item',
    REORDERABLE_NAV: 'builder_platform_interaction-reorderable-vertical-navigation',
    DEFAULT_OUTCOME: 'builder_platform_interaction-label-description.defaultOutcome',
    ADD_BUTTON: 'lightning-button-icon',
    COMBOBOX: 'builder_platform_interaction-combobox',
    LIGHTNING_COMBOBOX: 'lightning-grouped-combobox',
    CONDITION_COMBOBOX: 'lightning-combobox.conditionLogic',
    LABEL_DESCRIPTION_COMPONENT: 'builder_platform_interaction-label-description',
    CONDITION_LIST: 'builder_platform_interaction-condition-list',
    LIST: 'builder_platform_interaction-list',
    ROW: 'builder_platform_interaction-row',
    LIGHTNING_BUTTON: 'lightning-button',
    LIGHTNING_BUTTON_ICON: 'lightning-button-icon',
    LABEL: '.label',
    DEV_NAME: '.devName',
    LEGEND_TEXT: 'strong'
};

const CONDITION_PREFIXES = {
    AND: 'FLOWBUILDERCONDITIONLIST.ANDPREFIXLABEL',
    OR: 'FLOWBUILDERCONDITIONLIST.ORPREFIXLABEL'
};

const NEW_DECISION_LABEL = 'New Decision';
const NEW_DECISION_DEV_NAME = 'New_Decision';
const NEW_OUTCOME_LABEL = 'New Outcome';
const NEW_OUTCOME_DEV_NAME = 'New_Outcome';

const outcome1Guid = 'outcome1guid';
const outcome2Guid = 'outcome2guid';

const focusoutEvent = new FocusEvent('focusout', {
    bubbles: true,
    cancelable: true
});

const changeEvent = value => {
    return new CustomEvent('change', {
        detail: {
            value
        }
    });
};

const reorderListEvent = new ReorderListEvent(outcome1Guid, outcome2Guid);

const emptyDecision = {
    label: { value: '' },
    name: { value: '' },
    guid: { value: 'decision1' },
    outcomes: [
        {
            guid: 'outcome1',
            label: { value: '' },
            name: { value: '' },
            conditionLogic: { value: '' },
            conditions: []
        }
    ]
};

const decisionWithOneOutcome = {
    label: { value: NEW_DECISION_LABEL },
    name: { value: NEW_DECISION_DEV_NAME },
    guid: { value: 'decision2' },
    outcomes: [
        {
            guid: outcome1Guid,
            label: { value: outcome1Guid },
            name: { value: outcome1Guid },
            conditionLogic: { value: 'and' },
            conditions: [
                {
                    leftHandSide: { value: '', error: null },
                    operator: { value: '', error: null },
                    rightHandSide: { value: '', error: null },
                    rightHandSideDataType: { value: '', error: null },
                    rowIndex: 'CONDITION_1'
                }
            ]
        }
    ]
};

const decisionWithOneOutcomeWithTwoConditions = {
    label: { value: NEW_DECISION_LABEL },
    name: { value: NEW_DECISION_DEV_NAME },
    guid: { value: 'decision2' },
    outcomes: [
        {
            guid: outcome1Guid,
            label: { value: outcome1Guid },
            name: { value: outcome1Guid },
            conditionLogic: { value: 'and' },
            conditions: [
                {
                    leftHandSide: { value: '', error: null },
                    operator: { value: '', error: null },
                    rightHandSide: { value: '', error: null },
                    rightHandSideDataType: { value: '', error: null },
                    rowIndex: 'CONDITION_1'
                },
                {
                    leftHandSide: { value: '', error: null },
                    operator: { value: '', error: null },
                    rightHandSide: { value: '', error: null },
                    rightHandSideDataType: { value: '', error: null },
                    rowIndex: 'CONDITION_2'
                }
            ]
        }
    ]
};

const decisionWithTwoOutcomes = {
    label: { value: NEW_DECISION_LABEL },
    name: { value: NEW_DECISION_DEV_NAME },
    guid: { value: 'decision3' },
    outcomes: [
        {
            guid: outcome1Guid,
            label: { value: outcome1Guid },
            name: { value: outcome1Guid },
            conditionLogic: { value: '' },
            conditions: []
        },
        {
            guid: outcome2Guid,
            label: { value: outcome2Guid },
            name: { value: outcome2Guid },
            conditionLogic: { value: '' },
            conditions: []
        }
    ]
};

const createComponentForTest = node => {
    const el = createElement('builder_platform_interaction-decision-editor', {
        is: DecisionEditor
    });

    el.node = node;

    document.body.appendChild(el);

    return el;
};

const describeSkip = describe.skip;
describeSkip('Decision Editor', () => {
    describe('label and description', () => {
        it('Adding name autofills dev name', () => {
            const decisionEditor = createComponentForTest(emptyDecision);
            return resolveRenderCycles(() => {
                const labelInput = decisionEditor.shadowRoot
                    .querySelector(SELECTORS.LABEL_DESCRIPTION_COMPONENT)
                    .shadowRoot.querySelector(SELECTORS.LABEL);
                labelInput.value = NEW_DECISION_LABEL;
                labelInput.dispatchEvent(focusoutEvent);
                return resolveRenderCycles(() => {
                    expect(decisionEditor.node.label.value).toBe(NEW_DECISION_LABEL);
                    expect(decisionEditor.node.name.value).toBe(NEW_DECISION_DEV_NAME);
                });
            });
        });

        it('Dev name is unchanged if it already exists and name is modified', () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);
            return resolveRenderCycles(() => {
                const newLabel = 'new label';
                const labelInput = decisionEditor.shadowRoot
                    .querySelector(SELECTORS.LABEL_DESCRIPTION_COMPONENT)
                    .shadowRoot.querySelector(SELECTORS.LABEL);
                labelInput.value = newLabel;
                labelInput.dispatchEvent(focusoutEvent);
                return resolveRenderCycles(() => {
                    expect(decisionEditor.node.label.value).toBe(newLabel);
                    expect(decisionEditor.node.name.value).toBe(NEW_DECISION_DEV_NAME);
                });
            });
        });
    });

    describe('outcome list', () => {
        it('default outcome and detail page are always present', () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);
            return resolveRenderCycles(() => {
                // Initially we have 2 outcomes in left nav (one default) and 1 outcome detail page
                const outcomeDetailPages = decisionEditor.shadowRoot.querySelectorAll(SELECTORS.OUTCOME);
                expect(outcomeDetailPages).toHaveLength(1);
                const outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                expect(outcomes).toHaveLength(2);
            });
        });

        it('click on Add Outcome will create a new outcome', () => {
            const decisionEditor = createComponentForTest(decisionWithOneOutcome);
            return resolveRenderCycles(() => {
                const addOutcomeElement = decisionEditor.shadowRoot.querySelector(SELECTORS.ADD_BUTTON);
                addOutcomeElement.click();
                return resolveRenderCycles(() => {
                    // After click we have 3 outcomes in left nav (one default)
                    // but still just 1 outcome detail page
                    const outcomeDetailPages = decisionEditor.shadowRoot.querySelectorAll(SELECTORS.OUTCOME);
                    expect(outcomeDetailPages).toHaveLength(1);
                    const outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                    expect(outcomes).toHaveLength(3);
                });
            });
        });

        it('reorder list sets the correct order of outcomes', () => {
            const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
            return resolveRenderCycles(() => {
                expect(decisionEditor.getNode().outcomes[0].guid).toBe(outcome1Guid);
                const reorderableNav = decisionEditor.shadowRoot.querySelector(SELECTORS.REORDERABLE_NAV);
                // fire event to switch order
                reorderableNav.dispatchEvent(reorderListEvent);
                return resolveRenderCycles(() => {
                    expect(decisionEditor.getNode().outcomes[0].guid).toBe(outcome2Guid);
                });
            });
        });
    });

    describe('outcome detail', () => {
        describe('label and description', () => {
            it('Adding name autofills dev name', () => {
                const decisionEditor = createComponentForTest(emptyDecision);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const detailLabelInput = unwrap(
                        outcomeDetailPage.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION_COMPONENT)
                    ).querySelector(SELECTORS.LABEL);
                    detailLabelInput.value = NEW_OUTCOME_LABEL;
                    detailLabelInput.dispatchEvent(focusoutEvent);
                    return resolveRenderCycles(() => {
                        expect(decisionEditor.node.outcomes[0].label.value).toBe(NEW_OUTCOME_LABEL);
                        expect(decisionEditor.node.outcomes[0].name.value).toBe(NEW_OUTCOME_DEV_NAME);
                    });
                });
            });

            it('Dev name is unchanged if it already exists and name is modified', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcome);
                return resolveRenderCycles(() => {
                    const newLabel = 'new outcome label';
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const detailLabelInput = unwrap(
                        outcomeDetailPage.shadowRoot.querySelector(SELECTORS.LABEL_DESCRIPTION_COMPONENT)
                    ).querySelector(SELECTORS.LABEL);
                    detailLabelInput.value = newLabel;
                    detailLabelInput.dispatchEvent(focusoutEvent);
                    return resolveRenderCycles(() => {
                        expect(decisionEditor.node.outcomes[0].label.value).toBe(newLabel);
                        expect(decisionEditor.node.outcomes[0].name.value).toBe(outcome1Guid);
                    });
                });
            });
        });

        describe('add/delete conditions', () => {
            it('add condition', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcome);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                    const list = conditionList.shadowRoot.querySelector(SELECTORS.LIST);
                    // Should only have 1 condition in the list
                    expect(decisionEditor.getNode().outcomes[0].conditions).toHaveLength(1);

                    const button = list.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON);
                    button.click();
                    // Should have 2 conditions
                    expect(decisionEditor.getNode().outcomes[0].conditions).toHaveLength(2);
                });
            });

            it('delete is disabled for one condition', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcome);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                    expect(decisionEditor.getNode().outcomes[0].conditions).toHaveLength(1);

                    const row = conditionList.querySelector(SELECTORS.ROW);
                    const button = row.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON_ICON);
                    expect(button.disabled).toBeTruthy();
                });
            });

            it('delete is clickable and works for 2 or more conditions', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcome);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.querySelector(SELECTORS.OUTCOME);
                    const list = outcomeDetailPage.querySelector(SELECTORS.LIST);
                    const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                    const addConditionButton = list.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON);
                    addConditionButton.click();
                    expect(decisionEditor.getNode().outcomes[0].conditions).toHaveLength(2);
                    const row = conditionList.querySelector(SELECTORS.ROW);
                    const deleteButton = row.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON_ICON);
                    return resolveRenderCycles(() => {
                        expect(deleteButton.disabled).toBeFalsy();

                        // make sure clicking the button deletes the condition
                        deleteButton.click();
                        expect(decisionEditor.getNode().outcomes[0].conditions).toHaveLength(1);
                    });
                });
            });
        });

        describe('logic', () => {
            it('all conditions are met has AND for more than one row', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcomeWithTwoConditions);
                return resolveRenderCycles(() => {
                    expect(decisionEditor.node.outcomes[0].conditionLogic.value).toBe(CONDITION_LOGIC.AND);

                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                    const row = conditionList.querySelectorAll(SELECTORS.ROW);
                    const legendText = row[1].shadowRoot.querySelector(SELECTORS.LEGEND_TEXT).textContent;
                    expect(legendText).toBe(CONDITION_PREFIXES.AND);
                });
            });

            it('any condition is met has OR for more than one row', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcomeWithTwoConditions);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.querySelector(SELECTORS.OUTCOME);
                    const conditionCombobox = outcomeDetailPage.querySelector(SELECTORS.CONDITION_COMBOBOX);

                    const cbChangeEvent = changeEvent(CONDITION_LOGIC.OR);
                    conditionCombobox.dispatchEvent(cbChangeEvent);
                    return resolveRenderCycles(() => {
                        expect(decisionEditor.node.outcomes[0].conditionLogic.value).toBe(CONDITION_LOGIC.OR);
                        const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                        const row = conditionList.querySelectorAll(SELECTORS.ROW);
                        const legendText = row[1].shadowRoot.querySelector(SELECTORS.LEGEND_TEXT).textContent;
                        expect(legendText).toBe(CONDITION_PREFIXES.OR);
                    });
                });
            });

            it('custom condition logic input and shows number for rows', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcomeWithTwoConditions);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.querySelector(SELECTORS.OUTCOME);
                    const conditionCombobox = outcomeDetailPage.querySelector(SELECTORS.CONDITION_COMBOBOX);

                    const cbChangeEvent = changeEvent(CONDITION_LOGIC.CUSTOM_LOGIC);
                    conditionCombobox.dispatchEvent(cbChangeEvent);
                    return resolveRenderCycles(() => {
                        expect(decisionEditor.node.outcomes[0].conditionLogic.value).toBe('1 AND 2');
                        const conditionList = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.CONDITION_LIST);
                        const row = conditionList.querySelectorAll(SELECTORS.ROW);
                        let legendText = row[0].shadowRoot.querySelector(SELECTORS.LEGEND_TEXT).textContent;
                        expect(legendText).toBe('1');
                        legendText = row[1].shadowRoot.querySelector(SELECTORS.LEGEND_TEXT).textContent;
                        expect(legendText).toBe('2');
                    });
                });
            });
        });

        describe('default outcome', () => {
            it('no delete outcome button', () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
                return resolveRenderCycles(() => {
                    const outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                    outcomes[2].querySelector('a').click();
                    return resolveRenderCycles(() => {
                        const deleteOutcomeButton = decisionEditor.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON);
                        expect(deleteOutcomeButton).toBeNull();
                    });
                });
            });

            it('can update label', () => {
                const decisionEditor = createComponentForTest(emptyDecision);
                return resolveRenderCycles(() => {
                    const outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                    outcomes[1].querySelector('a').click();
                    return resolveRenderCycles(() => {
                        const labelDescription = decisionEditor.shadowRoot.querySelector(SELECTORS.DEFAULT_OUTCOME);
                        const defaultOutcomeLabelInput = labelDescription.shadowRoot.querySelector(SELECTORS.LABEL);
                        const newDefaultOutcomeLabel = 'blah blah blah';
                        defaultOutcomeLabelInput.value = newDefaultOutcomeLabel;

                        defaultOutcomeLabelInput.dispatchEvent(focusoutEvent);
                        return resolveRenderCycles(() => {
                            expect(defaultOutcomeLabelInput.value).toBe(newDefaultOutcomeLabel);
                        });
                    });
                });
            });
        });

        describe('delete outcome', () => {
            it('delete outcome button is not present when only one outcome', () => {
                const decisionEditor = createComponentForTest(decisionWithOneOutcome);
                return resolveRenderCycles(() => {
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const deleteOutcomeButton = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON);
                    expect(deleteOutcomeButton).toBeNull();
                });
            });

            it('delete outcome available with 2 or more outcomes and works', () => {
                const decisionEditor = createComponentForTest(decisionWithTwoOutcomes);
                return resolveRenderCycles(() => {
                    let outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                    expect(outcomes).toHaveLength(3);
                    const outcomeDetailPage = decisionEditor.shadowRoot.querySelector(SELECTORS.OUTCOME);
                    const deleteOutcomeButton = outcomeDetailPage.shadowRoot.querySelector(SELECTORS.LIGHTNING_BUTTON);
                    expect(deleteOutcomeButton).toBeDefined();
                    deleteOutcomeButton.click();
                    return resolveRenderCycles(() => {
                        outcomes = decisionEditor.querySelectorAll(SELECTORS.VERTICAL_TAB_NAV_ITEM);
                        expect(outcomes).toHaveLength(2);
                    });
                });
            });
        });
    });
});
