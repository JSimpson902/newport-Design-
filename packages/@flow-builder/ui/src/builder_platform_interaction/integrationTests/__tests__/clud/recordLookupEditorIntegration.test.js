import { createElement } from 'lwc';
import RecordLookupEditor from 'builder_platform_interaction/recordLookupEditor';
import { resolveRenderCycles } from '../resolveRenderCycles';

import {
    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES,
    getChildComponent,
    changeInputValue,
    changeComboboxValue,
    resetState,
    setupStateForProcessType,
    translateFlowToUIAndDispatch
} from '../integrationTestUtils';
import { getLabelDescriptionLabelElement, getLabelDescriptionNameElement } from '../labelDescriptionTestUtils';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { EditElementEvent, AddElementEvent } from 'builder_platform_interaction/events';
import { getElementByDevName } from 'builder_platform_interaction/storeUtils';
import {
    flowWithGetRecordUsingSObject,
    flowWithGetRecordUsingSObjectCollection,
    flowWithGetRecordUsingFields
} from 'mock/flows/flowWithGetRecord';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { FLOW_AUTOMATIC_OUTPUT_HANDLING } from 'builder_platform_interaction/processTypeLib';
import {
    LIGHTNING_COMPONENTS_SELECTORS,
    INTERACTION_COMPONENTS_SELECTORS,
    deepQuerySelector,
    blurEvent,
    textInputEvent
} from 'builder_platform_interaction/builderTestUtils';
import { FLOW_PROCESS_TYPE } from 'builder_platform_interaction/flowMetadata';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { apexTypesForFlow } from 'serverData/GetApexTypes/apexTypesForFlow.json';
import { setApexClasses } from 'builder_platform_interaction/apexTypeLib';
import {
    SELECTORS,
    getResourceGroupedCombobox,
    getResourceCombobox,
    newFilterItem,
    getRadioGroups,
    getEntityResourcePicker,
    getFieldToFerovExpressionBuilders
} from './cludEditorTestUtils';
import { getGroupedComboboxItemBy } from '../groupedComboboxTestUtils';
import { getBaseExpressionBuilder } from '../expressionBuilderTestUtils';
import { expectCanBeTraversed, expectCannotBeTraversed, expectCannotBeSelected } from '../comboboxTestUtils';

const getRecordSobjectAndQueryFieldElement = recordLookupEditor => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_SOBJECT_AND_QUERY_FIELDS_COMPONENT);
};

const getSObjectOrSObjectCollectionPicker = recordLookupEditor => {
    return getRecordSobjectAndQueryFieldElement(recordLookupEditor).shadowRoot.querySelector(
        SELECTORS.SOBJECT_OR_SOBJECT_COLLECTION_PICKER
    );
};

const getSobjectAndFieldsElement = recordLookupEditor => {
    return getRecordSobjectAndQueryFieldElement(recordLookupEditor).shadowRoot.querySelector(
        SELECTORS.RECORD_QUERY_FIELDS_COMPONENT
    );
};

const getRecordStoreOption = recordLookupEditor => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_STORE_OPTION);
};

const getRecordFilter = recordLookupEditor => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_FILTER);
};

const getRecordSort = recordLookupEditor => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_SORT);
};

const getInputOutputAssignments = recordLookupEditor => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_INPUT_OUTPUT_ASSIGNMENTS);
};

const getAllRecordFieldPickerRows = recordStoreFieldsComponent => {
    return recordStoreFieldsComponent.shadowRoot.querySelectorAll(SELECTORS.RECORD_FIELD_PICKER_ROW);
};

const getEntityResourcePickerComboboxElement = entityResourcePicker => {
    return deepQuerySelector(entityResourcePicker, [
        INTERACTION_COMPONENTS_SELECTORS.BASE_RESOURCE_PICKER,
        INTERACTION_COMPONENTS_SELECTORS.COMBOBOX,
        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_GROUPED_COMBOBOX
    ]);
};

const getRecordObjectAndQueryFieldResourceGroupedCombobox = editor => {
    return getResourceGroupedCombobox(getRecordSobjectAndQueryFieldElement(editor));
};

