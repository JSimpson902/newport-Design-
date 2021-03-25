// @ts-nocheck
import { createElement } from 'lwc';
import Outcome from 'builder_platform_interaction/outcome';
import { DeleteOutcomeEvent, ExecuteWhenOptionChangedEvent } from 'builder_platform_interaction/events';
import { LABELS, outcomeExecuteWhenOptions } from '../outcomeLabels';
import { RULE_OPERATOR } from 'builder_platform_interaction/ruleLib';
import { getConditionsWithPrefixes } from 'builder_platform_interaction/conditionListUtils';
import { setDocumentBodyChildren, ticks } from 'builder_platform_interaction/builderTestUtils';
import { FlowComparisonOperator } from 'builder_platform_interaction/flowMetadata';

jest.mock('builder_platform_interaction/ferToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/ferToFerovExpressionBuilder')
);

jest.mock('builder_platform_interaction/conditionListUtils', () => {
    return {
        getConditionsWithPrefixes: jest.fn().mockName('getConditionsWithPrefixes').mockReturnValue([]),
        showDeleteCondition: jest.fn().mockName('showDeleteCondition')
    };
});

const outcomeWithOneConditional = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0 }]
};
const outcomeWithShowOptionsAndPriorConditionSet = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0 }],
    doesRequireRecordChangedToMeetCriteria: true,
    showOutcomeExecutionOptions: true
};
const outcomeHideOutcomeExecuteOptionsOnly = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0 }],
    doesRequireRecordChangedToMeetCriteria: false,
    showOutcomeExecutionOptions: false
};
const outcomeHideOutcomeExecuteOptionsAndPriorFalseCondition1 = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0 }],
    doesRequireRecordChangedToMeetCriteria: false,
    showOutcomeExecutionOptions: false
};
const outcomeHideOutcomeExecuteOptionsAndPriorFalseCondition2 = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0 }],
    doesRequireRecordChangedToMeetCriteria: true,
    showOutcomeExecutionOptions: false
};
const outcomeWithThreeConditionals = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1 and 2' },
    conditions: [
        { name: 'condition1', rowIndex: 0 },
        { name: 'condition2', rowIndex: 1 },
        { name: 'condition3', rowIndex: 2 }
    ]
};
const outcomeWithShowOptionsAndPriorConditionSetWithIsChangedOperator = {
    label: { value: 'Test Name of the Outcome' },
    name: { value: 'Test Dev Name' },
    guid: { value: '123' },
    conditionLogic: { value: '1' },
    conditions: [{ name: 'condition1', rowIndex: 0, operator: { value: FlowComparisonOperator.IsChanged } }],
    doesRequireRecordChangedToMeetCriteria: false,
    showOutcomeExecutionOptions: true
};

const selectors = {
    conditionList: 'builder_platform_interaction-list',
    row: 'builder_platform_interaction-row',
    labelAndName: 'builder_platform_interaction-label-description',
    button: 'lightning-button',
    conditionLogicComboBox: '.conditionLogic',
    doesRequireRecordChangedToMeetCriteria: '.doesRequireRecordChangedToMeetCriteria',
    customLogicInput: '.customLogic',
    removeButton: 'lightning-button.removeOutcome',
    radioButton: 'lightning-radio-group',
    executeWhenOptionRadioButtonGroup: 'lightning-radio-group.executeWhenOption',
    ferToFerovExpressionBuilder: 'builder_platform_interaction-fer-to-ferov-expression-builder',
    label: '.label',
    disableRadioGroupInformationText: 'div.slds-scoped-notification'
};

const createComponentUnderTest = () => {
    const el = createElement('builder_platform_interaction-outcome', {
        is: Outcome
    });

    setDocumentBodyChildren(el);

    el.showDelete = true;

    return el;
};

const onChangeExecuteWhenOptionEvent = (outcomeExecuteWhenOption) => {
    return new CustomEvent('change', {
        detail: {
            value: outcomeExecuteWhenOption
        }
    });
};

