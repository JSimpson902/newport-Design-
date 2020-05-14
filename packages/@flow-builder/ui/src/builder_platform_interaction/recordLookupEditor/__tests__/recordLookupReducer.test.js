// @ts-nocheck
import { recordLookupReducer } from '../recordLookupReducer';
import {
    AddRecordFilterEvent,
    UpdateRecordFilterEvent,
    DeleteRecordFilterEvent,
    AddRecordLookupFieldEvent,
    UpdateRecordLookupFieldEvent,
    DeleteRecordLookupFieldEvent,
    AddRecordFieldAssignmentEvent,
    DeleteRecordFieldAssignmentEvent,
    UpdateRecordFieldAssignmentEvent,
    RecordStoreOptionChangedEvent,
    PropertyChangedEvent,
    UseAdvancedOptionsSelectionChangedEvent
} from 'builder_platform_interaction/events';
import { EXPRESSION_PROPERTY_TYPE } from 'builder_platform_interaction/expressionUtils';
import * as store from 'mock/storeData';
import { SORT_ORDER, WAY_TO_STORE_FIELDS } from 'builder_platform_interaction/recordEditorLib';
import { getElementForPropertyEditor } from 'builder_platform_interaction/propertyEditorFactory';
import {
    lookupRecordAutomaticOutputWithFields,
    lookupRecordOutputReference,
    getAccountSeparateFieldsWithFilters,
    getAccountsAutomaticWithFieldsAndFilters
} from 'mock/storeData';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';
import { CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

const recordLookupUsingFieldsStateEmptyOutPutAssignments = () => ({
    description: { value: '', error: null },
    elementType: 'RecordQuery',
    guid: '724cafc2-7744-4e46-8eaa-f2df29539d1e',
    isCanvasElement: true,
    label: { value: 'testRecord', error: null },
    name: { value: 'testRecord', error: null },
    sortField: { value: 'Name', error: null },
    sortOrder: SORT_ORDER.ASC,
    assignNullValuesIfNoRecordsFound: false,
    queriedFields: [
        {
            field: { value: 'Id', error: null },
            rowIndex: '73cb7e19-9f98-4b59-9fdd-a276f216ddcf'
        },
        {
            field: { value: 'BillingAddress', error: null },
            rowIndex: '74cb7e19-9f98-4b59-9fdd-a276f216ddcf'
        }
    ],
    object: { value: 'Account', error: '' },
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            leftHandSide: {
                value: 'Account.BillingAddress',
                error: null
            },
            operator: { value: 'EqualTo', error: null },
            rightHandSide: { value: 'my address', error: null },
            rightHandSideDataType: { value: 'String', error: null },
            rowIndex: '72cb7e19-9f98-4b59-9fdd-a276f216ddcf'
        }
    ],
    outputAssignments: [
        {
            leftHandSide: { value: '', error: 'A value is required.' },
            rightHandSide: { value: '', error: 'A value is required.' },
            rowIndex: '71cb7e19-9f98-4b59-9fdd-a276f216ddcf'
        },
        {
            leftHandSide: { value: '', error: 'A value is required.' },
            rightHandSide: { value: '', error: 'A value is required.' },
            rowIndex: '71cb7e19-9f98-4b59-9fdd-a276f216ddcf'
        }
    ],
    getFirstRecordOnly: true
});

