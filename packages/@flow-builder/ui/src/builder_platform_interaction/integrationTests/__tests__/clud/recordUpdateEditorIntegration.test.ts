import { createElement } from 'lwc';
import RecordUpdateEditor from 'builder_platform_interaction/recordUpdateEditor';
import { AddElementEvent, EditElementEvent, RecordStoreOptionChangedEvent } from 'builder_platform_interaction/events';
import {
    changeComboboxValue,
    changeInputValue,
    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES,
    getChildComponent,
    resetState,
    setupStateForFlow,
    translateFlowToUIAndDispatch
} from '../integrationTestUtils';
import { getLabelDescriptionLabelElement, getLabelDescriptionNameElement } from '../labelDescriptionTestUtils';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { CONDITION_LOGIC, ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    changeEvent,
    clickPill,
    LIGHTNING_COMPONENTS_SELECTORS,
    removePill,
    ticks
} from 'builder_platform_interaction/builderTestUtils';
import {
    getBaseResourcePickerCombobox,
    getEntityResourcePicker,
    getEntityResourcePickerChildGroupedComboboxComponent,
    getRecordFilter,
    getRecordInputOutputAssignments,
    getRecordStoreOption,
    getRecordVariablePickerChildComboboxComponent,
    getRecordVariablePickerChildGroupedComboboxComponent,
    getSObjectOrSObjectCollectionPicker
} from './cludEditorTestUtils';
import { getBaseExpressionBuilder } from '../expressionBuilderTestUtils';
import {
    getFieldToFerovExpressionBuilders,
    getFilterConditionLogicCombobox,
    getFilterCustomConditionLogicInput,
    newFilterItem
} from '../recordFilterTestUtils';
import { selectComboboxItemBy, typeLiteralValueInCombobox, typeMergeFieldInCombobox } from '../comboboxTestUtils';
import { WAY_TO_STORE_FIELDS } from 'builder_platform_interaction/recordEditorLib';

const SELECTORS = { ABBR: 'abbr' };

const createComponentForTest = (props) => {
    const el = createElement('builder_platform_interaction-record-update-editor', { is: RecordUpdateEditor });
    Object.assign(el, props);
    document.body.appendChild(el);
    return el;
};

jest.mock('@salesforce/label/FlowBuilderElementLabels.subflowAsResourceText', () => ({ default: 'Outputs from {0}' }), {
    virtual: true
});
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.recordCreateIdAsResourceText',
    () => ({ default: '{0}Id from {1}' }),
    { virtual: true }
);

jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.recordLookupAsResourceText',
    () => ({ default: '{0} from {1}' }),
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.loopAsResourceText',
    () => {
        return { default: 'Current Item from Loop {0}' };
    },
    { virtual: true }
);
jest.mock(
    '@salesforce/label/FlowBuilderElementLabels.lightningComponentScreenFieldAsResourceText',
    () => {
        return { default: '{0}' };
    },
    { virtual: true }
);