describe('Outcome', () => {
    describe('header section', () => {
        it('has name and api name component', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithOneConditional;

            await ticks(1);
            const labelAndNameComponents = element.shadowRoot.querySelectorAll(selectors.labelAndName);
            expect(labelAndNameComponents).toHaveLength(1);
            expect(labelAndNameComponents[0].devName.value).toBe(outcomeWithOneConditional.name.value);
            expect(labelAndNameComponents[0].label.value).toBe(outcomeWithOneConditional.label.value);
        });
        it('has Remove button if show delete is true', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithOneConditional;

            await ticks(1);
            const removeButton = element.shadowRoot.querySelectorAll(selectors.removeButton)[0];

            expect(removeButton.label).toBe(LABELS.deleteOutcomeLabel);
            expect(removeButton.title).toBe(LABELS.deleteOutcomeTitle);
        });
        it('has no Remove button if show delete is false', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithOneConditional;
            element.showDelete = false;

            await ticks(1);
            const removeButton = element.shadowRoot.querySelector(selectors.removeButton);

            expect(removeButton).toBeNull();
        });
        it('does not show the executeWhenOptions show options is not set (and prior condition false is not set)', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeHideOutcomeExecuteOptionsAndPriorFalseCondition1;

            await ticks(1);
            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            expect(executeWhenOptionRadioGroup).toBeNull();
        });
        it('does not show the executeWhenOptions show options is not set (and prior condition false is set)', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeHideOutcomeExecuteOptionsAndPriorFalseCondition2;

            await ticks(1);
            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            expect(executeWhenOptionRadioGroup).toBeNull();
        });
        it('shows the executeWhenOptions when show execute options is set and also has labels resolved for radio button group', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSet;
            element.showOutcomeExecutionOptions = true;

            await ticks(1);

            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            expect(executeWhenOptionRadioGroup.label).toBe(LABELS.executeOutcomeWhen);
            const executeWhenOptions = executeWhenOptionRadioGroup.options;

            expect(outcomeExecuteWhenOptions()[0].value).toBe('trueEveryTime');
            expect(outcomeExecuteWhenOptions()[1].value).toBe('trueOnChangeOnly');

            expect(executeWhenOptions[0].value).toBe(outcomeExecuteWhenOptions()[0].value);
            expect(executeWhenOptions[1].value).toBe(outcomeExecuteWhenOptions()[1].value);
        });
        it('has is prior false condition result required unset by default', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeHideOutcomeExecuteOptionsOnly;

            await ticks(1);
            // execute when option radio button group is displayed only for
            // certain trigger types and record save types
            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            expect(executeWhenOptionRadioGroup).toBeNull();
        });
        it('has is prior false condition result required set', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSet;
            element.showOutcomeExecutionOptions = true;

            await ticks(1);
            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            const outcomeExecuteWhenOption = executeWhenOptionRadioGroup.value;
            expect(outcomeExecuteWhenOption).toBe('trueOnChangeOnly');
        });
    });

    describe('handleDelete', () => {
        it('fires deleteOutcomeEvent with outcome GUID', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithThreeConditionals;

            await ticks(1);
            const eventCallback = jest.fn();
            element.addEventListener(DeleteOutcomeEvent.EVENT_NAME, eventCallback);

            const removeButton = element.shadowRoot.querySelector(selectors.button);
            removeButton.click();

            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    guid: element.outcome.guid
                }
            });
        });
    });

    describe('condition list', () => {
        it('expression builder type should be fer-to-ferov', async () => {
            const element = createComponentUnderTest();
            getConditionsWithPrefixes.mockReturnValueOnce([
                {
                    prefix: 'foo',
                    condition: { rowIndex: 'bar' },
                    conditionLogic: { value: '1' }
                }
            ]);
            element.outcome = outcomeWithOneConditional;

            await ticks(1);
            const expressionBuilder = element.shadowRoot.querySelector(selectors.ferToFerovExpressionBuilder);
            expect(expressionBuilder).not.toBeNull();
        });
        it('has one conditional row per conditional', async () => {
            const element = createComponentUnderTest();
            getConditionsWithPrefixes.mockReturnValue([
                {
                    prefix: 'foo',
                    condition: { rowIndex: 'bar' },
                    conditionLogic: { value: '1' }
                },
                {
                    prefix: 'fizz',
                    condition: { rowIndex: 'buzz' },
                    conditionLogic: { value: '1' }
                },
                {
                    prefix: 'dunder',
                    condition: { rowIndex: 'mifflin' },
                    conditionLogic: { value: '1' }
                }
            ]);
            element.outcome = outcomeWithThreeConditionals;

            await ticks(1);
            const rowsArray = element.shadowRoot.querySelectorAll(selectors.row);
            expect(rowsArray).toHaveLength(3);
        });
        it('passes EqualTo as the default operator', async () => {
            const element = createComponentUnderTest();
            getConditionsWithPrefixes.mockReturnValueOnce([
                {
                    prefix: 'foo',
                    condition: { rowIndex: 'bar' },
                    conditionLogic: { value: '1' }
                }
            ]);
            element.outcome = outcomeWithOneConditional;
            await ticks(1);
            const expressionBuilder = element.shadowRoot.querySelector(selectors.ferToFerovExpressionBuilder);
            expect(expressionBuilder.defaultOperator).toEqual(RULE_OPERATOR.EQUAL_TO);
        });
    });

    describe('label description', () => {
        it("should call input label's focus() when shouldFocus is true", async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithOneConditional;

            const labelAndNameComponents = element.shadowRoot.querySelectorAll(selectors.labelAndName);
            const inputLabel = labelAndNameComponents[0].shadowRoot.querySelector(selectors.label);
            inputLabel.focus = jest.fn();

            element.shouldFocus = true;

            await ticks(1);
            expect(labelAndNameComponents).toHaveLength(1);
            expect(inputLabel).not.toBeNull();
            expect(inputLabel.focus).toHaveBeenCalled();
        });

        it("should not call input label's focus() when shouldFocus is false", async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithOneConditional;

            const labelAndNameComponents = element.shadowRoot.querySelectorAll(selectors.labelAndName);
            const inputLabel = labelAndNameComponents[0].shadowRoot.querySelector(selectors.label);
            inputLabel.focus = jest.fn();

            element.shouldFocus = false;

            await ticks(1);
            expect(labelAndNameComponents).toHaveLength(1);
            expect(inputLabel).not.toBeNull();
            expect(inputLabel.focus).not.toHaveBeenCalled();
        });
    });

    describe('handle outcome change', () => {
        it('fires the corresponding event while capturing the doesRequireRecordChangedToMeetCriteria value', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSet;

            await ticks(1);
            const eventCallback = jest.fn();
            element.addEventListener(ExecuteWhenOptionChangedEvent.EVENT_NAME, eventCallback);
            const executeWhenOptionRadioButton = element.shadowRoot.querySelector(selectors.radioButton);
            executeWhenOptionRadioButton.dispatchEvent(onChangeExecuteWhenOptionEvent('trueOnChangeOnly'));
            await Promise.resolve();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    guid: element.outcome.guid,
                    doesRequireRecordChangedToMeetCriteria: true
                }
            });
        });
        it('fires the corresponding event while capturing the doesRequireRecordChangedToMeetCriteria value (unset)', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSet;

            await ticks(1);
            const eventCallback = jest.fn();
            element.addEventListener(ExecuteWhenOptionChangedEvent.EVENT_NAME, eventCallback);
            const executeWhenOptionRadioButton = element.shadowRoot.querySelector(selectors.radioButton);
            executeWhenOptionRadioButton.dispatchEvent(onChangeExecuteWhenOptionEvent('trueEveryTime'));
            await Promise.resolve();
            expect(eventCallback).toHaveBeenCalled();
            expect(eventCallback.mock.calls[0][0]).toMatchObject({
                detail: {
                    guid: element.outcome.guid,
                    doesRequireRecordChangedToMeetCriteria: false
                }
            });
        });
    });

    describe('handle disable execute outcome radio group', () => {
        it('should disable the radio group when IsChanged operator is selected with the object as resource', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSetWithIsChangedOperator;

            await ticks(1);
            const executeWhenOptionRadioButton = element.shadowRoot.querySelector(selectors.radioButton);
            expect(executeWhenOptionRadioButton.disabled).toBe(true);
        });
        it('should show the informational message when the execute outcome radio group is disabled', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSetWithIsChangedOperator;

            await ticks(1);
            const disableRadioGroupInformationTextDiv = element.shadowRoot.querySelector(
                selectors.disableRadioGroupInformationText
            );
            expect(disableRadioGroupInformationTextDiv).not.toBe(null);
        });
        it('should not show the informational message when the execute outcome radio group is enabled', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSet;

            await ticks(1);
            const disableRadioGroupInformationTextDiv = element.shadowRoot.querySelector(
                selectors.disableRadioGroupInformationText
            );
            expect(disableRadioGroupInformationTextDiv).toBe(null);
        });
        it('execute outcome radio group selection value is changed to trueEveryTime if trueOnChangeOnly is selected', async () => {
            const element = createComponentUnderTest();
            element.outcome = outcomeWithShowOptionsAndPriorConditionSetWithIsChangedOperator;

            await ticks(1);
            const executeWhenOptionRadioGroup = element.shadowRoot.querySelector(selectors.radioButton);
            const outcomeExecuteWhenOption = executeWhenOptionRadioGroup.value;
            expect(outcomeExecuteWhenOption).toBe('trueEveryTime');
        });
    });
});
