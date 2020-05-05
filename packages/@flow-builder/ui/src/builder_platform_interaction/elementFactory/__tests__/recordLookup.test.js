import {
    createRecordLookup,
    createDuplicateRecordLookup,
    createRecordLookupMetadataObject,
    createQueriedField
} from '../recordLookup';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { deepFindMatchers } from 'builder_platform_interaction/builderTestUtils';
import { ELEMENT_TYPE, CONNECTOR_TYPE, CONDITION_LOGIC } from 'builder_platform_interaction/flowMetadata';
import { DUPLICATE_ELEMENT_XY_OFFSET } from '../base/baseElement';
import {
    FLOW_AUTOMATIC_OUTPUT_HANDLING,
    getProcessTypeAutomaticOutPutHandlingSupport
} from 'builder_platform_interaction/processTypeLib';
import { Store } from 'builder_platform_interaction/storeLib';
import { flowWithAllElementsUIModel } from 'mock/storeData';

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/processTypeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/processTypeLib');
    return Object.assign({}, actual, {
        getProcessTypeAutomaticOutPutHandlingSupport: jest.fn()
    });
});

expect.extend(deepFindMatchers);

const MOCK_GUID = 'mockGuid';

const recordLookupSObjectStore = () => ({
    assignNullValuesIfNoRecordsFound: false,
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    config: { isSelected: false },
    connectorCount: 0,
    dataType: 'Boolean',
    description: '',
    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            leftHandSide: 'Account.BillingCity',
            operator: 'EqualTo',
            rightHandSide: 'vCity',
            rightHandSideDataType: 'reference',
            rowIndex: MOCK_GUID
        }
    ],
    guid: MOCK_GUID,
    isCanvasElement: true,
    label: 'lookupSObject',
    locationX: 304,
    locationY: 629,
    maxConnections: 2,
    name: 'lookupSObject',
    object: 'Account',
    outputReference: 'vSobjectAccount',
    queriedFields: [{ field: 'BillingCountry', rowIndex: MOCK_GUID }],
    sortField: '',
    sortOrder: 'NotSorted'
});

const recordLookupSObjectCollectionStore = () => ({
    assignNullValuesIfNoRecordsFound: false,
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    config: { isSelected: false },
    connectorCount: 0,
    dataType: 'Boolean',
    description: '',
    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
    filterLogic: CONDITION_LOGIC.NO_CONDITIONS,
    filters: [],
    guid: MOCK_GUID,
    isCanvasElement: true,
    label: 'lookupSObject',
    locationX: 304,
    locationY: 629,
    maxConnections: 2,
    name: 'lookupSObject',
    getFirstRecordOnly: false,
    object: 'Account',
    outputReference: 'vSobjectAccountCollection',
    queriedFields: [
        { field: 'BillingCountry', rowIndex: MOCK_GUID },
        { field: '', rowIndex: MOCK_GUID }
    ],
    sortField: '',
    sortOrder: 'NotSorted'
});

const recordLookupSObjectMetadata = () => ({
    assignNullValuesIfNoRecordsFound: false,
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            field: 'BillingCity',
            operator: 'EqualTo',
            value: { elementReference: 'vCity' }
        }
    ],
    label: 'lookupSObject',
    locationX: 304,
    locationY: 629,
    name: 'lookupSObject',
    object: 'Account',
    outputReference: 'vSobjectAccount',
    queriedFields: ['BillingCountry']
});

const recordLookupFieldsMetadata = () => ({
    assignNullValuesIfNoRecordsFound: false,
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            field: 'BillingCity',
            operator: 'EqualTo',
            value: { elementReference: 'vCity' }
        }
    ],
    label: 'lookup with Fields',
    locationX: 431,
    locationY: 345,
    name: 'lookup_with_fields',
    object: 'Account',
    outputAssignments: [
        {
            field: 'BillingCountry',
            assignToReference: 'myCountry'
        }
    ],
    queriedFields: []
});

const recordLookupFieldsStore = () => ({
    assignNullValuesIfNoRecordsFound: false,
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    config: { isSelected: false },
    connectorCount: 0,
    dataType: 'Boolean',
    description: '',
    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            leftHandSide: 'Account.BillingCity',
            operator: 'EqualTo',
            rightHandSide: 'vCity',
            rightHandSideDataType: 'reference',
            rowIndex: MOCK_GUID
        }
    ],
    guid: MOCK_GUID,
    isCanvasElement: true,
    label: 'lookup with Fields',
    locationX: 431,
    locationY: 345,
    maxConnections: 2,
    name: 'lookup_with_fields',
    getFirstRecordOnly: true,
    object: 'Account',
    outputAssignments: [
        {
            leftHandSide: 'Account.BillingCountry',
            rightHandSide: 'myCountry'
        }
    ],
    queriedFields: [],
    sortField: '',
    sortOrder: 'NotSorted'
});

