// @ts-nocheck
import { createElement } from 'lwc';
import RecordLookupEditor from '../recordLookupEditor';
import { SORT_ORDER, NUMBER_RECORDS_TO_STORE, WAY_TO_STORE_FIELDS } from 'builder_platform_interaction/recordEditorLib';
import {
    AddElementEvent,
    EditElementEvent,
    RecordStoreOptionChangedEvent,
    AddRecordFilterEvent,
    DeleteRecordFilterEvent,
    UpdateRecordFilterEvent,
    AddRecordFieldAssignmentEvent,
    DeleteRecordFieldAssignmentEvent,
    UpdateRecordFieldAssignmentEvent,
    SObjectReferenceChangedEvent,
    PropertyChangedEvent
} from 'builder_platform_interaction/events';
import { getAccountWithFields, getAccountWithSObject } from 'mock/storeDataContactrequest';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import { INTERACTION_COMPONENTS_SELECTORS, ticks } from 'builder_platform_interaction/builderTestUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';

jest.mock('builder_platform_interaction/fieldToFerovExpressionBuilder', () =>
    require('builder_platform_interaction_mocks/fieldToFerovExpressionBuilder')
);
jest.mock('builder_platform_interaction/ferovResourcePicker', () =>
    require('builder_platform_interaction_mocks/ferovResourcePicker')
);
jest.mock('builder_platform_interaction/fieldPicker', () => require('builder_platform_interaction_mocks/fieldPicker'));
jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const MOCK_GUID = '515fa22c-c633-48fe-a97e-4fd3c272cc24';
const PROCESS_TYPE_CONTACT_REQUEST_FLOW = 'ContactRequestFlow';

function createComponentForTest(node, mode = EditElementEvent.EVENT_NAME) {
    const el = createElement('builder_platform_interaction-record-lookup-editor', { is: RecordLookupEditor });
    Object.assign(el, {
        node,
        PROCESS_TYPE_CONTACT_REQUEST_FLOW,
        mode
    });
    document.body.appendChild(el);
    return el;
}

const defaultValueItem = { item: { value: 'guid1', displayText: 'var 1' } };
const eventDetailObjectWithError = (displayText, error) => ({
    item: null,
    displayText,
    error
});
const getComboboxStateChangedEvent = (detail = defaultValueItem) => {
    return new CustomEvent('comboboxstatechanged', {
        detail
    });
};

jest.mock('builder_platform_interaction/processTypeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/processTypeLib');
    const FLOW_AUTOMATIC_OUTPUT_HANDLING = actual.FLOW_AUTOMATIC_OUTPUT_HANDLING;
    return {
        FLOW_AUTOMATIC_OUTPUT_HANDLING,
        getProcessTypeAutomaticOutPutHandlingSupport: jest
            .fn()
            .mockReturnValue(FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED)
    };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    const actual = jest.requireActual('builder_platform_interaction/expressionUtils');
    return {
        getResourceByUniqueIdentifier: jest.fn(),
        getEntitiesMenuData: actual.getEntitiesMenuData,
        EXPRESSION_PROPERTY_TYPE: actual.EXPRESSION_PROPERTY_TYPE,
        getChildrenItemsPromise: actual.getChildrenItemsPromise,
        filterMatches: actual.filterMatches
    };
});

const SELECTORS = {
    ...INTERACTION_COMPONENTS_SELECTORS
};

const filterElement = {
    leftHandSide: { value: 'Account.Id', error: null },
    operator: { value: 'EqualTo', error: null },
    rightHandSide: { value: '{!myFormula1}', error: null },
    rightHandSideDataType: { value: 'reference', error: null },
    rightHandSideGuid: { value: 'FORMULA_8', error: null }
};

const defaultNewRecordLookupElement = () => ({
    description: { value: '', error: null },
    elementType: 'RecordQuery',
    guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
    isCanvasElement: true,
    label: { value: '', error: null },
    name: { value: '', error: null },
    outputReferenceIndex: { value: MOCK_GUID, error: null },
    sortField: { value: '', error: null },
    sortOrder: SORT_ORDER.NOT_SORTED,
    assignNullValuesIfNoRecordsFound: false,
    outputAssignments: [],
    queriedFields: [],
    object: { value: '', error: null },
    objectIndex: { value: 'guid', error: null },
    filterLogic: { value: CONDITION_LOGIC.AND, error: null },
    filters: [
        {
            rowIndex: 'a0e8a02d-60fb-4481-8165-10a01fe7031c',
            leftHandSide: {
                value: '',
                error: null
            },
            rightHandSide: {
                value: '',
                error: null
            },
            rightHandSideDataType: {
                value: '',
                error: null
            },
            operator: {
                value: '',
                error: null
            }
        }
    ],
    getFirstRecordOnly: true
});