describe('Record Update Editor', () => {
    let recordUpdateNode, recordUpdateComponent;
    beforeAll(async () => {
        const store = await setupStateForFlow(flowWithAllElements);
        translateFlowToUIAndDispatch(flowWithAllElements, store);
    });
    afterAll(() => {
        resetState();
    });
    describe('name and dev name', () => {
        beforeAll(() => {
            const element = getElementByDevName('updateSObject');
            recordUpdateNode = getElementForPropertyEditor(element);
        });
        beforeEach(() => {
            recordUpdateComponent = createComponentForTest({
                node: recordUpdateNode,
                mode: AddElementEvent.EVENT_NAME
            });
        });
        it('does not change "dev name" if it already exists after the user modifies the "label"', async () => {
            const newLabel = 'new label';
            await changeInputValue(getLabelDescriptionLabelElement(recordUpdateComponent), newLabel);
            expect(recordUpdateComponent.node.label.value).toBe(newLabel);
            expect(recordUpdateComponent.node.name.value).toBe(recordUpdateNode.name.value);
        });
        it('modifies the "dev name"', async () => {
            const newDevName = 'newDevName';
            await changeInputValue(getLabelDescriptionNameElement(recordUpdateComponent), newDevName);
            expect(recordUpdateComponent.node.name.value).toBe(newDevName);
        });
        it('displays error if the "label" is cleared', async () => {
            await changeInputValue(getLabelDescriptionLabelElement(recordUpdateComponent), '');
            expect(recordUpdateComponent.node.label.error).toBe(FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK);
        });
        it('displays error if the "dev name" is cleared', async () => {
            await changeInputValue(getLabelDescriptionNameElement(recordUpdateComponent), '');
            expect(recordUpdateComponent.node.name.error).toBe(FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK);
        });
    });
    describe('Add new element', () => {
        beforeAll(() => {
            recordUpdateNode = getElementForPropertyEditor({
                elementType: ELEMENT_TYPE.RECORD_UPDATE,
                isNewElement: true
            });
        });
        beforeEach(() => {
            recordUpdateComponent = createComponentForTest({ node: recordUpdateNode });
        });
        describe('store options', () => {
            let storeOptions;
            beforeEach(() => {
                storeOptions = getRecordStoreOption(recordUpdateComponent);
            });
            it('should be displayed', () => {
                expect(storeOptions).not.toBeNull();
            });
            it('value should be "firstRecord" (ie: "Use the IDs stored in a record variable or record collection variable")', () => {
                expect(storeOptions.numberOfRecordsToStore).toBe('firstRecord');
            });
        });
        describe('Record Variable or Record Collection Variable picker', () => {
            let recordVariablePicker;
            beforeEach(() => {
                recordVariablePicker = getSObjectOrSObjectCollectionPicker(recordUpdateComponent);
            });
            it('should be displayed', () => {
                expect(recordVariablePicker).not.toBeNull();
            });
            it('value should be an empty string', () => {
                expect(recordVariablePicker.value).toBe('');
            });

            describe('pills', () => {
                it('should have no pill displayed', () => {
                    const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                    expect(combobox.hasPill).toBe(false);
                });
                describe('events', () => {
                    it('typing and blur with "sobjectOrSobjectCollectionPicker" sobject variable display pill (once pill has been cleared))', async () => {
                        const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                        await typeMergeFieldInCombobox(combobox, '{!accountSObjectCollectionVariable}');
                        expect(combobox.hasPill).toBe(true);
                        expect(combobox.pill).toEqual({
                            iconName: 'utility:sobject',
                            label: 'accountSObjectCollectionVariable'
                        });
                    });
                    it('typing and blur with "sobjectOrSobjectCollectionPicker" literal value display no pill but error message (once pill has been cleared))', async () => {
                        const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                        await typeLiteralValueInCombobox(combobox, 'literalitis');
                        expect(combobox.hasPill).toBe(false);
                        expect(combobox.errorMessage).toEqual('FlowBuilderCombobox.genericErrorMessage');
                    });
                    it('select and blur with "sobjectOrSobjectCollectionPicker" sobject variable display pill (once pill has been cleared))', async () => {
                        const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                        await selectComboboxItemBy(combobox, 'text', ['accountSObjectCollectionVariable']);
                        expect(combobox.hasPill).toBe(true);
                        expect(combobox.pill).toEqual({
                            iconName: 'utility:sobject',
                            label: 'accountSObjectCollectionVariable'
                        });
                    });
                });
            });
        });
        describe('default Filter', () => {
            it('should be all (Conditions are Met)', async () => {
                const recordStoreElement = getRecordStoreOption(recordUpdateComponent);
                recordStoreElement.dispatchEvent(
                    new RecordStoreOptionChangedEvent(false, WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE, false)
                );
                await ticks(1);
                const entityResourcePicker = getEntityResourcePicker(recordUpdateComponent);
                changeComboboxValue(
                    getEntityResourcePickerChildGroupedComboboxComponent(entityResourcePicker),
                    'Contract'
                );
                await ticks(1);
                expect(entityResourcePicker.value).toMatchObject({
                    displayText: 'Contract',
                    value: 'Contract'
                });
                const recordFilter = getRecordFilter(recordUpdateComponent);
                expect(recordFilter.filterLogic.value).toBe(CONDITION_LOGIC.AND);
            });
        });
    });
    describe('Existing element', () => {
        describe('Working with sObject', () => {
            beforeEach(() => {
                const element = getElementByDevName('updateSObject');
                recordUpdateNode = getElementForPropertyEditor(element);
                recordUpdateComponent = createComponentForTest({
                    node: recordUpdateNode,
                    mode: EditElementEvent.EVENT_NAME
                });
            });
            describe('store options', () => {
                let storeOptions;
                beforeEach(() => {
                    storeOptions = getRecordStoreOption(recordUpdateComponent);
                });
                it('should be displayed', () => {
                    expect(storeOptions).not.toBeNull();
                });
                it('should have numberOfRecordsToStore equal to "firstRecord" (ie: "Use the IDs stored in a record variable or record collection variable")', () => {
                    expect(storeOptions.numberOfRecordsToStore).toBe('firstRecord');
                });
            });
            describe('Record Variable or Record Collection Variable picker', () => {
                let recordVariablePicker;
                beforeEach(() => {
                    recordVariablePicker = getSObjectOrSObjectCollectionPicker(recordUpdateComponent);
                });
                it('should be displayed', () => {
                    expect(recordVariablePicker).not.toBeNull();
                });
                it('displays selected value', () => {
                    expect(recordVariablePicker.value).toBe(recordUpdateNode.inputReference.value);
                });
                describe('pills', () => {
                    it('displays a pill with the selected value', async () => {
                        const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                        expect(combobox.hasPill).toBe(true);
                        expect(combobox.pill).toEqual({
                            iconName: 'utility:sobject',
                            label: 'accountSObjectCollectionVariable'
                        });
                    });
                    it('displays "abbr" element as it is a required field', async () => {
                        const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                        const abbrElement = combobox.shadowRoot.querySelector(SELECTORS.ABBR);
                        expect(abbrElement).not.toBeNull();
                    });
                    describe('events', () => {
                        it('displays empty combobox and no pill when pill is cleared', async () => {
                            const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                            expect(combobox.hasPill).toBe(true);
                            await removePill(combobox);
                            expect(combobox.hasPill).toBe(false);
                            expect(combobox.value).toEqual('');
                        });
                        it('switches to mergeField notation when clicking on "sobjectOrSobjectCollectionPicker" pill', async () => {
                            const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                            expect(combobox.hasPill).toBe(true);
                            await clickPill(combobox);
                            expect(combobox.hasPill).toBe(false);
                            expect(combobox.value.displayText).toEqual('{!accountSObjectCollectionVariable}');
                        });
                        describe('typing', () => {
                            describe('errors', () => {
                                it.each`
                                    resourcePickerMergefieldValue   | errorMessage
                                    ${'{!accountSObjectVariable2}'} | ${'FlowBuilderMergeFieldValidation.unknownResource'}
                                    ${'{!accountSObjectVariable'}   | ${'FlowBuilderCombobox.genericErrorMessage'}
                                    ${'{!accountSObjectVariable.}'} | ${'FlowBuilderCombobox.genericErrorMessage'}
                                    ${'literalitis'}                | ${'FlowBuilderMergeFieldValidation.unknownResource'}
                                `(
                                    'When typing "$resourcePickerMergefieldValue" error message should be: $errorMessage',
                                    async ({ resourcePickerMergefieldValue, errorMessage }) => {
                                        const combobox = getRecordVariablePickerChildComboboxComponent(
                                            recordVariablePicker
                                        );
                                        await removePill(combobox);
                                        await typeMergeFieldInCombobox(combobox, resourcePickerMergefieldValue);
                                        expect(combobox.hasPill).toBe(false);
                                        expect(combobox.errorMessage).toEqual(errorMessage);
                                    }
                                );
                            });
                            describe('NO errors', () => {
                                it.each`
                                    resourcePickerMergefieldValue                 | expectedPill
                                    ${'{!accountSObjectVariable}'}                | ${{ iconName: 'utility:sobject', label: 'accountSObjectVariable' }}
                                    ${'{!apexComplexTypeVariable.acct}'}          | ${{ iconName: 'utility:sobject', label: 'apexComplexTypeVariable > acct' }}
                                    ${'{!subflowAutomaticOutput.accountOutput}'}  | ${{ iconName: 'utility:sobject', label: 'Outputs from subflowAutomaticOutput > accountOutput' }}
                                    ${'{!lookupRecordAutomaticOutput}'}           | ${{ iconName: 'utility:sobject', label: 'Account from lookupRecordAutomaticOutput' }}
                                    ${'{!apexCall_anonymous_account}'}            | ${{ iconName: 'utility:sobject', label: 'Account from apexCall_anonymous_account' }}
                                    ${'{!loopOnAccountAutoOutput}'}               | ${{ iconName: 'utility:sobject', label: 'Current Item from Loop loopOnAccountAutoOutput' }}
                                    ${'{!accountSObjectCollectionVariable}'}      | ${{ iconName: 'utility:sobject', label: 'accountSObjectCollectionVariable' }}
                                    ${'{!apexComplexTypeVariable.acct}'}          | ${{ iconName: 'utility:sobject', label: 'apexComplexTypeVariable > acct' }}
                                    ${'{!lookupRecordCollectionAutomaticOutput}'} | ${{ iconName: 'utility:sobject', label: 'Accounts from lookupRecordCollectionAutomaticOutput' }}
                                    ${'{!apexCall_anonymous_accounts}'}           | ${{ iconName: 'utility:sobject', label: 'Accounts from apexCall_anonymous_accounts' }}
                                `(
                                    'When typing "$resourcePickerMergefieldValue" pill should be: $expectedPill',
                                    async ({ resourcePickerMergefieldValue, expectedPill }) => {
                                        const combobox = getRecordVariablePickerChildComboboxComponent(
                                            recordVariablePicker
                                        );
                                        await removePill(combobox);
                                        await typeMergeFieldInCombobox(combobox, resourcePickerMergefieldValue);
                                        expect(combobox.hasPill).toBe(true);
                                        expect(combobox.pill).toEqual(expectedPill);
                                    }
                                );
                            });
                        });
                        describe('selecting', () => {
                            it.each`
                                resourcePickerValue                                      | expectedPill
                                ${'accountSObjectVariable'}                              | ${{ iconName: 'utility:sobject', label: 'accountSObjectVariable' }}
                                ${'apexComplexTypeVariable.acct'}                        | ${{ iconName: 'utility:sobject', label: 'apexComplexTypeVariable > acct' }}
                                ${'Outputs from subflowAutomaticOutput.accountOutput'}   | ${{ iconName: 'utility:sobject', label: 'Outputs from subflowAutomaticOutput > accountOutput' }}
                                ${'Account from lookupRecordAutomaticOutput'}            | ${{ iconName: 'utility:sobject', label: 'Account from lookupRecordAutomaticOutput' }}
                                ${'Account from apexCall_anonymous_account'}             | ${{ iconName: 'utility:sobject', label: 'Account from apexCall_anonymous_account' }}
                                ${'Current Item from Loop loopOnAccountAutoOutput'}      | ${{ iconName: 'utility:sobject', label: 'Current Item from Loop loopOnAccountAutoOutput' }}
                                ${'accountSObjectCollectionVariable'}                    | ${{ iconName: 'utility:sobject', label: 'accountSObjectCollectionVariable' }}
                                ${'Accounts from lookupRecordCollectionAutomaticOutput'} | ${{ iconName: 'utility:sobject', label: 'Accounts from lookupRecordCollectionAutomaticOutput' }}
                                ${'Accounts from apexCall_anonymous_accounts'}           | ${{ iconName: 'utility:sobject', label: 'Accounts from apexCall_anonymous_accounts' }}
                                ${'apexComplexTypeVariable.acctListField'}               | ${{ iconName: 'utility:sobject', label: 'apexComplexTypeVariable > acctListField' }}
                            `(
                                'When selecting "$resourcePickerValue" pill should be: $expectedPill',
                                async ({ resourcePickerValue, expectedPill }) => {
                                    const combobox = getRecordVariablePickerChildComboboxComponent(
                                        recordVariablePicker
                                    );
                                    await removePill(combobox);
                                    await selectComboboxItemBy(combobox, 'text', resourcePickerValue.split('.'));
                                    expect(combobox.hasPill).toBe(true);
                                    expect(combobox.pill).toEqual(expectedPill);
                                }
                            );
                        });
                    });
                });
                it('should contain "New Resource" entry', async () => {
                    const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                    await removePill(combobox);
                    expect(
                        selectComboboxItemBy(combobox, 'text', ['FlowBuilderExpressionUtils.newResourceLabel'])
                    ).toBeDefined();
                });
                it('should contain all record variables', async () => {
                    const combobox = getRecordVariablePickerChildComboboxComponent(recordVariablePicker);
                    await removePill(combobox);
                    const comboboxItems = getRecordVariablePickerChildGroupedComboboxComponent(recordVariablePicker)
                        .items;
                    expect(comboboxItems).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                items: expect.arrayContaining([
                                    expect.objectContaining({
                                        text: 'accountSObjectCollectionVariable'
                                    }),
                                    expect.objectContaining({
                                        text: 'caseSObjectCollectionVariable'
                                    })
                                ])
                            })
                        ])
                    );
                });
            });
        });
        describe('Working with fields', () => {
            beforeAll(() => {
                const element = getElementByDevName('updateAccountWithFilter');
                recordUpdateNode = getElementForPropertyEditor(element);
            });
            beforeEach(() => {
                recordUpdateComponent = createComponentForTest({
                    node: recordUpdateNode,
                    mode: EditElementEvent.EVENT_NAME
                });
            });
            describe('store options', () => {
                let storeOptions;
                beforeEach(() => {
                    storeOptions = getRecordStoreOption(recordUpdateComponent);
                });
                it('should be displayed', () => {
                    expect(storeOptions).not.toBeNull();
                });
                it('should have numberOfRecordsToStore be "allRecords" (ie: "Specify conditions")', () => {
                    expect(storeOptions.numberOfRecordsToStore).toBe('allRecords');
                });
            });
            describe('Entity resource picker', () => {
                let entityResourcePicker;
                beforeEach(() => {
                    entityResourcePicker = getEntityResourcePicker(recordUpdateComponent);
                });
                it('should be displayed', () => {
                    expect(entityResourcePicker).not.toBeNull();
                });
                it('should correctly display the selected entity', () => {
                    expect(entityResourcePicker.value.displayText).toBe(recordUpdateNode.object.value);
                });
                it('should have only updatable entities', async () => {
                    // see mock-entity.js (updatable = true)
                    // Disable render-incrementally on combobox so groupedCombobox gets full menu data
                    const combobox = getBaseResourcePickerCombobox(entityResourcePicker);
                    combobox.renderIncrementally = false;
                    await ticks(1);
                    const comboboxItems = getEntityResourcePickerChildGroupedComboboxComponent(entityResourcePicker)
                        .items;
                    expect(comboboxItems).toContainEqual(expect.objectContaining({ displayText: 'Contract' }));
                    expect(comboboxItems).toContainEqual(expect.objectContaining({ displayText: 'Contact' }));
                    expect(comboboxItems).not.toContainEqual(expect.objectContaining({ displayText: 'Account Feed' }));
                    expect(comboboxItems).not.toContainEqual(expect.objectContaining({ displayText: 'Bookmark' }));
                });
                describe('when invalid value is entered', () => {
                    beforeEach(async () => {
                        changeComboboxValue(
                            getEntityResourcePickerChildGroupedComboboxComponent(entityResourcePicker),
                            'invalidValue'
                        );
                        await ticks(1);
                    });
                    it('should NOT display record filters', () => {
                        expect(getRecordFilter(recordUpdateComponent)).toBeNull();
                    });
                    it('should display invalid entry error', () => {
                        expect(recordUpdateComponent.node.object.error).toBe(
                            FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.GENERIC
                        );
                    });
                });
                describe('when filled with a new valid value', () => {
                    let filterItems;
                    beforeEach(() => {
                        changeComboboxValue(
                            getEntityResourcePickerChildGroupedComboboxComponent(entityResourcePicker),
                            'Contact'
                        );
                    });
                    it('should change value and display it', () => {
                        expect(entityResourcePicker.value).toMatchObject({
                            displayText: 'Contact',
                            value: 'Contact'
                        });
                    });
                    it('should NOT display an error', () => {
                        expect(recordUpdateComponent.node.object.error).toBeNull();
                    });
                    it('should display record filters', () => {
                        expect(getRecordFilter(recordUpdateComponent)).not.toBeNull();
                    });
                    it('should display 1 filters item', () => {
                        filterItems = getRecordFilter(recordUpdateComponent).filterItems;
                        expect(filterItems).toHaveLength(1);
                    });
                    it('should display the filters item LHS/Operator/RHS', () => {
                        filterItems = getRecordFilter(recordUpdateComponent).filterItems;
                        expect(filterItems[0]).toMatchObject(newFilterItem());
                    });
                });
                describe('when value removed (empty string)', () => {
                    beforeEach(async () => {
                        changeComboboxValue(
                            getEntityResourcePickerChildGroupedComboboxComponent(entityResourcePicker),
                            ''
                        );
                        await ticks(1);
                    });
                    it('should NOT display record filters', () => {
                        expect(getRecordFilter(recordUpdateComponent)).toBeNull();
                    });
                    it('should display required value error', () => {
                        expect(recordUpdateComponent.node.object.error).toBe(
                            FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK
                        );
                    });
                });
            });
            describe('Record Filter', () => {
                let recordFilter;
                beforeEach(() => {
                    recordFilter = getRecordFilter(recordUpdateComponent);
                });
                it('should be displayed', () => {
                    expect(recordFilter).not.toBeNull();
                });
                it('should have filter logic equals to "and"', () => {
                    expect(recordFilter.filterLogic).toMatchObject({ error: null, value: '1 AND 2 OR 3' });
                });
                it('should have a number of filters equals to 2', () => {
                    expect(recordFilter.filterItems).toHaveLength(3);
                });
                it('should display the filters item LHS/Operator/RHS', () => {
                    expect(recordFilter.filterItems[0]).toMatchObject(
                        newFilterItem('Account.BillingCity', 'EqualTo', 'San Francisco', 'String')
                    );
                    expect(recordFilter.filterItems[1]).toMatchObject(
                        newFilterItem('Account.BillingCountry', 'EqualTo', 'USA', 'String')
                    );
                    expect(recordFilter.filterItems[2]).toMatchObject(
                        newFilterItem('Account.Name', 'EqualTo', 'Salesforce', 'String')
                    );
                });
                it('should have the operators available', () => {
                    const fieldToFerovExpressionBuilders = getFieldToFerovExpressionBuilders(recordFilter);
                    const baseExpressionBuilderComponent = getBaseExpressionBuilder(fieldToFerovExpressionBuilders[0]);
                    const operatorsComboboxComponent = getChildComponent(
                        baseExpressionBuilderComponent,
                        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_COMBOBOX
                    );
                    expect(operatorsComboboxComponent.options).toHaveLength(6);
                    expect(operatorsComboboxComponent.options).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({ value: 'EqualTo' }),
                            expect.objectContaining({ value: 'NotEqualTo' }),
                            expect.objectContaining({ value: 'StartsWith' }),
                            expect.objectContaining({ value: 'Contains' }),
                            expect.objectContaining({ value: 'EndsWith' }),
                            expect.objectContaining({ value: 'IsNull' })
                        ])
                    );
                });
                describe('When Condition logic change to "and"', () => {
                    it('should not display the custom condition logic input', async () => {
                        getFilterConditionLogicCombobox(recordUpdateComponent).dispatchEvent(
                            changeEvent(CONDITION_LOGIC.AND)
                        );
                        await ticks(1);
                        expect(getFilterCustomConditionLogicInput(recordUpdateComponent)).toBeNull();
                    });
                });
            });
            describe('Input Assignments', () => {
                let inputAssignments;
                let fieldToFerovExpressionBuilder;
                beforeEach(() => {
                    inputAssignments = getRecordInputOutputAssignments(recordUpdateComponent);
                    fieldToFerovExpressionBuilder = getFieldToFerovExpressionBuilders(inputAssignments);
                });
                it('should be displayed', () => {
                    expect(inputAssignments).not.toBeNull();
                });
                it('should display the correct number of input assignment', () => {
                    expect(fieldToFerovExpressionBuilder).toHaveLength(1);
                });
                it('input assignment item LHS/Operator/RHS', () => {
                    const baseExpressionBuilder = getBaseExpressionBuilder(fieldToFerovExpressionBuilder[0]);
                    expect(baseExpressionBuilder.lhsValue).toMatchObject({
                        displayText: 'Name',
                        value: 'Account.Name'
                    });
                    expect(baseExpressionBuilder.operatorValue).toBeUndefined();
                    expect(baseExpressionBuilder.rhsValue).toBe('salesforce');
                });
            });
        });
    });
});