const createComponentForTest = (
    node,
    mode = EditElementEvent.EVENT_NAME,
    flowOutputHandling = FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED
) => {
    const el = createElement('builder_platform_interaction-record-lookup-editor', { is: RecordLookupEditor });
    node.outputReferenceIndex = { value: 'guid', error: null };
    node.objectIndex = { value: 'guid', error: null };
    // Assign needs to be in this order as "mode" is using the flowOutputHandling
    Object.assign(el, { node, flowOutputHandling, mode });
    document.body.appendChild(el);
    return el;
};

describe('Record Lookup Editor', () => {
    let recordLookupNode, store;
    beforeAll(async () => {
        store = await setupStateForProcessType(FLOW_PROCESS_TYPE.FLOW);
    });
    afterAll(() => {
        resetState();
    });
    describe('name and dev name', () => {
        let recordLookupElement, newLabel, newDevName;
        beforeAll(() => {
            translateFlowToUIAndDispatch(flowWithGetRecordUsingSObject, store);
        });
        afterAll(() => {
            store.dispatch({ type: 'INIT' });
        });
        beforeEach(() => {
            const element = getElementByDevName('Get_Record_Using_SObject');
            recordLookupNode = getElementForPropertyEditor(element);
            recordLookupElement = createComponentForTest(recordLookupNode, AddElementEvent.EVENT_NAME);
        });
        it('do not change devName if it already exists after the user modifies the name', () => {
            newLabel = 'new label';
            const labelInput = getLabelDescriptionLabelElement(recordLookupElement);
            changeInputValue(labelInput, newLabel);
            return resolveRenderCycles(() => {
                expect(recordLookupElement.node.label.value).toBe(newLabel);
                expect(recordLookupElement.node.name.value).toBe('Get_Record_Using_SObject');
            });
        });
        it('modify the dev name', () => {
            newDevName = 'newName';
            const devNameInput = getLabelDescriptionNameElement(recordLookupElement);
            changeInputValue(devNameInput, newDevName);
            return resolveRenderCycles(() => {
                expect(recordLookupElement.node.name.value).toBe(newDevName);
            });
        });
        it('display error if name is cleared', () => {
            newLabel = '';
            const labelInput = getLabelDescriptionLabelElement(recordLookupElement);
            changeInputValue(labelInput, newLabel);
            return resolveRenderCycles(() => {
                expect(recordLookupElement.node.label.error).toBe(
                    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK
                );
            });
        });
        it('display error if devName is cleared', () => {
            newDevName = '';
            const devNameInput = getLabelDescriptionNameElement(recordLookupElement);
            changeInputValue(devNameInput, newDevName);
            return resolveRenderCycles(() => {
                expect(recordLookupElement.node.name.error).toBe(
                    FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK
                );
            });
        });
    });
    describe('Add new element', () => {
        let recordLookupElement;
        beforeEach(() => {
            recordLookupNode = getElementForPropertyEditor({
                locationX: 10,
                locationY: 10,
                elementType: ELEMENT_TYPE.RECORD_LOOKUP
            });
            recordLookupElement = createComponentForTest(recordLookupNode, AddElementEvent.EVENT_NAME);
        });
        it('entity picker should be empty', () => {
            const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
            return resolveRenderCycles(() => {
                expect(entityResourcePicker.value.displayText).toBeUndefined();
            });
        });
    });
    describe('Existing element', () => {
        describe('Working with sObject', () => {
            let recordLookupElement;
            beforeAll(() => {
                translateFlowToUIAndDispatch(flowWithGetRecordUsingSObject, store);
            });
            afterAll(() => {
                store.dispatch({ type: 'INIT' });
            });
            beforeEach(() => {
                const element = getElementByDevName('Get_Record_Using_SObject');
                recordLookupNode = getElementForPropertyEditor(element);
                recordLookupElement = createComponentForTest(recordLookupNode);
            });
            it('Selected entity is correctly displayed ', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                expect(entityResourcePicker.value.displayText).toBe(recordLookupElement.node.object.value);
            });
            it('Selected sObject is correctly displayed ', () => {
                const sObJectPicker = getSObjectOrSObjectCollectionPicker(recordLookupElement);
                expect(sObJectPicker.value).toBe(recordLookupElement.node.outputReference.value);
            });
            it('remove selected entity should hide filter, sort, store option and query fields', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                changeComboboxValue(comboboxElement, '');
                return resolveRenderCycles(() => {
                    expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).toBeNull();
                    expect(getRecordStoreOption(recordLookupElement)).toBeNull();
                    expect(getRecordFilter(recordLookupElement)).toBeNull();
                    expect(getRecordSort(recordLookupElement)).toBeNull();
                    expect(recordLookupElement.node.object.error).toBe(
                        FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK
                    );
                });
            });
            it('Enter an invalid value in the entity resource picker should not display other element but should display an error', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                changeComboboxValue(comboboxElement, 'invalidValue');
                return resolveRenderCycles(() => {
                    expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).toBeNull();
                    expect(getRecordStoreOption(recordLookupElement)).toBeNull();
                    expect(getRecordFilter(recordLookupElement)).toBeNull();
                    expect(getRecordSort(recordLookupElement)).toBeNull();
                    expect(recordLookupElement.node.object.error).toBe(FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.GENERIC);
                });
            });
            it('Enter an valid value in the entity resource picker should not display an error', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                changeComboboxValue(comboboxElement, 'Case');
                return resolveRenderCycles(() => {
                    expect(recordLookupElement.node.object.error).toBeNull();
                    expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).not.toBeNull();
                    expect(getRecordStoreOption(recordLookupElement)).not.toBeNull();
                    expect(getRecordFilter(recordLookupElement)).not.toBeNull();
                    expect(getRecordSort(recordLookupElement)).not.toBeNull();
                });
            });
            it('Queried fields should be correctly displayed', () => {
                const queryFieldElement = getSobjectAndFieldsElement(recordLookupElement);
                const recordFieldPickerRow = getAllRecordFieldPickerRows(queryFieldElement);
                expect(recordFieldPickerRow).toHaveLength(2);
                expect(recordFieldPickerRow[0].value).toBe('Id');
                expect(recordFieldPickerRow[1].value).toBe('BillingCity');
            });
            describe('Filter', () => {
                let recordFilter;
                beforeEach(() => {
                    recordFilter = getChildComponent(recordLookupElement, SELECTORS.RECORD_FILTER);
                });
                it('should be displayed', () => {
                    expect(recordFilter).not.toBeNull();
                });
                it('number of filters', () => {
                    expect(recordFilter.filterItems).toHaveLength(1);
                });
                it('LHS/Operator/LHS values', () => {
                    expect(recordFilter.filterItems[0]).toMatchObject(
                        newFilterItem('Account.BillingCity', 'EqualTo', 'San Francisco', 'String')
                    );
                });
            });
            it('sortField and SortOrder should be correctly displayed', () => {
                const recordSortElement = getRecordSort(recordLookupElement);
                return resolveRenderCycles(() => {
                    expect(recordSortElement.sortOrder).toBe('Asc');
                    expect(recordSortElement.selectedField).toBe('AnnualRevenue');
                });
            });
            it('record store option should have "Only the first record" and "Together in a record variable" selected', () => {
                const recordStoreElement = getRecordStoreOption(recordLookupElement);
                return resolveRenderCycles(() => {
                    expect(recordStoreElement.numberOfRecordsToStore).toBe('firstRecord');
                    expect(recordStoreElement.wayToStoreFields).toBe('sObjectVariable');
                    expect(recordStoreElement.assignNullValuesIfNoRecordsFound).toBe(false);
                });
            });
            it('SObject Or SObject Collection Picker contains "New Resource"', () => {
                const rhsGroupedCombobox = getRecordObjectAndQueryFieldResourceGroupedCombobox(recordLookupElement);
                return resolveRenderCycles(() => {
                    expect(
                        getGroupedComboboxItemBy(
                            rhsGroupedCombobox,
                            'text',
                            'FlowBuilderExpressionUtils.newResourceLabel'
                        )
                    ).toBeDefined();
                });
            });
        });
        describe('Working with sObject Collection', () => {
            let recordLookupElement;
            beforeAll(() => {
                translateFlowToUIAndDispatch(flowWithGetRecordUsingSObjectCollection, store);
            });
            afterAll(() => {
                store.dispatch({ type: 'INIT' });
            });
            beforeEach(() => {
                const element = getElementByDevName('Get_Record_Using_SObject_Collection');
                recordLookupNode = getElementForPropertyEditor(element);
                recordLookupElement = createComponentForTest(recordLookupNode);
            });
            it('record store option should have "All records" selected and the second radio group element should be hidden', () => {
                const recordStoreElement = getRecordStoreOption(recordLookupElement);
                const radioGroupElements = getRadioGroups(recordStoreElement);
                return resolveRenderCycles(() => {
                    expect(recordStoreElement.numberOfRecordsToStore).toBe('allRecords');
                    expect(recordStoreElement.assignNullValuesIfNoRecordsFound).toBe(true);
                    expect(radioGroupElements).toHaveLength(1);
                });
            });
            it('The variable vAccountCollection should be displayed', () => {
                const sObjectOrSObjectCollectionPickerElement = getSObjectOrSObjectCollectionPicker(
                    recordLookupElement
                );
                return resolveRenderCycles(() => {
                    expect(sObjectOrSObjectCollectionPickerElement.value).toBe(
                        recordLookupElement.node.outputReference.value
                    );
                });
            });
            it('SObject Or SObject Collection Picker contains "New Resource"', () => {
                const rhsGroupedCombobox = getRecordObjectAndQueryFieldResourceGroupedCombobox(recordLookupElement);
                return resolveRenderCycles(() => {
                    expect(
                        getGroupedComboboxItemBy(
                            rhsGroupedCombobox,
                            'text',
                            'FlowBuilderExpressionUtils.newResourceLabel'
                        )
                    ).toBeDefined();
                });
            });
        });
        describe('Working with fields', () => {
            let recordLookupElement;
            beforeAll(() => {
                translateFlowToUIAndDispatch(flowWithGetRecordUsingFields, store);
            });
            afterAll(() => {
                store.dispatch({ type: 'INIT' });
            });
            beforeEach(() => {
                const element = getElementByDevName('Get_Record_Using_Fields');
                recordLookupNode = getElementForPropertyEditor(element);
                recordLookupElement = createComponentForTest(recordLookupNode);
            });
            it('record store option should have "Only the first record" and "In separate variables" selected and the second radio group should be visible', () => {
                const recordStoreElement = getRecordStoreOption(recordLookupElement);
                const radioGroupElements = getRadioGroups(recordStoreElement);
                return resolveRenderCycles(() => {
                    expect(recordStoreElement.numberOfRecordsToStore).toBe('firstRecord');
                    expect(recordStoreElement.wayToStoreFields).toBe('separateVariables');
                    expect(recordStoreElement.assignNullValuesIfNoRecordsFound).toBe(false);
                    expect(radioGroupElements).toHaveLength(2);
                });
            });
            it('Selected entity is correctly displayed ', () => {
                return resolveRenderCycles(() => {
                    const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                    expect(entityResourcePicker.value.displayText).toBe(recordLookupElement.node.object.value);
                });
            });
            it('remove selected entity should hide filter, sort, store option and query fields', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                comboboxElement.dispatchEvent(textInputEvent(''));
                comboboxElement.dispatchEvent(blurEvent);
                return resolveRenderCycles(() => {
                    expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).toBeNull();
                    expect(getRecordStoreOption(recordLookupElement)).toBeNull();
                    expect(getRecordFilter(recordLookupElement)).toBeNull();
                    expect(getRecordSort(recordLookupElement)).toBeNull();
                    expect(recordLookupElement.node.object.error).toBe(
                        FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.CANNOT_BE_BLANK
                    );
                });
            });
            it('Enter an invalid value in the entity resource picker should not display other element but should display an error', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                comboboxElement.dispatchEvent(textInputEvent('invalidValue'));
                comboboxElement.dispatchEvent(blurEvent);
                return resolveRenderCycles(() => {
                    expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).toBeNull();
                    expect(getRecordStoreOption(recordLookupElement)).toBeNull();
                    expect(getRecordFilter(recordLookupElement)).toBeNull();
                    expect(getRecordSort(recordLookupElement)).toBeNull();
                    expect(recordLookupElement.node.object.error).toBe(FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.GENERIC);
                });
            });
            it('Enter an valid value in the entity resource picker should not display an error', () => {
                const entityResourcePicker = getEntityResourcePicker(recordLookupElement);
                const comboboxElement = getEntityResourcePickerComboboxElement(entityResourcePicker);
                comboboxElement.dispatchEvent(textInputEvent('Case'));
                comboboxElement.dispatchEvent(blurEvent);
                return resolveRenderCycles(() => {
                    return resolveRenderCycles(() => {
                        expect(recordLookupElement.node.object.error).toBeNull();
                        expect(getRecordSobjectAndQueryFieldElement(recordLookupElement)).not.toBeNull();
                        expect(getRecordStoreOption(recordLookupElement)).not.toBeNull();
                        expect(getRecordFilter(recordLookupElement)).not.toBeNull();
                        expect(getRecordSort(recordLookupElement)).not.toBeNull();
                    });
                });
            });
            it('sortField and SortOrder should be correctly displayed', () => {
                const recordSortElement = getRecordSort(recordLookupElement);
                return resolveRenderCycles(() => {
                    expect(recordSortElement.sortOrder).toBe('Asc');
                    expect(recordSortElement.selectedField).toBe('AnnualRevenue');
                });
            });
            describe('Filter', () => {
                let recordFilter, fieldToFerovExpressionBuilders;
                beforeEach(() => {
                    recordFilter = getRecordFilter(recordLookupElement);
                    fieldToFerovExpressionBuilders = getFieldToFerovExpressionBuilders(recordFilter);
                });
                it('should be displayed', () => {
                    expect(recordFilter).not.toBeNull();
                });
                it('number of filters', () => {
                    expect(fieldToFerovExpressionBuilders).toHaveLength(1);
                });
                it('LHS/Operator/LHS values', () => {
                    expect(recordFilter.filterItems[0]).toMatchObject({
                        leftHandSide: {
                            value: 'Account.BillingCity'
                        },
                        operator: {
                            value: 'EndsWith'
                        },
                        rightHandSide: {
                            value: 'Francisco'
                        },
                        rightHandSideDataType: {
                            value: 'String'
                        }
                    });
                });
                it('operators available for the first filter', () => {
                    const baseExpressionBuilderComponent = getBaseExpressionBuilder(fieldToFerovExpressionBuilders[0]);
                    const operatorsComboboxComponent = getChildComponent(
                        baseExpressionBuilderComponent,
                        LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_COMBOBOX
                    );
                    return resolveRenderCycles(() => {
                        expect(operatorsComboboxComponent.options).toHaveLength(6);
                        expect(operatorsComboboxComponent.options).toEqual(
                            expect.arrayContaining([
                                expect.objectContaining({ value: 'EqualTo' }),
                                expect.objectContaining({
                                    value: 'NotEqualTo'
                                }),
                                expect.objectContaining({
                                    value: 'StartsWith'
                                }),
                                expect.objectContaining({ value: 'Contains' }),
                                expect.objectContaining({ value: 'EndsWith' }),
                                expect.objectContaining({ value: 'IsNull' })
                            ])
                        );
                    });
                });
            });
            describe('Output Assignments', () => {
                let outputAssignments, fieldToFerovExpressionBuilder;
                beforeEach(() => {
                    outputAssignments = getInputOutputAssignments(recordLookupElement);
                    fieldToFerovExpressionBuilder = getFieldToFerovExpressionBuilders(outputAssignments);
                });
                it('should be displayed', () => {
                    expect(outputAssignments).not.toBeNull();
                });
                it('number of', () => {
                    expect(outputAssignments.inputOutputAssignmentsItems).toHaveLength(2);
                });
                it('LHS/Operator/LHS values', () => {
                    const baseExpressionBuilder = getBaseExpressionBuilder(fieldToFerovExpressionBuilder[0]);
                    expect(baseExpressionBuilder.lhsValue).toMatchObject({
                        value: 'Account.BillingCity'
                    });
                    expect(baseExpressionBuilder.operatorValue).toBeUndefined();
                    expect(baseExpressionBuilder.rhsValue).toMatchObject({
                        category: 'FLOWBUILDERELEMENTCONFIG.VARIABLEPLURALLABEL',
                        dataType: 'String',
                        displayText: '{!vBillingCity}',
                        hasNext: false,
                        iconName: 'utility:text',
                        iconSize: 'xx-small',
                        subtype: null,
                        subText: 'FlowBuilderDataTypes.textDataTypeLabel',
                        text: 'vBillingCity',
                        type: 'option-card'
                    });
                });
            });
        });
        describe('assign variables', () => {
            beforeAll(async () => {
                translateFlowToUIAndDispatch(flowWithAllElements, store);
                setApexClasses(apexTypesForFlow);
            });
            afterAll(() => {
                resetState();
            });
            let recordLookupElement, sObjectOrSObjectCollectionPicker;
            const expectCanBeTraversedInResourcePicker = async textValues => {
                await expectCanBeTraversed(sObjectOrSObjectCollectionPicker, 'text', textValues);
            };
            const expectCannotBeTraversedInResourcePicker = async textValues => {
                await expectCannotBeTraversed(sObjectOrSObjectCollectionPicker, 'text', textValues);
            };
            const expectCannotBeSelectedInResourcePicker = async textValues => {
                await expectCannotBeSelected(sObjectOrSObjectCollectionPicker, 'text', textValues);
            };
            beforeEach(() => {
                const element = getElementByDevName('lookupRecordOutputReference');
                recordLookupNode = getElementForPropertyEditor(element);
                recordLookupElement = createComponentForTest(
                    recordLookupNode,
                    EditElementEvent.EVENT_NAME,
                    FLOW_AUTOMATIC_OUTPUT_HANDLING.SUPPORTED
                );
                sObjectOrSObjectCollectionPicker = getRecordObjectAndQueryFieldResourceGroupedCombobox(
                    recordLookupElement
                );
            });
            describe('Sobject or Sobject collection picker', () => {
                it('shows account variables up, no traversal', async () => {
                    await expectCannotBeTraversedInResourcePicker(['accountSObjectVariable']);
                });
                it('shows variable containing account up, only single account field', async () => {
                    await expectCanBeTraversedInResourcePicker(['apexComplexTypeVariable']);
                    await expectCannotBeSelectedInResourcePicker(['apexComplexTypeVariable', 'acctListField']);
                    await expectCannotBeTraversedInResourcePicker(['apexComplexTypeVariable', 'acct']);
                    await expectCannotBeSelectedInResourcePicker(['apexComplexTypeVariable', 'name']);
                });
                it('does not show non account variable up', async () => {
                    await expectCannotBeSelectedInResourcePicker(['caseSObjectVariable']);
                });
                it('does not show account collection variable up', async () => {
                    await expectCannotBeSelectedInResourcePicker(['accountSObjectCollectionVariable']);
                });
                it('should contain elements that contains apex that contains sobject and shows only single sobject fields up. Sobject fields should not be traversable', async () => {
                    await expectCanBeTraversedInResourcePicker(['apexComplexTypeTwoVariable']);
                    await expectCanBeTraversedInResourcePicker(['apexComplexTypeTwoVariable', 'testOne']);
                    await expectCannotBeTraversedInResourcePicker(['apexComplexTypeTwoVariable', 'testOne', 'acct']);
                    await expectCannotBeSelectedInResourcePicker(['apexComplexTypeTwoVariable', 'listOfTestOne']);
                    await expectCannotBeSelectedInResourcePicker(['apexComplexTypeTwoVariable', 'str']);
                });
                it('throws validation error when manually entering a non account variable', () => {
                    changeComboboxValue(sObjectOrSObjectCollectionPicker, '{!caseSObjectVariable}');

                    expect(
                        getResourceCombobox(getRecordSobjectAndQueryFieldElement(recordLookupElement)).errorMessage
                    ).toBe(FLOW_BUILDER_VALIDATION_ERROR_MESSAGES.GENERIC);
                });
            });
        });
    });
});