const recordLookupAutomaticMetadata = (getFirstRecordOnly = true) => ({
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            field: 'BillingCity',
            operator: 'EqualTo',
            value: { elementReference: 'vCity' }
        }
    ],
    label: 'lookup automatic',
    locationX: 431,
    locationY: 345,
    name: 'lookup_automatic',
    object: 'Account',
    queriedFields: ['BillingCountry'],
    storeOutputAutomatically: true,
    getFirstRecordOnly
});

const recordLookupAutomaticProcessTypeChangedOnSaveMetadata = () => ({
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            field: 'BillingCity',
            operator: 'EqualTo',
            value: { elementReference: 'vCity' }
        }
    ],
    label: 'lookup automatic',
    locationX: 431,
    locationY: 345,
    name: 'lookup_automatic',
    object: 'Account',
    queriedFields: ['BillingCountry'],
    outputReference: null,
    getFirstRecordOnly: true
});

const recordLookupAutomaticStore = (getFirstRecordOnly = true) => ({
    assignNullValuesIfNoRecordsFound: false,
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    config: { isSelected: false },
    connectorCount: 0,
    dataType: 'SObject',
    subtype: 'Account',
    isCollection: !getFirstRecordOnly,
    description: '',
    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
    filterLogic: CONDITION_LOGIC.AND,
    filters: [
        {
            leftHandSide: 'Account.BillingCity',
            operator: 'EqualTo',
            rightHandSide: 'vCity',
            rightHandSideDataType: 'reference',
            rowIndex: MOCK_GUID
        }
    ],
    guid: MOCK_GUID,
    isCanvasElement: true,
    label: 'lookup automatic',
    locationX: 431,
    locationY: 345,
    maxConnections: 2,
    name: 'lookup_automatic',
    getFirstRecordOnly,
    object: 'Account',
    queriedFields: [
        { field: 'BillingCountry', rowIndex: MOCK_GUID },
        { field: '', rowIndex: MOCK_GUID }
    ],
    sortField: '',
    sortOrder: 'NotSorted',
    storeOutputAutomatically: true
});

const outputAssignmentField = {
    field: 'title',
    assignToReference: 'vTitle'
};

const outputAssignmentFieldValue = {
    field: 'description',
    assignToReference: 'vDescription'
};

const uiModelOutputAssignmentFieldValue = {
    leftHandSide: 'Account.description',
    rightHandSide: 'vDescription'
};

const uiModelOutputAssignmentFieldEmptyValue = {
    leftHandSide: '',
    rightHandSide: ''
};

const uiModelOutputAssignmentField = {
    leftHandSide: 'Account.title',
    rightHandSide: 'vTitle'
};