const outputAssignmentElement = {
    leftHandSide: { value: 'Account.Address', error: null },
    rightHandSide: { value: 'myAddress', error: null },
    rowIndex: '724cafc2-7744-4e46-8eaa-f2df29539d2e'
};

const getRecordStoreOption = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_STORE_OPTION);
};

const getEntityResourcePicker = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.ENTITY_RESOURCE_PICKER);
};

const getRecordFilter = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_FILTER);
};

const getRecordSort = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_SORT);
};

const getRecordSobjectAndQueryFields = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_SOBJECT_AND_QUERY_FIELDS_COMPONENT);
};

const getsObjectOrSObjectCollectionPicker = (recordSobjectAndQueryFields) => {
    return recordSobjectAndQueryFields.shadowRoot.querySelector(SELECTORS.SOBJECT_OR_SOBJECT_COLLECTION_PICKER);
};

const getInputOutputAssignments = (recordLookupEditor) => {
    return recordLookupEditor.shadowRoot.querySelector(SELECTORS.RECORD_INPUT_OUTPUT_ASSIGNMENTS);
};

describe('record-lookup-editor', () => {
    let recordLookupEditor, entityResourcePicker, recordLookupNode;
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    describe('Process type NOT supporting the automatic mode', () => {
        describe('Adding element', () => {
            beforeEach(() => {
                recordLookupEditor = createComponentForTest(
                    defaultNewRecordLookupElement(),
                    AddElementEvent.EVENT_NAME
                );
            });
            test('check UI - child components displayed or not (snapshot)', () => {
                expect(recordLookupEditor).toMatchSnapshot();
            });
            describe('After entity (object) is selected', () => {
                beforeEach(() => {
                    entityResourcePicker = getEntityResourcePicker(recordLookupEditor);
                    entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
                });
                test('check UI - child components displayed or not (snapshot)', () => {
                    expect(recordLookupEditor).toMatchSnapshot();
                });
                it(`entity picker (object) value should be "${defaultValueItem.item.value}"`, () => {
                    expect(getEntityResourcePicker(recordLookupEditor).value).toBe(defaultValueItem.item.value);
                });
            });
        });
        describe('Edit element (Sobject mode)', () => {
            beforeEach(() => {
                recordLookupNode = getElementForPropertyEditor(getAccountWithSObject);
                recordLookupEditor = createComponentForTest(recordLookupNode, EditElementEvent.EVENT_NAME);
            });
            describe('No actions', () => {
                test('check UI - child components displayed or not (snapshot)', () => {
                    expect(recordLookupEditor).toMatchSnapshot();
                });
                it('entity picker (object) value should be "Account" ', () => {
                    expect(getEntityResourcePicker(recordLookupEditor).value).toBe('Account');
                });
                it('Store options (nuber of records) should be "firstRecord"', () => {
                    expect(getRecordStoreOption(recordLookupEditor).numberOfRecordsToStore).toBe(
                        NUMBER_RECORDS_TO_STORE.FIRST_RECORD
                    );
                });
                it('Store options (Way to store) should be "sObjectVariable"', () => {
                    expect(getRecordStoreOption(recordLookupEditor).wayToStoreFields).toBe(
                        WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE
                    );
                });
                it('assign null if no records found should be "true" ', () => {
                    expect(getRecordStoreOption(recordLookupEditor).assignNullValuesIfNoRecordsFound).toBe(true);
                });
                it('sortOrder should NOT be sorted', () => {
                    expect(getRecordSort(recordLookupEditor).sortOrder).toBe(SORT_ORDER.NOT_SORTED);
                });
                it('record filter logic should be "and" ', () => {
                    expect(getRecordFilter(recordLookupEditor).filterLogic.value).toBe(CONDITION_LOGIC.AND);
                });
            });
            describe('remove "object"', () => {
                beforeEach(() => {
                    entityResourcePicker = getEntityResourcePicker(recordLookupEditor);
                    entityResourcePicker.dispatchEvent(
                        getComboboxStateChangedEvent(eventDetailObjectWithError('', 'A value is required.'))
                    );
                });
                test('check UI - child components displayed or not (snapshot)', () => {
                    expect(recordLookupEditor).toMatchSnapshot();
                });
            });
            describe('invalid "object"', () => {
                beforeEach(() => {
                    entityResourcePicker = getEntityResourcePicker(recordLookupEditor);
                    entityResourcePicker.dispatchEvent(
                        getComboboxStateChangedEvent(
                            eventDetailObjectWithError('invalidEntityName', 'Enter a valid value.')
                        )
                    );
                });
                test('check UI - child components displayed or not (snapshot)', () => {
                    expect(recordLookupEditor).toMatchSnapshot();
                });
                it('"object" picker value should be set to empty string', () => {
                    expect(entityResourcePicker.value).toBe('');
                });
            });
            describe('Handle Events', () => {
                it('handles "entityResourcePicker" value changed event', async () => {
                    entityResourcePicker = getEntityResourcePicker(recordLookupEditor);
                    entityResourcePicker.dispatchEvent(getComboboxStateChangedEvent());
                    await ticks(1);
                    expect(entityResourcePicker.value).toBe('guid1');
                });
                it('handle "sortOrder" Changed should changed the record lookup sortOrder value', async () => {
                    const event = new CustomEvent('change', {
                        detail: {
                            sortOrder: SORT_ORDER.ASC,
                            fieldApiName: ''
                        }
                    });
                    getRecordSort(recordLookupEditor).dispatchEvent(event);
                    await ticks(1);
                    const recordSort = getRecordSort(recordLookupEditor);
                    expect(recordSort.sortOrder).toBe(SORT_ORDER.ASC);
                    expect(recordLookupEditor.node.sortOrder).toBe(SORT_ORDER.ASC);
                });
                it('change number record to store to All records, sObject picker should changed', async () => {
                    const event = new RecordStoreOptionChangedEvent(false, '', false);
                    getRecordStoreOption(recordLookupEditor).dispatchEvent(event);
                    await ticks(1);
                    const recordSobjectAndQueryFields = getRecordSobjectAndQueryFields(recordLookupEditor);
                    const sObjectOrSObjectCollectionPicker = getsObjectOrSObjectCollectionPicker(
                        recordSobjectAndQueryFields
                    );
                    expect(sObjectOrSObjectCollectionPicker.placeholder).toBe(
                        'FlowBuilderRecordEditor.searchRecordCollections'
                    );
                    expect(sObjectOrSObjectCollectionPicker.value).toBe('');
                });
                it('handle UpdateRecordFilterEvent should update the filter element', async () => {
                    const updateRecordFilterEvent = new UpdateRecordFilterEvent(0, filterElement, null);
                    getRecordFilter(recordLookupEditor).dispatchEvent(updateRecordFilterEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.filters[0]).toMatchObject(filterElement);
                });
                it('handle AddRecordFilterEvent should add a filter element', async () => {
                    const addRecordFilterEvent = new AddRecordFilterEvent(); // This is using the numerical rowIndex not the property rowIndex
                    getRecordFilter(recordLookupEditor).dispatchEvent(addRecordFilterEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.filters).toHaveLength(2);
                });
                it('handle record filter logic Change event', async () => {
                    const propertyChangeEvent = new PropertyChangedEvent('filterLogic', CONDITION_LOGIC.OR);
                    getRecordFilter(recordLookupEditor).dispatchEvent(propertyChangeEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.filterLogic.value).toBe(CONDITION_LOGIC.OR);
                });
                it('reselect same "outputReference" should not reset query fields', async () => {
                    const recordSobjectAndQueryFields = getRecordSobjectAndQueryFields(recordLookupEditor);
                    const sObjectOrSObjectCollectionPicker = getsObjectOrSObjectCollectionPicker(
                        recordSobjectAndQueryFields
                    );
                    sObjectOrSObjectCollectionPicker.dispatchEvent(
                        new SObjectReferenceChangedEvent(recordLookupEditor.node.outputReference.value)
                    );
                    await ticks(1);
                    expect(recordSobjectAndQueryFields.queriedFields[1].field.value).toBe('BillingAddress');
                });
                describe('Filters', () => {
                    it('record logic criteria should be and ', () => {
                        const recordFilter = getRecordFilter(recordLookupEditor);
                        expect(recordFilter.filterLogic).toMatchObject({ error: null, value: 'and' });
                    });
                    it('record filter fire DeleteRecordFilterEvent', async () => {
                        const deleteRecordFilterEvent = new DeleteRecordFilterEvent(0); // This is using the numerical rowIndex not the property rowIndex
                        getRecordFilter(recordLookupEditor).dispatchEvent(deleteRecordFilterEvent);
                        await ticks(1);
                        expect(recordLookupEditor.node.filters).toHaveLength(0);
                    });
                });
            });
        });
        describe('Edit element (Fields mode)', () => {
            beforeEach(() => {
                recordLookupNode = getElementForPropertyEditor(getAccountWithFields);
                recordLookupEditor = createComponentForTest(recordLookupNode, EditElementEvent.EVENT_NAME);
            });
            describe('no actions', () => {
                test('check UI - child components displayed or not (snapshot)', () => {
                    expect(recordLookupEditor).toMatchSnapshot();
                });
                it('entity picker (object) value should be "Account" ', () => {
                    expect(getEntityResourcePicker(recordLookupEditor).value).toBe('Account');
                });
                it('Store options (number of records to store) value should be "firstRecord"', () => {
                    expect(getRecordStoreOption(recordLookupEditor).numberOfRecordsToStore).toBe(
                        NUMBER_RECORDS_TO_STORE.FIRST_RECORD
                    );
                });
                it('Store options (way to store) should be "separateVariables"', () => {
                    expect(getRecordStoreOption(recordLookupEditor).wayToStoreFields).toBe(
                        WAY_TO_STORE_FIELDS.SEPARATE_VARIABLES
                    );
                });
                it('Store options (assign null if records not found) should be "true"', () => {
                    expect(getRecordStoreOption(recordLookupEditor).assignNullValuesIfNoRecordsFound).toBe(true);
                });
                it('sortOrder should be ASC sorted', () => {
                    expect(getRecordSort(recordLookupEditor).sortOrder).toBe(SORT_ORDER.ASC);
                });
                it('record filterLogic should be "and" ', () => {
                    expect(getRecordFilter(recordLookupEditor).filterLogic.value).toBe(CONDITION_LOGIC.AND);
                });
            });
            describe('Handle Events', () => {
                it('change number record to store to All records, sObject picker should changed', async () => {
                    const event = new RecordStoreOptionChangedEvent(false);
                    getRecordStoreOption(recordLookupEditor).dispatchEvent(event);
                    await ticks(1);
                    const recordSobjectAndQueryFields = getRecordSobjectAndQueryFields(recordLookupEditor);
                    const sObjectOrSObjectCollectionPicker = getsObjectOrSObjectCollectionPicker(
                        recordSobjectAndQueryFields
                    );
                    expect(sObjectOrSObjectCollectionPicker.value).toBe('');
                });
                it('handle AddRecordFieldAssignmentEvent should add an input Assignments element', async () => {
                    const addRecordFieldAssignmentEvent = new AddRecordFieldAssignmentEvent();
                    getInputOutputAssignments(recordLookupEditor).dispatchEvent(addRecordFieldAssignmentEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.outputAssignments).toHaveLength(3);
                });
                it('handle UpdateRecordFieldAssignmentEvent should update the input Assignments element', async () => {
                    const updateRecordFieldAssignmentEvent = new UpdateRecordFieldAssignmentEvent(
                        0,
                        outputAssignmentElement,
                        null
                    );
                    getInputOutputAssignments(recordLookupEditor).dispatchEvent(updateRecordFieldAssignmentEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.outputAssignments[0]).toMatchObject(outputAssignmentElement);
                });
                it('handle DeleteRecordFieldAssignmentEvent should delete the input assignment', async () => {
                    const deleteRecordFieldAssignmentEvent = new DeleteRecordFieldAssignmentEvent(0); // This is using the numerical rowIndex not the property rowIndex
                    getInputOutputAssignments(recordLookupEditor).dispatchEvent(deleteRecordFieldAssignmentEvent);
                    await ticks(1);
                    expect(recordLookupEditor.node.outputAssignments).toHaveLength(1);
                });
            });
        });
    });
});