describe('record-lookup-reducer', () => {
    let originalState, newState;
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    describe('State with sObject (single record)', () => {
        beforeEach(() => {
            originalState = getElementForPropertyEditor(lookupRecordOutputReference);
        });
        describe('fetch error', () => {
            it('fetch the error from the sobject variable picker change event instead of rerunning validation', () => {
                const event = {
                    type: PropertyChangedEvent.EVENT_NAME,
                    detail: {
                        propertyName: 'outputReference',
                        value: 'invalidObject',
                        error: 'errorFromChildComponent'
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState).toBeDefined();
                expect(newState.outputReference.error).toBe('errorFromChildComponent');
                expect(newState).not.toBe(originalState);
            });
            it('fetch the error from the entity resource picker change event instead of rerunning validation', () => {
                const event = {
                    type: PropertyChangedEvent.EVENT_NAME,
                    detail: {
                        propertyName: 'object',
                        value: 'invalidObject',
                        error: 'errorFromChildComponent'
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState).toBeDefined();
                expect(newState).not.toBe(originalState);
                expect(newState.object.error).toBe('errorFromChildComponent');
            });

            it('fetch the error from the sort field picker change event instead of rerunning validation', () => {
                const event = {
                    type: PropertyChangedEvent.EVENT_NAME,
                    detail: {
                        propertyName: 'sortField',
                        value: 'invalidObject',
                        error: 'errorFromChildComponent'
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState).toBeDefined();
                expect(newState.sortField.error).toBe('errorFromChildComponent');
                expect(newState).not.toBe(originalState);
            });
        });

        describe('handle list item events', () => {
            describe('QueriedFields', () => {
                it('add a field', () => {
                    const event = {
                        type: AddRecordLookupFieldEvent.EVENT_NAME
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.queriedFields).toHaveLength(3);
                    expect(newState).not.toBe(originalState);
                });
                it('delete a field', () => {
                    const event = {
                        type: DeleteRecordLookupFieldEvent.EVENT_NAME,
                        detail: {
                            index: 0
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.queriedFields).toHaveLength(1);
                    expect(newState).not.toBe(originalState);
                });
                it('update a field', () => {
                    const event = {
                        type: UpdateRecordLookupFieldEvent.EVENT_NAME,
                        detail: {
                            index: 1,
                            value: 'Description'
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('Description');
                    expect(newState).not.toBe(originalState);
                });
                it('delete a field and reset the blank error of the last field', () => {
                    const event = {
                        type: DeleteRecordLookupFieldEvent.EVENT_NAME,
                        detail: {
                            index: 1
                        }
                    };
                    originalState.queriedFields.push({
                        field: { value: '', error: 'Can not be blank' },
                        rowIndex: 'RECORDLOOKUPFIELD_3'
                    });
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('');
                    expect(newState.queriedFields[1].field.error).toBeNull();
                });
            });
            describe('Filters', () => {
                it('add a filter item', () => {
                    const event = {
                        type: AddRecordFilterEvent.EVENT_NAME
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.filters).toHaveLength(2);
                    expect(newState).not.toBe(originalState);
                });
                it('delete a filter item', () => {
                    const event = {
                        type: DeleteRecordFilterEvent.EVENT_NAME,
                        detail: {
                            index: 0
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.filters).toHaveLength(0);
                    expect(newState).not.toBe(originalState);
                });

                it('update the left hand side of a filter item', () => {
                    const event = {
                        type: UpdateRecordFilterEvent.EVENT_NAME,
                        detail: {
                            index: 0,
                            value: {
                                [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                                    value: 'Account.Description',
                                    error: null
                                }
                            }
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.filters).toHaveLength(1);
                    expect(newState.filters[0].leftHandSide.value).toBe('Account.Description');
                    expect(newState).not.toBe(originalState);
                });
            });
        });

        describe('handle property changed event', () => {
            describe('update entity name', () => {
                beforeAll(() => {
                    const event = {
                        type: PropertyChangedEvent.EVENT_NAME,
                        detail: {
                            propertyName: 'object',
                            value: 'Account History'
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                });
                it('should update "entity name"', () => {
                    expect(newState.object.value).toBe('Account History');
                    expect(newState).not.toBe(originalState);
                });
                it('should reset "outputReference"', () => {
                    expect(newState.outputReference.value).toBe('');
                });
                it('should reset "sortOrder"', () => {
                    expect(newState.sortOrder).toBe(SORT_ORDER.NOT_SORTED);
                });
                it('should reset "sortField"', () => {
                    expect(newState.sortField.value).toBe('');
                });
                it('should reset "filterLogic"', () => {
                    expect(newState.filterLogic.value).toBe(CONDITION_LOGIC.AND);
                });
                it('should reset "filters"', () => {
                    expect(newState.filters).toHaveLength(1);
                    expect(newState.filters[0].leftHandSide.value).toBe('');
                });
                it('should reset "queriedFields"', () => {
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('');
                });
                it('should reset "getFirstRecordOnly"', () => {
                    expect(newState.getFirstRecordOnly).toBe(true);
                });
                it('should reset "wayToStoreFields"', () => {
                    expect(newState.wayToStoreFields).toBe(WAY_TO_STORE_FIELDS.SOBJECT_VARIABLE);
                });
                it('should reset "assignNullValuesIfNoRecordsFound"', () => {
                    expect(newState.assignNullValuesIfNoRecordsFound).toBe(false);
                });
            });
            describe('update sobject variable', () => {
                beforeAll(() => {
                    const event = {
                        type: PropertyChangedEvent.EVENT_NAME,
                        detail: {
                            propertyName: 'outputReference',
                            value: 'NewOutputReference'
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                });
                it('should update "outputReference" (sobject variable name)', () => {
                    expect(newState.outputReference.value).toBe('NewOutputReference');
                    expect(newState).not.toBe(originalState);
                });
                it('should reset "queriedFields"', () => {
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('');
                });
                it('with same current value it should NOT reset "queriedFields"', () => {
                    const currentOutputReferenceValue = originalState.outputReference.value;
                    const propChangedEvent = new PropertyChangedEvent(
                        'outputReference',
                        currentOutputReferenceValue,
                        null,
                        null,
                        currentOutputReferenceValue
                    );
                    newState = recordLookupReducer(originalState, propChangedEvent);
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('BillingAddress');
                });
            });
            describe('update getFirstRecordOnly', () => {
                describe('from true to false', () => {
                    beforeAll(() => {
                        const recordStoreOptionChangedEvent = new RecordStoreOptionChangedEvent(false, '', false);
                        newState = recordLookupReducer(originalState, recordStoreOptionChangedEvent);
                    });
                    it('should reset "outputReference"', () => {
                        expect(newState.outputReference.value).toBe('');
                    });
                    it('should NOT reset "sortOrder"', () => {
                        expect(newState.sortOrder.value).toBe(originalState.sortOrder.value);
                    });
                    it('should NOT reset "sortField"', () => {
                        expect(newState.sortField.value).toBe(originalState.sortField.value);
                    });
                    it('should reset "filterLogic"', () => {
                        expect(newState.filterLogic.value).toBe(CONDITION_LOGIC.AND);
                    });
                });
            });
            describe('update wayToStoreFields from sObject to SeparateVariable', () => {
                beforeAll(() => {
                    const recordStoreOptionChangedEvent = new RecordStoreOptionChangedEvent(
                        false,
                        WAY_TO_STORE_FIELDS.SEPARATE_VARIABLES,
                        false
                    );
                    newState = recordLookupReducer(originalState, recordStoreOptionChangedEvent);
                });
                it('should reset inputReference', () => {
                    expect(newState.outputReference.value).toBe('');
                });
                it('should reset queriedFields', () => {
                    expect(newState.queriedFields).toHaveLength(2);
                    expect(newState.queriedFields[1].field.value).toBe('');
                });
            });
            describe('update sortOrder to NotSorted', () => {
                beforeAll(() => {
                    const event = {
                        type: PropertyChangedEvent.EVENT_NAME,
                        detail: {
                            propertyName: 'sortOrder',
                            value: SORT_ORDER.NOT_SORTED
                        }
                    };
                    originalState.sortField.value = 'invalidValue';
                    originalState.sortField.error = 'You have entered an invalid value';
                    newState = recordLookupReducer(originalState, event);
                });
                it('should update sortOrder', () => {
                    expect(newState.sortOrder).toBe(SORT_ORDER.NOT_SORTED);
                    expect(newState).not.toBe(originalState);
                });
                it('should reset sortField error', () => {
                    expect(newState.sortField.value).toBe('invalidValue');
                    expect(newState.sortField.error).toBeNull();
                });
                it('should not reset filters', () => {
                    expect(newState.filters).toHaveLength(1);
                    expect(newState.filters[0].leftHandSide.value).toBe('Account.BillingAddress');
                });
            });
            describe('update filterLogic to "No Conditions"', () => {
                beforeAll(() => {
                    const event = {
                        type: PropertyChangedEvent.EVENT_NAME,
                        detail: {
                            propertyName: 'filterLogic',
                            value: CONDITION_LOGIC.NO_CONDITIONS
                        }
                    };
                    originalState.filters[0].leftHandSide.value = 'invalidValue';
                    originalState.filters[0].leftHandSide.error = 'You have entered an invalid value';
                    newState = recordLookupReducer(originalState, event);
                });
                it('should update filterLogic', () => {
                    expect(newState.filterLogic.value).toBe(CONDITION_LOGIC.NO_CONDITIONS);
                    expect(newState).not.toBe(originalState);
                });
                it('should reset filter errors and value', () => {
                    expect(newState.filters).toHaveLength(1);
                    expect(newState.filters[0].leftHandSide.value).toBe('');
                    expect(newState.filters[0].leftHandSide.error).toBeNull();
                });
            });
        });
    });

    describe('State with Fields', () => {
        beforeEach(() => {
            originalState = getElementForPropertyEditor(getAccountSeparateFieldsWithFilters);
        });
        describe('handle list item events', () => {
            it('add an assignment item', () => {
                const event = {
                    type: AddRecordFieldAssignmentEvent.EVENT_NAME
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState.outputAssignments).toHaveLength(2);
                expect(newState).not.toBe(originalState);
            });
            it('delete an assignment item', () => {
                const event = {
                    type: DeleteRecordFieldAssignmentEvent.EVENT_NAME,
                    detail: {
                        index: 0
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState.outputAssignments).toHaveLength(0);
                expect(newState).not.toBe(originalState);
            });
            it('update the left hand side of an assignment item', () => {
                const event = {
                    type: UpdateRecordFieldAssignmentEvent.EVENT_NAME,
                    detail: {
                        index: 0,
                        value: {
                            [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: {
                                value: 'Account.Description',
                                error: null
                            }
                        }
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState.outputAssignments).toHaveLength(1);
                expect(newState.outputAssignments[0].leftHandSide.value).toBe('Account.Description');
                expect(newState).not.toBe(originalState);
            });
        });
    });

    describe('State with Fields and errors', () => {
        beforeEach(() => {
            originalState = recordLookupUsingFieldsStateEmptyOutPutAssignments();
        });
        describe('handle list item events', () => {
            describe('delete an assignment item', () => {
                it('Should reset the error if only one output assignment left and its value is ""', () => {
                    const event = {
                        type: DeleteRecordFieldAssignmentEvent.EVENT_NAME,
                        detail: {
                            index: 0
                        }
                    };
                    newState = recordLookupReducer(originalState, event);
                    expect(newState.outputAssignments).toHaveLength(1);
                    expect(newState.outputAssignments[0]).toMatchObject({
                        leftHandSide: { value: '', error: null },
                        rightHandSide: { value: '', error: null }
                    });
                });
            });
        });
    });

    describe('State with sObject and errors', () => {
        beforeEach(() => {
            originalState = {
                description: { value: '', error: null },
                elementType: 'RecordQuery',
                guid: '326e1b1a-7235-487f-9b44-38db56af4a45',
                isCanvasElement: true,
                label: { value: 'testRecord', error: null },
                name: { value: 'testRecord', error: null },
                outputReference: {
                    value: store.accountSObjectVariable.guid,
                    error: null
                },
                sortField: { value: 'Name', error: null },
                sortOrder: SORT_ORDER.ASC,
                assignNullValuesIfNoRecordsFound: false,
                outputAssignments: [],
                queriedFields: [
                    {
                        field: { value: 'Id', error: null },
                        rowIndex: '76cb7e19-9f98-4b59-9fdd-a276f216ddcf'
                    },
                    {
                        field: { value: 'BillingAddress', error: null },
                        rowIndex: '77cb7e19-9f98-4b59-9fdd-a276f216ddcf'
                    },
                    {
                        field: {
                            value: 'BillingAddress',
                            error: 'DuplicateValue'
                        },
                        rowIndex: '78cb7e19-9f98-4b59-9fdd-a276f216ddcf'
                    }
                ],
                object: { value: 'Account', error: '' },
                filterLogic: CONDITION_LOGIC.NO_CONDITIONS,
                filters: [{}],
                getFirstRecordOnly: true
            };
        });
        describe('handle list item events', () => {
            it('delete a duplicate field', () => {
                const event = {
                    type: DeleteRecordLookupFieldEvent.EVENT_NAME,
                    detail: {
                        index: 1
                    }
                };
                newState = recordLookupReducer(originalState, event);
                expect(newState.queriedFields).toHaveLength(2);
                expect(newState).not.toBe(originalState);
                expect(newState.queriedFields[1].field.error).toBeNull();
            });
        });
    });

    describe('State in automatic mode (single record)', () => {
        describe('handle property changed event', () => {
            describe('from automatic mode to advanced manual mode', () => {
                beforeAll(() => {
                    originalState = getElementForPropertyEditor(lookupRecordAutomaticOutputWithFields);
                    const changeFromAutomaticToAdvancedModeEvent = {
                        type: UseAdvancedOptionsSelectionChangedEvent.EVENT_NAME,
                        detail: {
                            useAdvancedOptions: true
                        }
                    };
                    newState = recordLookupReducer(originalState, changeFromAutomaticToAdvancedModeEvent);
                });
                it('new state different than original one', () => {
                    expect(newState).not.toBe(originalState);
                });
                it('should reset "outputReference" as a defined hydrated "empty" object', () => {
                    expect(newState.outputReference).toEqual({
                        value: '',
                        error: null
                    });
                });
                it('should set "storeOutputAutomatically" to false', () => {
                    expect(newState.storeOutputAutomatically).toBe(false);
                });
                it('should NOT reset "queriedFields"', () => {
                    expect(newState.queriedFields).toEqual(originalState.queriedFields);
                });
                it('should NOT reset "assignNullValuesIfNoRecordsFound"', () => {
                    expect(newState.assignNullValuesIfNoRecordsFound).toBe(
                        originalState.assignNullValuesIfNoRecordsFound
                    );
                });
                it('should NOT reset "wayToStoreFields"', () => {
                    expect(newState.wayToStoreFields).toBe(originalState.wayToStoreFields);
                });
            });
        });
    });
    describe('State in automatic mode (collection record)', () => {
        describe('handle property changed event', () => {
            describe('from automatic mode to advanced manual mode', () => {
                beforeAll(() => {
                    originalState = getElementForPropertyEditor(getAccountsAutomaticWithFieldsAndFilters);
                    const changeFromAutomaticToAdvancedModeEvent = {
                        type: UseAdvancedOptionsSelectionChangedEvent.EVENT_NAME,
                        detail: {
                            useAdvancedOptions: true
                        }
                    };
                    newState = recordLookupReducer(originalState, changeFromAutomaticToAdvancedModeEvent);
                });
                it('new state different than original one', () => {
                    expect(newState).not.toBe(originalState);
                });
                it('should reset "outputReference" as a defined hydrated "empty" object', () => {
                    expect(newState.outputReference).toEqual({
                        value: '',
                        error: null
                    });
                });
                it('should set "storeOutputAutomatically" to false', () => {
                    expect(newState.storeOutputAutomatically).toBe(false);
                });
                it('should NOT reset "queriedFields"', () => {
                    expect(newState.queriedFields).toEqual(originalState.queriedFields);
                });
                it('should NOT reset "assignNullValuesIfNoRecordsFound"', () => {
                    expect(newState.assignNullValuesIfNoRecordsFound).toBe(
                        originalState.assignNullValuesIfNoRecordsFound
                    );
                });
                it('should NOT reset "wayToStoreFields"', () => {
                    expect(newState.wayToStoreFields).toBe(originalState.wayToStoreFields);
                });
            });
        });
    });
});
