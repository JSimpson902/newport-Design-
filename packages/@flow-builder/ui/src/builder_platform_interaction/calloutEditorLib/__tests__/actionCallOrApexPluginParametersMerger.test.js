import {
    mergeInputOutputParameters,
    MERGE_WARNING_TYPE,
    getParameterDataType
} from '../calloutEditorLib';
import { chatterPostActionParameters as mockActionParameters } from 'serverData/GetInvocableActionParameters/chatterPostActionParameters.json';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';

jest.mock('builder_platform_interaction/storeLib', () =>
    require('builder_platform_interaction_mocks/storeLib')
);

const mockGuid = 'mockGuid';

const nodeInputParameters = [
    {
        rowIndex: '58d8bd82-1977-4cf3-a5a7-f629347fa0e8',
        name: {
            value: 'subjectNameOrId',
            error: null
        },
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    },
    {
        rowIndex: '84b6d19d-718f-452d-9803-fe97a263f76c',
        name: {
            value: 'text',
            error: null
        },
        value: {
            value: 'This is a message',
            error: null
        },
        valueDataType: 'String'
    }
];

const nodeOutputParameters = [
    {
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        name: {
            value: 'feedItemId',
            error: null
        },
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    }
];

const duplicatedOutputParameters = [
    {
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        name: {
            value: 'feedItemId',
            error: null
        },
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    },
    {
        rowIndex: 'abd34jhb-5858-474c-8f87-0fc38a5c7ebf',
        name: {
            value: 'feedItemId',
            error: null
        },
        value: {
            value: 'dh78nd45-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    }
];

const mergedInputs = [
    {
        dataType: 'String',
        isRequired: false,
        label: 'Community ID',
        maxOccurs: 1,
        name: 'communityId',
        rowIndex: mockGuid,
        subtype: null
    },
    {
        dataType: 'String',
        isRequired: true,
        label: 'Target Name or ID',
        maxOccurs: 1,
        name: 'subjectNameOrId',
        rowIndex: '58d8bd82-1977-4cf3-a5a7-f629347fa0e8',
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference',
        subtype: null
    },
    {
        dataType: 'String',
        isRequired: true,
        label: 'Message',
        maxOccurs: 1,
        name: 'text',
        rowIndex: '84b6d19d-718f-452d-9803-fe97a263f76c',
        value: {
            value: 'This is a message',
            error: null
        },
        valueDataType: 'String',
        subtype: null
    },
    {
        dataType: 'Picklist',
        isRequired: false,
        label: 'Target Type',
        maxOccurs: 1,
        name: 'type',
        rowIndex: 'mockGuid',
        subtype: null
    },
    {
        dataType: 'Picklist',
        isRequired: false,
        label: 'Visibility',
        maxOccurs: 1,
        name: 'visibility',
        rowIndex: 'mockGuid',
        subtype: null
    }
];

const mergedOutputs = [
    {
        dataType: 'String',
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        name: 'feedItemId',
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        subtype: null,
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    }
];

const duplicatedMergedOutputs = [
    {
        dataType: 'String',
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        name: 'feedItemId',
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        subtype: null,
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference',
        warnings: ['duplicate']
    },
    {
        dataType: 'String',
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        name: 'feedItemId',
        rowIndex: 'abd34jhb-5858-474c-8f87-0fc38a5c7ebf',
        subtype: null,
        value: {
            value: 'dh78nd45-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference',
        warnings: ['duplicate']
    }
];

const notAvailableParameter = [
    {
        rowIndex: '58d8bd82-1977-4cf3-a5a7-f629347fa0e8',
        name: {
            value: 'notAvailableParameter',
            error: null
        },
        value: {
            value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
            error: null
        },
        valueDataType: 'reference'
    }
];
const getParameterItem = (parameterItems, name) =>
    parameterItems.find(parameterItem => parameterItem.name === name);

describe('ActionCall/ApexPlugin parameters merge', () => {
    const storeLib = require('builder_platform_interaction/storeLib');
    storeLib.generateGuid = jest.fn().mockReturnValue(mockGuid);
    describe('When there is no warning', () => {
        it('merges input and output parameters', () => {
            const mergedParameters = mergeInputOutputParameters(
                mockActionParameters,
                nodeInputParameters,
                nodeOutputParameters
            );
            expect(mergedParameters.inputs).toEqual(mergedInputs);
            expect(mergedParameters.outputs).toEqual(mergedOutputs);
        });
    });
    describe('When there is duplicate parameter', () => {
        let mergedParameters;
        beforeEach(() => {
            mergedParameters = mergeInputOutputParameters(
                mockActionParameters,
                [],
                duplicatedOutputParameters
            );
        });
        it('merges duplicated output parameters', () => {
            expect(mergedParameters.outputs).toEqual(duplicatedMergedOutputs);
        });
        it('generates DUPLICATE warning', () => {
            expect(mergedParameters.outputs[0].warnings).toEqual([
                MERGE_WARNING_TYPE.DUPLICATE
            ]);
            expect(mergedParameters.outputs[1].warnings).toEqual([
                MERGE_WARNING_TYPE.DUPLICATE
            ]);
        });
    });
    describe('When there is no parameter in an action or apex plugin', () => {
        let notAvailabelParameterItem;
        beforeEach(() => {
            const mergedParameters = mergeInputOutputParameters(
                mockActionParameters,
                notAvailableParameter,
                []
            );
            notAvailabelParameterItem = getParameterItem(
                mergedParameters.inputs,
                'notAvailableParameter'
            );
        });
        it('should have notAvailableParameter item', () => {
            expect(notAvailabelParameterItem).toBeDefined();
        });
        it('generates NOT_AVAILABLE warning', () => {
            expect(notAvailabelParameterItem.warnings).toEqual([
                MERGE_WARNING_TYPE.NOT_AVAILABLE
            ]);
        });
    });
});
describe('getParameterDataType', () => {
    test.each`
        parameterRawDataType            | parameterApexClass | parameterProcessedDataType
        ${''}                           | ${'apexClass1'}    | ${FLOW_DATA_TYPE.APEX.value}
        ${undefined}                    | ${'apexClass1'}    | ${FLOW_DATA_TYPE.APEX.value}
        ${null}                         | ${'apexClass1'}    | ${FLOW_DATA_TYPE.APEX.value}
        ${''}                           | ${''}              | ${null}
        ${undefined}                    | ${undefined}       | ${null}
        ${null}                         | ${null}            | ${null}
        ${FLOW_DATA_TYPE.SOBJECT.value} | ${'apexClass1'}    | ${FLOW_DATA_TYPE.SOBJECT.value}
        ${FLOW_DATA_TYPE.SOBJECT.value} | ${''}              | ${FLOW_DATA_TYPE.SOBJECT.value}
        ${FLOW_DATA_TYPE.SOBJECT.value} | ${undefined}       | ${FLOW_DATA_TYPE.SOBJECT.value}
        ${FLOW_DATA_TYPE.SOBJECT.value} | ${null}            | ${FLOW_DATA_TYPE.SOBJECT.value}
    `(
        'Parameters: dataType "$parameterRawDataType" and apexClass "$parameterApexClass" should return "$parameterProcessedDataType"',
        ({
            parameterRawDataType,
            parameterApexClass,
            parameterProcessedDataType
        }) => {
            const actualDataType = getParameterDataType(
                parameterRawDataType,
                parameterApexClass
            );
            expect(actualDataType).toEqual(parameterProcessedDataType);
        }
    );
});
