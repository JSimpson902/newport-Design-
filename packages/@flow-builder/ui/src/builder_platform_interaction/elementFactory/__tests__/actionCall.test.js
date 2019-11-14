import {
    createActionCall,
    createDuplicateActionCall,
    createActionCallMetadataObject
} from '../actionCall';
import {
    ELEMENT_TYPE,
    CONNECTOR_TYPE
} from 'builder_platform_interaction/flowMetadata';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { deepFindMatchers } from 'builder_platform_interaction/builderTestUtils';
import { DUPLICATE_ELEMENT_XY_OFFSET } from '../base/baseElement';
import { getProcessTypeAutomaticOutPutHandlingSupport } from 'builder_platform_interaction/processTypeLib';
import {
    apexCallAutomaticAnonymousAccountOutput,
    apexCallAutomaticAnonymousStringOutput,
    apexCallAutomaticAnonymousAccountsOutput,
    apexCallAutomaticAnonymousStringsOutput,
    apexCallAutomaticAnonymousApexTypeCollectionOutput
} from 'mock/storeData';
import { getActionCallsByNames } from 'mock/flows/mock-flow.js';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';

const MOCK_PROCESS_TYPE_SUPPORTING_AUTOMATIC_MODE = 'flow';

const mockGuid = 'mockGuid';

jest.mock('builder_platform_interaction/processTypeLib', () => {
    const actual = require.requireActual(
        '../../processTypeLib/processTypeLib.js'
    );
    return {
        FLOW_AUTOMATIC_OUTPUT_HANDLING: actual.FLOW_AUTOMATIC_OUTPUT_HANDLING,
        getProcessTypeAutomaticOutPutHandlingSupport: jest.fn()
    };
});

jest.mock('builder_platform_interaction/storeLib', () => {
    const getCurrentState = function () {
        return {
            properties: {
                processType: MOCK_PROCESS_TYPE_SUPPORTING_AUTOMATIC_MODE
            },
            elements: {
                mockGuid: {
                    availableConnections: [],
                    elementType: 'not start Element'
                }
            }
        };
    };
    const getStore = function () {
        return {
            getCurrentState
        };
    };
    const storeLib = require('builder_platform_interaction_mocks/storeLib');
    // Overriding mock storeLib to have custom getStore function
    storeLib.Store.getStore = getStore;
    storeLib.generateGuid = jest.fn().mockReturnValue('mockGuid');
    return storeLib;
});

expect.extend(deepFindMatchers);

const flowDataTypeMapping = {
    typeName: 'T__record',
    typeValue: 'Account'
};

const storeDataTypeMapping = {
    typeName: 'T__record',
    typeValue: 'Account',
    rowIndex: mockGuid
};

const flowInputParameterWithDefaultValueAsString = {
    name: 'text',
    value: {
        stringValue: 'This is message'
    }
};

const storeInputParameterWithDefaultValueAsString = {
    name: 'text',
    value: 'This is message',
    valueDataType: 'String',
    rowIndex: mockGuid
};

const flowInputParameterWithDefaultValueAsReference = {
    name: 'subjectNameOrId',
    value: {
        elementReference: 'var_text'
    }
};

const storeInputParameterWithDefaultValueAsReference = {
    name: 'subjectNameOrId',
    value: 'var_text',
    valueDataType: 'reference',
    rowIndex: mockGuid
};

const flowOutputParameterWithDefaultValue = {
    name: 'feedId',
    assignToReference: 'var_text'
};

const storeOutputParameterWithDefaultValue = {
    name: 'feedId',
    value: 'var_text',
    valueDataType: 'reference',
    rowIndex: mockGuid
};

const actionCallMetaData = {
    actionName: 'chatterPost',
    actionType: 'chatterPost',
    dataTypeMappings: [flowDataTypeMapping],
    inputParameters: [
        flowInputParameterWithDefaultValueAsString,
        flowInputParameterWithDefaultValueAsReference
    ],
    label: 'My Post to Chatter',
    locationX: 353,
    locationY: 57,
    name: 'My_Post_to_Chatter',
    outputParameters: [flowOutputParameterWithDefaultValue],
    storeOutputAutomatically: false
};