describe('recordLookup', () => {
    const storeLib = require('builder_platform_interaction/storeLib');
    storeLib.generateGuid = jest.fn().mockReturnValue(MOCK_GUID);
    beforeAll(() => {
        Store.setMockState(flowWithAllElementsUIModel);
    });
    afterAll(() => {
        Store.resetStore();
    });
    describe('createRecordLookup function', () => {
        let recordLookup;
        describe('when empty recordLookup is created', () => {
            it('has dataType of boolean', () => {
                recordLookup = createRecordLookup();
                expect(recordLookup.dataType).toEqual(FLOW_DATA_TYPE.BOOLEAN.value);
            });
        });

        describe('when flow recordLookup is passed', () => {
            beforeEach(() => {
                recordLookup = createRecordLookup(recordLookupSObjectMetadata());
            });
            it('has dataType of boolean', () => {
                expect(recordLookup.dataType).toEqual(FLOW_DATA_TYPE.BOOLEAN.value);
            });
            it('has no common mutable object with record lookup metadata passed as parameter', () => {
                expect(recordLookup).toHaveNoCommonMutableObjectWith(recordLookupSObjectMetadata());
            });
        });

        describe('when store recordLookup is passed', () => {
            beforeEach(() => {
                recordLookup = createRecordLookup(recordLookupSObjectStore());
            });
            it('has dataType of boolean', () => {
                expect(recordLookup.dataType).toEqual(FLOW_DATA_TYPE.BOOLEAN.value);
            });
            it('has no common mutable object with ecord lookup from store passed as parameter', () => {
                expect(recordLookup).toHaveNoCommonMutableObjectWith(recordLookupSObjectStore());
            });
            it('has the "how many records" property set from the passed object', () => {
                const valueFromCreation = createRecordLookup(recordLookupSObjectCollectionStore()).getFirstRecordOnly;
                expect(valueFromCreation).toEqual(false);
            });
        });
    });
    describe('recordLookup new element from left panel', () => {
        it('returns a new record lookup object when no argument is passed; numberRecordsToStore should be set to FIRSt_RECORD by default', () => {
            const uiModelResult = {
                name: '',
                description: '',
                elementType: ELEMENT_TYPE.RECORD_LOOKUP,
                getFirstRecordOnly: true
            };
            const actualResult = createRecordLookup();
            expect(actualResult).toMatchObject(uiModelResult);
        });
    });

    describe('createDuplicateRecordLookup function', () => {
        const originalRecordLookup = {
            guid: 'originalGuid',
            name: 'originalName',
            label: 'label',
            elementType: ELEMENT_TYPE.RECORD_LOOKUP,
            locationX: 100,
            locationY: 100,
            config: {
                isSelectd: true,
                isHighlighted: false
            },
            connectorCount: 1,
            maxConnections: 2,
            availableConnections: [
                {
                    type: CONNECTOR_TYPE.FAULT
                }
            ]
        };
        const { duplicatedElement } = createDuplicateRecordLookup(
            originalRecordLookup,
            'duplicatedGuid',
            'duplicatedName'
        );

        it('has the new guid', () => {
            expect(duplicatedElement.guid).toEqual('duplicatedGuid');
        });
        it('has the new name', () => {
            expect(duplicatedElement.name).toEqual('duplicatedName');
        });
        it('has the updated locationX', () => {
            expect(duplicatedElement.locationX).toEqual(originalRecordLookup.locationX + DUPLICATE_ELEMENT_XY_OFFSET);
        });
        it('has the updated locationY', () => {
            expect(duplicatedElement.locationY).toEqual(originalRecordLookup.locationY + DUPLICATE_ELEMENT_XY_OFFSET);
        });
        it('has isSelected set to true', () => {
            expect(duplicatedElement.config.isSelected).toBeTruthy();
        });
        it('has isHighlighted set to false', () => {
            expect(duplicatedElement.config.isHighlighted).toBeFalsy();
        });
        it('has connectorCount set to 0', () => {
            expect(duplicatedElement.connectorCount).toEqual(0);
        });
        it('has maxConnections set to 2', () => {
            expect(duplicatedElement.maxConnections).toEqual(2);
        });
        it('has the right elementType', () => {
            expect(duplicatedElement.elementType).toEqual(ELEMENT_TYPE.RECORD_LOOKUP);
        });
        it('has default availableConnections', () => {
            expect(duplicatedElement.availableConnections).toEqual([
                {
                    type: CONNECTOR_TYPE.REGULAR
                },
                {
                    type: CONNECTOR_TYPE.FAULT
                }
            ]);
        });
    });

    describe('recordLookup flow metadata => UI model', () => {
        describe('recordLookup function using sObject', () => {
            it('returns expected new record lookup object', () => {
                const recordLookupMetadata = recordLookupSObjectMetadata();
                const actualResult = createRecordLookup(recordLookupMetadata);
                expect(actualResult).toMatchObject(recordLookupSObjectStore());
            });
            it('has no common mutable object with record lookup metadata passed as parameter', () => {
                const recordLookupMetadata = recordLookupSObjectMetadata();
                const actualResult = createRecordLookup(recordLookupMetadata);
                expect(actualResult).toHaveNoCommonMutableObjectWith(recordLookupMetadata);
            });
            it('set default "queriedFields" with Id if none passed', () => {
                const actualResult = createRecordLookup({ ...recordLookupSObjectMetadata(), queriedFields: [] });
                expect(actualResult.queriedFields).toEqual([
                    {
                        field: 'Id',
                        rowIndex: 'mockGuid'
                    },
                    {
                        field: '',
                        rowIndex: 'mockGuid'
                    }
                ]);
            });
        });
        describe('recordLookup function using Fields', () => {
            let recordLookupUsingFields;
            let uiModelRecordLookupWithFields;
            beforeEach(() => {
                recordLookupUsingFields = recordLookupFieldsMetadata();
                uiModelRecordLookupWithFields = recordLookupFieldsStore();
            });
            it('outputAssignments with value should return the expression (RHS/LHS)', () => {
                recordLookupUsingFields.outputAssignments = [outputAssignmentFieldValue];
                const actualResult = createRecordLookup(recordLookupUsingFields);
                uiModelRecordLookupWithFields.outputAssignments = [uiModelOutputAssignmentFieldValue];
                expect(actualResult).toMatchObject(uiModelRecordLookupWithFields);
            });
            it('outputAssignments with multiple values should return the expression (RHS/LHS)', () => {
                recordLookupUsingFields.outputAssignments = [outputAssignmentFieldValue, outputAssignmentField];
                const actualResult = createRecordLookup(recordLookupUsingFields);
                uiModelRecordLookupWithFields.outputAssignments = [
                    uiModelOutputAssignmentFieldValue,
                    uiModelOutputAssignmentField
                ];
                expect(actualResult).toMatchObject(uiModelRecordLookupWithFields);
            });
            it('has no common mutable object with record lookup with fields metadata passed as parameter', () => {
                const actualResult = createRecordLookup(recordLookupUsingFields);
                expect(actualResult).toHaveNoCommonMutableObjectWith(recordLookupUsingFields);
            });
            it('should have an "outputReference" undefined', () => {
                const actualResult = createRecordLookup(recordLookupUsingFields);
                // this is not the same thing than expect(actualResult).toHaveProperty('outputReference', undefined); !
                expect(actualResult).toHaveProperty('outputReference');
                expect(actualResult.outputReference).toBeUndefined();
            });
            it('"queriedFields" should be an empty array', () => {
                const actualResult = createRecordLookup(recordLookupUsingFields);
                expect(actualResult.queriedFields).toHaveLength(0);
            });
        });
        describe('recordLookup function using automatic output handling', () => {
            let recordLookupAutomatic;
            beforeEach(() => {
                recordLookupAutomatic = recordLookupAutomaticMetadata();
            });
            it('has no common mutable object with record lookup with fields metadata passed as parameter', () => {
                const actualResult = createRecordLookup(recordLookupAutomatic);
                expect(actualResult).toHaveNoCommonMutableObjectWith(recordLookupAutomatic);
            });
            it('should have an "outputReference" undefined', () => {
                const actualResult = createRecordLookup(recordLookupAutomatic);
                // this is not the same thing than expect(actualResult).toHaveProperty('outputReference', undefined); !
                expect(actualResult).toHaveProperty('outputReference');
                expect(actualResult.outputReference).toBeUndefined();
            });
            it('should have a sobject datatype', () => {
                const actualResult = createRecordLookup(recordLookupAutomatic);
                expect(actualResult.dataType).toBe(FLOW_DATA_TYPE.SOBJECT.value);
                expect(actualResult.isCollection).toBeFalsy();
                expect(actualResult.subtype).toBe('Account');
            });
            it('"storeOutputAutomatically" should be true', () => {
                const actualResult = createRecordLookup(recordLookupAutomatic);
                expect(actualResult.storeOutputAutomatically).toBe(true);
            });
        });
    });
    describe('recordLookup UI model => flow metadata', () => {
        it('should throw error if no "recordLookup" passed', () => {
            expect(() => createRecordLookupMetadataObject(null)).toThrowError('recordLookup is not defined');
        });
        it('resets "filters" if "filterLogic" equals No Conditions ', () => {
            const actualResult = createRecordLookupMetadataObject({
                ...recordLookupSObjectStore(),
                filterLogic: CONDITION_LOGIC.NO_CONDITIONS
            });
            expect(actualResult.filters).toHaveLength(0);
        });
        describe('recordLookup function using sObject', () => {
            it('record lookup using sObject', () => {
                const actualResult = createRecordLookupMetadataObject(recordLookupSObjectStore());
                expect(actualResult).toMatchObject(recordLookupSObjectMetadata());
            });
            it('has no common mutable object with record create store passed as parameter', () => {
                const recordCreateSObjectStore = recordLookupSObjectStore();
                const actualResult = createRecordLookupMetadataObject(recordCreateSObjectStore);
                expect(actualResult).toHaveNoCommonMutableObjectWith(recordCreateSObjectStore);
            });
        });
        describe('recordLookup function using Fields', () => {
            let recordLookupUsingFields;
            let uiModelRecordLookupWithFields;
            beforeEach(() => {
                recordLookupUsingFields = recordLookupFieldsMetadata();
                uiModelRecordLookupWithFields = recordLookupFieldsStore();
            });
            it('outputAssignments with value', () => {
                uiModelRecordLookupWithFields.outputAssignments = [uiModelOutputAssignmentFieldValue];
                recordLookupUsingFields.outputAssignments = [outputAssignmentFieldValue];
                const actualResult = createRecordLookupMetadataObject(uiModelRecordLookupWithFields);
                expect(actualResult).toMatchObject(recordLookupUsingFields);
            });
            it('outputAssignments with multiple values', () => {
                uiModelRecordLookupWithFields.outputAssignments = [
                    uiModelOutputAssignmentFieldValue,
                    uiModelOutputAssignmentField
                ];
                recordLookupUsingFields.outputAssignments = [outputAssignmentFieldValue, outputAssignmentField];
                const actualResult = createRecordLookupMetadataObject(uiModelRecordLookupWithFields);
                expect(actualResult).toMatchObject(recordLookupUsingFields);
            });
            it('has no common mutable object with record lookup store passed as parameter', () => {
                const actualResult = createRecordLookupMetadataObject(uiModelRecordLookupWithFields);
                expect(actualResult).toHaveNoCommonMutableObjectWith(uiModelRecordLookupWithFields);
            });
            it('outputAssignments with empty values', () => {
                uiModelRecordLookupWithFields.outputAssignments = [uiModelOutputAssignmentFieldEmptyValue];
                recordLookupUsingFields.outputAssignments = [];
                const actualResult = createRecordLookupMetadataObject(uiModelRecordLookupWithFields);
                expect(actualResult).toMatchObject(recordLookupUsingFields);
            });
        });
        describe('recordLookup function with automatic handled output', () => {
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(FLOW_AUTOMATIC_OUTPUT_HANDLING.SUPPORTED);
            });
            it('record lookup using automatic handled output', () => {
                const actualResult = createRecordLookupMetadataObject(recordLookupAutomaticStore());
                expect(actualResult).toMatchObject(recordLookupAutomaticMetadata());
            });
            it('record lookup using automatic handled output with collection', () => {
                const actualResult = createRecordLookupMetadataObject(recordLookupAutomaticStore(false));
                expect(actualResult).toMatchObject(recordLookupAutomaticMetadata(false));
            });
            it('has no common mutable object with record create store passed as parameter', () => {
                const recordLookupStore = recordLookupAutomaticStore();
                const actualResult = createRecordLookupMetadataObject(recordLookupStore);
                expect(actualResult).toHaveNoCommonMutableObjectWith(recordLookupStore);
            });
        });
        describe('recordLookup function with automatic handled output and saved with a process type that does not support automatic output handling', () => {
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    FLOW_AUTOMATIC_OUTPUT_HANDLING.UNSUPPORTED
                );
            });
            it('Should not have storeOutputAutomatically', () => {
                const actualResult = createRecordLookupMetadataObject(recordLookupAutomaticStore());
                expect(actualResult).toMatchObject(recordLookupAutomaticProcessTypeChangedOnSaveMetadata());
                expect(actualResult.storeOutputAutomatically).toBe(undefined);
            });
        });
    });
    describe('createQueriedField', () => {
        test('when passing a string parameter not empty', () => {
            const actualResult = createQueriedField('id');
            expect(actualResult).toMatchObject({
                field: 'id',
                rowIndex: MOCK_GUID
            });
        });
        test('when passing a string parameter (empty string)', () => {
            const actualResult = createQueriedField('');
            expect(actualResult).toMatchObject({
                field: '',
                rowIndex: MOCK_GUID
            });
        });
        test('when passing an object parameter with a field property that has an empty string value', () => {
            const actualResult = createQueriedField({
                field: '',
                rowIndex: MOCK_GUID
            });
            expect(actualResult).toMatchObject({
                field: '',
                rowIndex: MOCK_GUID
            });
        });
        test('when passing an object parameter with a field property that has not an empty string value', () => {
            const actualResult = createQueriedField({
                field: 'id',
                rowIndex: MOCK_GUID
            });
            expect(actualResult).toMatchObject({
                field: 'id',
                rowIndex: MOCK_GUID
            });
        });
    });
});
