import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import * as autoLaunchedFlow from 'mock/flows/autolaunchedFlow.json';
import * as contactRequestFlow from 'mock/flows/contactRequestFlow.json';
import {
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS
} from 'builder_platform_interaction/builderTestUtils';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { setupState, resetState, loadFlow } from '../integrationTestUtils';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { getLhsCombobox, getRhsCombobox } from '../expressionBuilderTestUtils';
import { selectGroupedComboboxItemBy } from '../groupedComboboxTestUtils';
import { createComponentForTest, getFerToFerovExpressionBuilder } from './decisionEditorTestUtils';
import { typeReferenceOrValueInCombobox, expectCanSelectInCombobox } from '../comboboxTestUtils';

const SELECTORS = {
    ...LIGHTNING_COMPONENTS_SELECTORS,
    ...INTERACTION_COMPONENTS_SELECTORS
};

const getLHSGroupedCombobox = decision => {
    return getLhsCombobox(getFerToFerovExpressionBuilder(decision)).shadowRoot.querySelector(
        SELECTORS.LIGHTNING_GROUPED_COMBOBOX
    );
};

const getRHSGroupedCombobox = decision => {
    return getRhsCombobox(getFerToFerovExpressionBuilder(decision)).shadowRoot.querySelector(
        SELECTORS.LIGHTNING_GROUPED_COMBOBOX
    );
};