const actionCallInStore = {
    actionName: 'chatterPost',
    actionType: 'chatterPost',
    guid: 'a08ba1ea-8216-47c6-b32a-551864086a27',
    name: 'My_Post_to_Chatter',
    description: '',
    label: 'My Post to Chatter',
    locationX: 353,
    locationY: 57,
    isCanvasElement: true,
    connectorCount: 0,
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    config: {
        isSelected: false
    },
    dataTypeMappings: [storeDataTypeMapping],
    inputParameters: [
        storeInputParameterWithDefaultValueAsString,
        storeInputParameterWithDefaultValueAsReference
    ],
    outputParameters: [storeOutputParameterWithDefaultValue],
    maxConnections: 2,
    elementType: 'ACTION_CALL',
    storeOutputAutomatically: false
};

const parametersWithoutProcessMetaDataValue = (parameters, isInput) => {
    return parameters.map(param => {
        if (isInput) {
            return {
                name: param.name,
                value: param.value
            };
        }
        return {
            name: param.name,
            assignToReference: param.assignToReference
        };
    });
};

const actionCallAutomaticOutputMetadata = {
    actionName: 'chatterPost',
    actionType: 'chatterPost',
    inputParameters: [
        flowInputParameterWithDefaultValueAsString,
        flowInputParameterWithDefaultValueAsReference
    ],
    label: 'postToChatter',
    locationX: 442,
    locationY: 256,
    name: 'postToChatter',
    outputParameters: [],
    storeOutputAutomatically: true
};

const actionCallAutomaticOutputInStore = {
    guid: 'c6ae58ae-32d6-47d2-bad3-56d614450301',
    name: 'postToChatter',
    description: '',
    label: 'postToChatter',
    locationX: 442,
    locationY: 256,
    isCanvasElement: true,
    connectorCount: 0,
    config: {
        isSelected: false,
        isHighlighted: false
    },
    actionType: 'chatterPost',
    actionName: 'chatterPost',
    inputParameters: [
        storeInputParameterWithDefaultValueAsString,
        storeInputParameterWithDefaultValueAsReference
    ],
    outputParameters: [],
    availableConnections: [
        {
            type: 'REGULAR'
        },
        {
            type: 'FAULT'
        }
    ],
    maxConnections: 2,
    elementType: 'ActionCall',
    dataType: 'ActionOutput',
    storeOutputAutomatically: true
};

jest.mock('builder_platform_interaction/invocableActionLib', () =>
    require('builder_platform_interaction_mocks/invocableActionLib')
);

