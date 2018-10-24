import { mergeInputOutputParameters, MERGE_WARNING_TYPE } from "../calloutEditorLib";
import { mockActionParameters } from "mock/calloutData";

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
        valueDataType: 'reference',
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
          valueDataType: 'String',
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
        valueDataType: 'reference',
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
        valueDataType: 'reference',
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
        valueDataType: 'reference',
    }
];

const mergedInputs = [
    {
        dataType: 'String',
        isInput: true,
        isRequired: false,
        label: 'Community Id',
        maxOccurs: 1,
        objectType: null,
        name: 'communityId',
        rowIndex: mockGuid,
    },
    {
        dataType: 'String',
        isInput: true,
        isRequired: true,
        label: 'Target Name or ID',
        maxOccurs: 1,
        objectType: null,
        name: 'subjectNameOrId',
        rowIndex: '58d8bd82-1977-4cf3-a5a7-f629347fa0e8',
        value: {
          value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
          error: null
        },
        valueDataType: 'reference',
    },
    {
        dataType: 'String',
        isInput: true,
        isRequired: true,
        label: 'Message',
        maxOccurs: 1,
        name: 'text',
        objectType: null,
        rowIndex: '84b6d19d-718f-452d-9803-fe97a263f76c',
        value: {
          value: 'This is a message',
          error: null
        },
        valueDataType: 'String',
    },
    {
        dataType: 'SObject',
        isInput: true,
        isRequired: false,
        label: 'Account',
        maxOccurs: 1,
        name: 'account',
        objectType: 'Account',
        rowIndex: mockGuid,
    },
    {
        dataType: 'SObject',
        isInput: true,
        isRequired: false,
        label: 'Account List',
        maxOccurs: 2000,
        name: 'accountList',
        objectType: 'Account',
        rowIndex: mockGuid,
    },
];

const mergedOutputs = [
    {
        dataType: 'String',
        isInput: false,
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        objectType: null,
        name: 'feedItemId',
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        value: {
          value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
          error: null
        },
        valueDataType: 'reference',
    }
];

const duplicatedMergedOutputs = [
    {
        dataType: 'String',
        isInput: false,
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        objectType: null,
        name: 'feedItemId',
        rowIndex: 'a27f10fb-5858-474c-8f87-0fc38a5c7ebf',
        value: {
          value: '578b0f58-afd1-4ddb-9d7e-fdfe6ab5703f',
          error: null
        },
        valueDataType:'reference',
        warnings: ['duplicate']
    },
    {
        dataType: 'String',
        isInput: false,
        isRequired: false,
        label: 'Feed Item ID',
        maxOccurs: 1,
        objectType: null,
        name: 'feedItemId',
        rowIndex: 'abd34jhb-5858-474c-8f87-0fc38a5c7ebf',
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
        valueDataType: 'reference',
      },
];
const getParameterItem = (parameterItems, name) => parameterItems.find(parameterItem => parameterItem.name === name);

describe('ActionCall/ApexPlugin parameters merge', () => {
    const storeLib = require.requireActual('builder_platform_interaction/storeLib');
    storeLib.generateGuid = jest.fn().mockReturnValue(mockGuid);
    describe('When there is no warning', () => {
        it('merges input and output parameters', () => {
            const mergedParameters = mergeInputOutputParameters(mockActionParameters, nodeInputParameters, nodeOutputParameters);
            expect(mergedParameters.inputs).toEqual(mergedInputs);
            expect(mergedParameters.outputs).toEqual(mergedOutputs);
        });
    });
    describe('When there is duplicate parameter', () => {
        let mergedParameters;
        beforeEach(() => {
            mergedParameters = mergeInputOutputParameters(mockActionParameters, null, duplicatedOutputParameters);
        });
        it('merges duplicated output parameters', () => {
            expect(mergedParameters.outputs).toEqual(duplicatedMergedOutputs);
        });
        it('generates DUPLICATE warning', () => {
            expect(mergedParameters.outputs[0].warnings).toEqual([MERGE_WARNING_TYPE.DUPLICATE]);
            expect(mergedParameters.outputs[1].warnings).toEqual([MERGE_WARNING_TYPE.DUPLICATE]);
        });
    });
    describe('When there is no parameter in an action or apex plugin', () => {
        let notAvailabelParameterItem;
        beforeEach(() => {
            const mergedParameters = mergeInputOutputParameters(mockActionParameters, notAvailableParameter, null);
            notAvailabelParameterItem = getParameterItem(mergedParameters.inputs, 'notAvailableParameter');
        });
        it('should have notAvailableParameter item', () => {
            expect(notAvailabelParameterItem).toBeDefined();
        });
        it('generates NOT_AVAILABLE warning', () => {
            expect(notAvailabelParameterItem.warnings).toEqual([MERGE_WARNING_TYPE.NOT_AVAILABLE]);
        });
    });
});
