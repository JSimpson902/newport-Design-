import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { initializeAuraFetch } from '../serverDataTestUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { reducer } from 'builder_platform_interaction/reducers';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { FLOW_PROCESS_TYPE } from 'builder_platform_interaction/flowMetadata';
import { translateFlowToUIModel } from 'builder_platform_interaction/translatorLib';
import { updateFlow } from 'builder_platform_interaction/actions';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import { validateExpression } from '../expressionBuilderTestUtils';
import { loadFieldsForComplexTypesInFlow, loadOnProcessTypeChange, initializeLoader } from 'builder_platform_interaction/preloadLib';
import { createComponentForTest, getFerToFerovExpressionBuilder } from './decisionEditorTestUtils';
import { ticks } from 'builder_platform_interaction/builderTestUtils';
import { resetState } from '../integrationTestUtils';

describe('Decision Editor expression builder', () => {
    let decisionForPropertyEditor, decisionEditor, store;
    beforeAll(() => {
        store = Store.getStore(reducer);
        initializeAuraFetch();
        initializeLoader(store);
    });
    afterAll(() => {
        resetState();
    });
    describe('Validation', () => {
        let expressionBuilder;
        beforeAll(async () => {
            const uiFlow = translateFlowToUIModel(flowWithAllElements);
            store.dispatch(updateFlow(uiFlow));
            await loadOnProcessTypeChange(FLOW_PROCESS_TYPE.FLOW);
            await loadFieldsForComplexTypesInFlow(uiFlow);
        });
        beforeEach(async () => {
            const element = getElementByDevName('decision');
            decisionForPropertyEditor = getElementForPropertyEditor(element);
            decisionEditor = createComponentForTest(decisionForPropertyEditor);
            await ticks();
            expressionBuilder = getFerToFerovExpressionBuilder(decisionEditor);
        });

        test.each`
            lhs                                                     | operator     | rhs    | rhsErrorMessage
            ${'{!accountSObjectVariable.BillingLatitude}'}          | ${'EqualTo'} | ${'500.0'}     | ${undefined}
            ${'{!accountSObjectVariable.BillingLatitude}'}          | ${'EqualTo'} | ${'my string'} | ${'FlowBuilderCombobox.numberErrorMessage'}
                ${'{!feedItemVariable.CreatedBy:User.DigestFrequency}'} | ${'EqualTo'} | ${'D'} | ${undefined}
                ${'{!feedItemVariable.CreatedBy:User.DigestFrequency}'} | ${'EqualTo'} | ${'D'}         | ${undefined}
                ${'{!feedItemVariable.CreatedBy:User.NumberOfFailedLogins}'} | ${'GreaterThan'} | ${'2'}                        | ${undefined}
                ${'{!feedItemVariable.CreatedBy:User.NumberOfFailedLogins}'} | ${'GreaterThan'} | ${'myString'}                 | ${'FlowBuilderCombobox.numberErrorMessage'}
            `('"$lhs $operator $rhs" should be $rhsErrorMessage', async ({ lhs, operator, rhs, rhsErrorMessage }) => {
            expect(await validateExpression(expressionBuilder, { lhs, operator, rhs })).toEqual({ rhsErrorMessage });
        });
    });
});
