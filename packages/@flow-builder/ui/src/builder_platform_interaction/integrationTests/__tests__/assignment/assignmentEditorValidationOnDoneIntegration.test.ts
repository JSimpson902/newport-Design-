import { updateElement } from 'builder_platform_interaction/actions';
import AssignmentEditor from 'builder_platform_interaction/assignmentEditor';
import {
    clickEvent,
    INTERACTION_COMPONENTS_SELECTORS,
    setDocumentBodyChildren,
    ticks
} from 'builder_platform_interaction/builderTestUtils';
import { createRecordLookup } from 'builder_platform_interaction/elementFactory';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { createElement } from 'lwc';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { ComboboxTestComponent } from '../comboboxTestUtils';
import { ExpressionBuilderComponentTest } from '../expressionBuilderTestUtils';
import { FLOW_BUILDER_VALIDATION_ERROR_MESSAGES, resetState, setupStateForFlow } from '../integrationTestUtils';

const createComponentForTest = (assignmentElement) => {
    const el = createElement('builder_platform_interaction-assignment-editor', {
        is: AssignmentEditor
    });
    Object.assign(el, { node: assignmentElement });
    setDocumentBodyChildren(el);
    return el;
};

const getFerToFerovExpressionBuilder = (assignment, n = 0) =>
    new ExpressionBuilderComponentTest(
        assignment.shadowRoot.querySelectorAll(INTERACTION_COMPONENTS_SELECTORS.FER_TO_FEROV_EXPRESSION_BUILDER)[n]
    );

describe('Assignment Editor - Validation on done', () => {
    let storeInstance, assignment;
    describe('Type changed : Get Records automatic changed from "Only the first record" to "All records"', () => {
        const updateGetFirstRecordOnly = (getRecordsDevName, getFirstRecordOnly) => {
            let getRecordsElement = getElementByDevName(getRecordsDevName);
            getRecordsElement = createRecordLookup(Object.assign(getRecordsElement, { getFirstRecordOnly }));
            storeInstance.dispatch(updateElement(getRecordsElement));
        };
        beforeAll(async () => {
            storeInstance = await setupStateForFlow(flowWithAllElements);
            updateGetFirstRecordOnly('lookupRecordAutomaticOutput', false);

            const assignmentElement = getElementByDevName('assign_W_7251820');
            const assignmentForPropertyEditor = getElementForPropertyEditor(assignmentElement);
            assignment = createComponentForTest(assignmentForPropertyEditor);
            assignment.validate();
        });

        afterAll(() => {
            resetState();
        });
        describe('first assignment item ("{!lookupRecordAutomaticOutput.accountNumber} Equals {!accountSObjectVariable.AccountNumber}")', () => {
            it('should have an error on LHS', async () => {
                const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 0);
                const lhsCombobox = await expressionBuilder.getLhsCombobox();
                expect(lhsCombobox.element.errorMessage).toBe(
                    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.MERGE_FIELD_CANNOT_BE_USED
                );
            });
            it('keeps displayText on LHS after validation', async () => {
                // see W-7251820
                const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 0);
                const lhsCombobox = await expressionBuilder.getLhsCombobox();
                expect(lhsCombobox.element.value.displayText).toEqual('{!lookupRecordAutomaticOutput.AccountNumber}');
            });
            describe('pill', () => {
                let pillCombobox;
                let lhsCombobox: ComboboxTestComponent;
                beforeAll(async () => {
                    const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 0);
                    lhsCombobox = await expressionBuilder.getLhsCombobox();
                    pillCombobox = lhsCombobox.getPillElement();
                });
                // see W-7251820
                it('should be in error mode', () => {
                    expect(pillCombobox).not.toBeNull();
                });
                it('should display label', () => {
                    expect(pillCombobox.label).toEqual(
                        'FlowBuilderElementLabels.recordLookupAsResourceText > Account Number'
                    );
                });
                it('should have tooltip with label and error message', () => {
                    expect(lhsCombobox.element.pillTooltip).toEqual(
                        `FlowBuilderElementLabels.recordLookupAsResourceText > Account Number\n${lhsCombobox.element.errorMessage}`
                    );
                });
                describe('on click', () => {
                    beforeAll(async () => {
                        pillCombobox.dispatchEvent(clickEvent());
                        await ticks();
                    });

                    it('displays no longer the pill', () => {
                        expect(lhsCombobox.element.pill).toBeNull();
                    });
                    it('keeps the combobox error message', () => {
                        expect(lhsCombobox.element.errorMessage).toEqual(
                            FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.MERGE_FIELD_CANNOT_BE_USED
                        );
                    });
                    it('keeps the combobox selected displayText', () => {
                        expect(lhsCombobox.element.value.displayText).toEqual(
                            '{!lookupRecordAutomaticOutput.AccountNumber}'
                        );
                    });
                });
            });
        });
        describe('second assignment item ("{!lookupRecordAutomaticOutput} Equals {!accountSObjectVariable}")', () => {
            it('should have an error on RHS', async () => {
                const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 1);
                const rhsCombobox = await expressionBuilder.getRhsCombobox();
                expect(rhsCombobox.element.errorMessage).toBe(
                    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.MERGE_FIELD_INVALID_DATA_TYPE
                );
            });
            it('keeps displayText on RHS after validation', async () => {
                // see W-7251820
                const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 1);
                const rhsCombobox = await expressionBuilder.getRhsCombobox();
                expect(rhsCombobox.element.value.displayText).toEqual('{!accountSObjectVariable}');
            });
            describe('pill', () => {
                let pillCombobox;
                let rhsCombobox: ComboboxTestComponent;
                beforeAll(async () => {
                    const expressionBuilder = getFerToFerovExpressionBuilder(assignment, 1);
                    rhsCombobox = await expressionBuilder.getRhsCombobox();
                    pillCombobox = rhsCombobox.getPillElement();
                });
                // see W-7251820
                it('should be in error mode', () => {
                    expect(pillCombobox).not.toBeNull();
                });
                it('should display label', () => {
                    expect(pillCombobox.label).toEqual('accountSObjectVariable');
                });
                it('should have tooltip with label and error message', () => {
                    expect(rhsCombobox.element.pillTooltip).toEqual(
                        `accountSObjectVariable\n${rhsCombobox.element.errorMessage}`
                    );
                });
                describe('on click', () => {
                    beforeAll(async () => {
                        pillCombobox.dispatchEvent(clickEvent());
                        await ticks();
                    });

                    it('displays no longer the pill', () => {
                        expect(rhsCombobox.element.pill).toBeNull();
                    });
                    it('keeps the combobox error message', () => {
                        expect(rhsCombobox.element.errorMessage).toEqual(
                            FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.MERGE_FIELD_INVALID_DATA_TYPE
                        );
                    });
                    it('keeps the combobox selected displayText', () => {
                        expect(rhsCombobox.element.value.displayText).toEqual('{!accountSObjectVariable}');
                    });
                });
            });
        });
    });
});