describe('Decision Editor', () => {
    let decisionForPropertyEditor, decisionEditor, store;
    beforeAll(() => {
        store = setupState();
    });
    afterAll(() => {
        resetState();
    });
    describe('Process type that supports lookup traversal', () => {
        beforeEach(async () => {
            await loadFlow(flowWithAllElements, store);

            const element = getElementByDevName('decision');
            decisionForPropertyEditor = getElementForPropertyEditor(element);
            decisionEditor = createComponentForTest(decisionForPropertyEditor);
        });
        it('shows up chevron on fields in LHS', async () => {
            const lhsCombobox = getLHSGroupedCombobox(decisionEditor);
            const accountCreatedByItem = await selectGroupedComboboxItemBy(
                lhsCombobox,
                'text',
                ['accountSObjectVariable', 'CreatedBy'],
                { blur: false }
            );

            expect(accountCreatedByItem.rightIconName).toBe('utility:chevronright');
        });
        it('shows up chevron on fields in RHS', async () => {
            const rhsCombobox = getRHSGroupedCombobox(decisionEditor);
            const accountCreatedByItem = await selectGroupedComboboxItemBy(
                rhsCombobox,
                'text',
                ['accountSObjectVariable', 'CreatedBy'],
                { blur: false }
            );

            expect(accountCreatedByItem.rightIconName).toBe('utility:chevronright');
        });
    });
    describe('AutoLaunched flow : does not support traversal if trigger type set', () => {
        describe('Trigger type is set', () => {
            beforeEach(async () => {
                await loadFlow(autoLaunchedFlow, store);

                const element = getElementByDevName('decision');
                decisionForPropertyEditor = getElementForPropertyEditor(element);
                decisionEditor = createComponentForTest(decisionForPropertyEditor);
            });
            it('does not show up chevron on fields in LHS', async () => {
                const lhsCombobox = getLHSGroupedCombobox(decisionEditor);
                const accountCreatedByItem = await selectGroupedComboboxItemBy(
                    lhsCombobox,
                    'text',
                    ['accountVariable', 'CreatedBy'],
                    { blur: false }
                );

                expect(accountCreatedByItem).toBeUndefined();

                const accountCreatedByIdItem = await selectGroupedComboboxItemBy(
                    lhsCombobox,
                    'text',
                    ['accountVariable', 'CreatedById'],
                    { blur: false }
                );

                expect(accountCreatedByIdItem).toBeDefined();
                expect(accountCreatedByIdItem.rightIconName).toBeUndefined();
            });
            it('does not show up chevron on fields in RHS', async () => {
                const rhsCombobox = getRHSGroupedCombobox(decisionEditor);
                const accountCreatedByItem = await selectGroupedComboboxItemBy(
                    rhsCombobox,
                    'text',
                    ['accountVariable', 'CreatedBy'],
                    { blur: false }
                );

                expect(accountCreatedByItem).toBeUndefined();

                const accountCreatedByIdItem = await selectGroupedComboboxItemBy(
                    rhsCombobox,
                    'text',
                    ['accountVariable', 'CreatedById'],
                    { blur: false }
                );

                expect(accountCreatedByIdItem).toBeDefined();
                expect(accountCreatedByIdItem.rightIconName).toBeUndefined();
            });
            describe('Validation', () => {
                let expressionBuilder;
                beforeEach(() => {
                    expressionBuilder = getFerToFerovExpressionBuilder(decisionEditor);
                });
                describe('Selection using comboboxes', () => {
                    const itCanSelectInLhs = (lhs, expectedItem = {}) =>
                        it(`can select [${lhs}] on lhs`, async () => {
                            const lhsCombobox = getLhsCombobox(expressionBuilder);
                            lhsCombobox.value = null;
                            await expectCanSelectInCombobox(lhsCombobox, 'text', lhs, expectedItem);
                        });
                    describe('apex variables', () => {
                        itCanSelectInLhs(['apexComplexTypeVariable', 'acct'], {
                            iconName: 'utility:sobject',
                            displayText: '{!apexComplexTypeVariable.acct}'
                        });
                        itCanSelectInLhs(['apexComplexTypeVariable', 'acct', 'Name'], {
                            displayText: '{!apexComplexTypeVariable.acct.Name}'
                        });
                    });
                });
                describe('Typing values', () => {
                    it.each`
                        lhs                                           | expectedErrorMessage
                        ${'{!apexComplexTypeVariable.acct}'}          | ${null}
                        ${'{!apexComplexTypeVariable.acct.Name}'}     | ${null}
                        ${'{!apex.acct.CreatedBy.AboutMe} '}          | ${'FlowBuilderCombobox.genericErrorMessage'}
                        ${'{!apexComplexTypeVariable.doesNotExist}'}  | ${'FlowBuilderMergeFieldValidation.unknownRecordField'}
                        ${'{!apexComplexTypeVariable.doesNotExist.}'} | ${'FlowBuilderCombobox.genericErrorMessage'}
                    `('error for "$lhs should be : $expectedErrorMessage', async ({ lhs, expectedErrorMessage }) => {
                        const lhsCombobox = getLhsCombobox(expressionBuilder);
                        await typeReferenceOrValueInCombobox(lhsCombobox, lhs);
                        expect(lhsCombobox.errorMessage).toEqual(expectedErrorMessage);
                    });
                });
            });
        });
    });
    describe('Process type that does not support lookup traversal', () => {
        beforeEach(async () => {
            await loadFlow(contactRequestFlow, store);

            const element = getElementByDevName('decision');
            decisionForPropertyEditor = getElementForPropertyEditor(element);
            decisionEditor = createComponentForTest(decisionForPropertyEditor);
        });
        it('does not show up chevron on fields in LHS', async () => {
            const lhsCombobox = getLHSGroupedCombobox(decisionEditor);
            const accountCreatedByItem = await selectGroupedComboboxItemBy(
                lhsCombobox,
                'text',
                ['vMyTestAccount', 'CreatedBy'],
                { blur: false }
            );

            expect(accountCreatedByItem).toBeUndefined();

            const accountCreatedByIdItem = await selectGroupedComboboxItemBy(
                lhsCombobox,
                'text',
                ['vMyTestAccount', 'CreatedById'],
                { blur: false }
            );

            expect(accountCreatedByIdItem).toBeDefined();
            expect(accountCreatedByIdItem.rightIconName).toBeUndefined();
        });
        it('does not show up chevron on fields in RHS', async () => {
            const rhsCombobox = getRHSGroupedCombobox(decisionEditor);
            const accountCreatedByItem = await selectGroupedComboboxItemBy(
                rhsCombobox,
                'text',
                ['vMyTestAccount', 'CreatedBy'],
                { blur: false }
            );

            expect(accountCreatedByItem).toBeUndefined();

            const accountCreatedByIdItem = await selectGroupedComboboxItemBy(
                rhsCombobox,
                'text',
                ['vMyTestAccount', 'CreatedById'],
                { blur: false }
            );

            expect(accountCreatedByIdItem).toBeDefined();
            expect(accountCreatedByIdItem.rightIconName).toBeUndefined();
        });
    });
});