describe('actionCall', () => {
    describe('createActionCall function', () => {
        let actionCall;
        describe('when empty actionCall is created', () => {
            beforeEach(() => {
                actionCall = createActionCall();
            });

            it('creates element of type ACTION_CALL', () => {
                expect(actionCall.elementType).toEqual(
                    ELEMENT_TYPE.ACTION_CALL
                );
            });

            it('has empty actionName', () => {
                expect(actionCall.actionName).toEqual('');
            });

            it('has empty actionType', () => {
                expect(actionCall.actionType).toEqual('');
            });

            it('has no input parameters by default', () => {
                expect(actionCall.inputParameters).toHaveLength(0);
            });

            it('has no output parameters by default', () => {
                expect(actionCall.outputParameters).toHaveLength(0);
            });
            it('has dataType of ACTION_OUTPUT', () => {
                expect(actionCall.dataType).toEqual(
                    FLOW_DATA_TYPE.ACTION_OUTPUT.value
                );
            });
        });

        describe('when flow actionCall is passed', () => {
            beforeEach(() => {
                actionCall = createActionCall(actionCallMetaData);
            });
            it('creates element of type ACTION_CALL', () => {
                expect(actionCall.elementType).toEqual(
                    ELEMENT_TYPE.ACTION_CALL
                );
            });
            it('has actionName equal to actionName from store', () => {
                expect(actionCall.actionName).toEqual(
                    actionCallMetaData.actionName
                );
            });
            it('has actionType equal to actionType from store', () => {
                expect(actionCall.actionType).toEqual(
                    actionCallMetaData.actionType
                );
            });
            it('has dataTypeMappings matching the dataTypeMappings from store', () => {
                expect(actionCall.dataTypeMappings).toEqual(
                    actionCallInStore.dataTypeMappings
                );
            });
            it('has inputParameters matching the inputParameters from store', () => {
                expect(actionCall.inputParameters).toEqual(
                    actionCallInStore.inputParameters
                );
            });
            it('has outputParameters matching the outputParameters from store', () => {
                expect(actionCall.outputParameters).toEqual(
                    actionCallInStore.outputParameters
                );
            });
            it('has dataType of ACTION OUTPUT', () => {
                expect(actionCall.dataType).toEqual(
                    FLOW_DATA_TYPE.BOOLEAN.value
                );
            });
            it('has no common mutable object with action call metadata passed as parameter', () => {
                expect(actionCall).toHaveNoCommonMutableObjectWith(
                    actionCallMetaData
                );
            });
        });

        describe('when store actionCall is passed', () => {
            beforeEach(() => {
                actionCall = createActionCall(actionCallInStore);
            });
            it('has actionName equal to actionName from store', () => {
                expect(actionCall.actionName).toEqual(
                    actionCallInStore.actionName
                );
            });
            it('has actionType equal to actionType from store', () => {
                expect(actionCall.actionType).toEqual(
                    actionCallInStore.actionType
                );
            });
            it('has dataTypeMappings matching the dataTypeMappings from store', () => {
                expect(actionCall.dataTypeMappings).toEqual(
                    actionCallInStore.dataTypeMappings
                );
            });
            it('has inputParameters matching the inputParameters from store', () => {
                expect(actionCall.inputParameters).toEqual(
                    actionCallInStore.inputParameters
                );
            });
            it('has outputParameters matching the outputParameters from store', () => {
                expect(actionCall.outputParameters).toEqual(
                    actionCallInStore.outputParameters
                );
            });
            it('has dataType of boolean', () => {
                expect(actionCall.dataType).toEqual(
                    FLOW_DATA_TYPE.BOOLEAN.value
                );
            });
            it('has no common mutable object with action call from store passed as parameter', () => {
                expect(actionCall).toHaveNoCommonMutableObjectWith(
                    actionCallInStore
                );
            });
        });

        describe('when metadata action call with automatic output handling is passed', () => {
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Supported'
                );
                actionCall = createActionCall(
                    actionCallAutomaticOutputMetadata
                );
            });
            it('has no common mutable object with action metadata passed as parameter', () => {
                expect(actionCall).toHaveNoCommonMutableObjectWith(
                    actionCallAutomaticOutputMetadata
                );
            });
            it('"outputParameters" should be an empty array', () => {
                expect(actionCall.outputParameters).toEqual([]);
            });
            it('should have a ACTION_OUTPUT datatype', () => {
                expect(actionCall.dataType).toBe(
                    FLOW_DATA_TYPE.ACTION_OUTPUT.value
                );
                expect(actionCall.isCollection).toBeFalsy();
                expect(actionCall.subtype).toBeFalsy();
            });
            it('"storeOutputAutomatically" should be true', () => {
                expect(actionCall.storeOutputAutomatically).toBe(true);
            });
            it('"isSystemGeneratedOutput" should be undefined', () => {
                expect(actionCall.isSystemGeneratedOutput).toBeUndefined();
            });
            it('should not define "isCollection"', () => {
                expect(actionCall.isCollection).toBeUndefined();
            });
            it('should not define apexClass', () => {
                expect(actionCall.apexClass).toBeUndefined();
            });
        });

        describe('when metadata action call with anonymous output handling is passed', () => {
            it('sets isSystemGeneratedOutput to true, isCollection to false and primitive datatype for single primitives', () => {
                const createdAction = createActionCall(
                    getActionCallsByNames(flowWithAllElements, [
                        apexCallAutomaticAnonymousStringOutput.name
                    ])[0]
                );

                expect(createdAction.isSystemGeneratedOutput).toBe(true);
                expect(createdAction.dataType).toBe(
                    FLOW_DATA_TYPE.STRING.value
                );
                expect(createdAction.subtype).toBeNull();
                expect(createdAction.isCollection).toBe(false);
            });
            it('sets isSystemGeneratedOutput to true, isCollection to false, sobject datatype and subtype for single sobjects', () => {
                const createdAction = createActionCall(
                    getActionCallsByNames(flowWithAllElements, [
                        apexCallAutomaticAnonymousAccountOutput.name
                    ])[0]
                );

                expect(createdAction.isSystemGeneratedOutput).toBe(true);
                expect(createdAction.dataType).toBe(
                    FLOW_DATA_TYPE.SOBJECT.value
                );
                expect(createdAction.subtype).toBe('Account');
                expect(createdAction.isCollection).toBe(false);
            });
            it('sets isSystemGeneratedOutput to true, isCollection to true and primitive datatype for collection of primitives', () => {
                const createdAction = createActionCall(
                    getActionCallsByNames(flowWithAllElements, [
                        apexCallAutomaticAnonymousStringsOutput.name
                    ])[0]
                );

                expect(createdAction.isSystemGeneratedOutput).toBe(true);
                expect(createdAction.dataType).toBe(
                    FLOW_DATA_TYPE.STRING.value
                );
                expect(createdAction.subtype).toBeNull();
                expect(createdAction.isCollection).toBe(true);
            });
            it('sets isSystemGeneratedOutput to true, isCollection to true, sobject datatype and subtype for collection of sobjects', () => {
                const createdAction = createActionCall(
                    getActionCallsByNames(flowWithAllElements, [
                        apexCallAutomaticAnonymousAccountsOutput.name
                    ])[0]
                );

                expect(createdAction.isSystemGeneratedOutput).toBe(true);
                expect(createdAction.dataType).toBe(
                    FLOW_DATA_TYPE.SOBJECT.value
                );
                expect(createdAction.subtype).toBe('Account');
                expect(createdAction.isCollection).toBe(true);
            });
            it('sets isSystemGeneratedOutput to true, isCollection to true, apex datatype and apex class for collection of apex types', () => {
                const createdAction = createActionCall(
                    getActionCallsByNames(flowWithAllElements, [
                        apexCallAutomaticAnonymousApexTypeCollectionOutput.name
                    ])[0]
                );

                expect(createdAction.isSystemGeneratedOutput).toBe(true);
                expect(createdAction.dataType).toBe(FLOW_DATA_TYPE.APEX.value);
                expect(createdAction.apexClass).toBe(
                    'InvocableGetCars$GetCarResult'
                );
                expect(createdAction.isCollection).toBe(true);
            });
        });
    });

    describe('createDuplicateActionCall function', () => {
        const originalActionCall = {
            guid: 'originalGuid',
            name: 'originalName',
            label: 'label',
            elementType: ELEMENT_TYPE.ACTION_CALL,
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
        const { duplicatedElement } = createDuplicateActionCall(
            originalActionCall,
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
            expect(duplicatedElement.locationX).toEqual(
                originalActionCall.locationX + DUPLICATE_ELEMENT_XY_OFFSET
            );
        });
        it('has the updated locationY', () => {
            expect(duplicatedElement.locationY).toEqual(
                originalActionCall.locationY + DUPLICATE_ELEMENT_XY_OFFSET
            );
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
            expect(duplicatedElement.elementType).toEqual(
                ELEMENT_TYPE.ACTION_CALL
            );
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

    describe('createActionCallMetadataObject function', () => {
        let actionCallMetaDataObject;
        describe('when store actionCall is passed', () => {
            beforeEach(() => {
                actionCallMetaDataObject = createActionCallMetadataObject(
                    actionCallInStore
                );
            });
            it('has actionName equal to actionName from flow', () => {
                expect(actionCallMetaDataObject.actionName).toEqual(
                    actionCallMetaData.actionName
                );
            });
            it('has actionType equal to actionType from flow', () => {
                expect(actionCallMetaDataObject.actionType).toEqual(
                    actionCallMetaData.actionType
                );
            });
            it('has dataTypeMappings matching the dataTypeMappings from flow', () => {
                expect(actionCallMetaDataObject.dataTypeMappings).toEqual(
                    actionCallMetaData.dataTypeMappings
                );
            });
            it('has inputParameters matching the inputParameters from flow', () => {
                expect(actionCallMetaDataObject.inputParameters).toEqual(
                    parametersWithoutProcessMetaDataValue(
                        actionCallMetaData.inputParameters,
                        true
                    )
                );
            });
            it('has outputParameters matching the outputParameters from flow', () => {
                expect(actionCallMetaDataObject.outputParameters).toEqual(
                    parametersWithoutProcessMetaDataValue(
                        actionCallMetaData.outputParameters,
                        false
                    )
                );
            });
        });
        describe('when store actionCall with automatic output handling is passed', () => {
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Supported'
                );
            });
            it('convert to flow metadata', () => {
                const actualResult = createActionCallMetadataObject(
                    actionCallAutomaticOutputInStore
                );

                expect(actualResult).toMatchObject(
                    actionCallAutomaticOutputMetadata
                );
            });
            it('has no common mutable object with actionCall from store passed as parameter', () => {
                const actualResult = createActionCallMetadataObject(
                    actionCallAutomaticOutputInStore
                );
                expect(actualResult).toHaveNoCommonMutableObjectWith(
                    actionCallAutomaticOutputInStore
                );
            });
        });
    });
});
