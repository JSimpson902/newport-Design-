import {
    createScreenField,
    createScreenFieldMetadataObject,
    createEmptyScreenFieldOfType
} from '../screenField';
import { deepFindMatchers } from 'builder_platform_interaction/builderTestUtils';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { getProcessTypeAutomaticOutPutHandlingSupport } from 'builder_platform_interaction/processTypeLib';

expect.extend(deepFindMatchers);

const MOCK_PROCESS_TYPE_SUPPORTING_AUTOMATIC_MODE = 'flow';

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
    return storeLib;
});

const mockGetScreenFieldTypeByNameEmail = () => ({
    category: 'Input',
    description: 'Email Component',
    fieldType: 'ComponentInstance',
    genericTypes: undefined,
    icon: 'standard:email',
    label: 'Email',
    marker: undefined,
    name: 'flowruntime:email',
    source: 'server'
});

jest.mock('builder_platform_interaction/screenEditorUtils', () => {
    const actual = require.requireActual(
        '../../screenEditorUtils/screenEditorUtils.js'
    );
    return {
        getFlowDataTypeByName: actual.getFlowDataTypeByName,
        isExtensionField: actual.isExtensionField,
        isChoiceField: actual.isChoiceField,
        isTextAreaField: actual.isTextAreaField,
        getScreenFieldTypeByName: jest.fn().mockImplementation(() => {
            return mockGetScreenFieldTypeByNameEmail();
        })
    };
});

const componentAutomaticScreenFieldMetadata = () => ({
    choiceReferences: [],
    extensionName: 'flowruntime:email',
    fieldType: 'ComponentInstance',
    dataTypeMappings: [
        {
            typeName: 'T',
            typeValue: 'Asset'
        }
    ],
    inputParameters: [
        {
            name: 'placeholder',
            value: {
                stringValue: 'your email address'
            }
        }
    ],
    visibilityRule: {
        conditionLogic: 'and',
        conditions: [
            {
                operator: 'EqualTo'
            }
        ]
    },
    isRequired: true,
    name: 'myEmail',
    outputParameters: [],
    scale: 0,
    storeOutputAutomatically: true
});

const componentScreenFieldEmailMetadata = () => ({
    choiceReferences: [],
    extensionName: 'flowruntime:email',
    fieldType: 'ComponentInstance',
    inputParameters: [
        {
            name: 'placeholder',
            value: {
                stringValue: 'your email address'
            }
        }
    ],
    visibilityRule: {
        conditionLogic: 'and',
        conditions: [
            {
                operator: 'EqualTo'
            }
        ]
    },
    isRequired: true,
    name: 'myEmail',
    outputParameters: [],
    scale: 0
});

const componentScreenFieldEmailStore = () => ({
    guid: '0ca39158-9508-4b85-b1b6-28564b4ba4c0',
    name: 'myEmail',
    choiceReferences: [],
    dataType: undefined,
    defaultSelectedChoiceReference: undefined,
    defaultValue: '',
    defaultValueDataType: undefined,
    defaultValueIndex: '60c55df3-dd55-49de-80ae-f1ed8c294e11',
    elementType: 'SCREEN_FIELD',
    extensionName: 'flowruntime:email',
    fieldText: '',
    fieldType: 'ComponentInstance',
    helpText: '',
    inputParameters: [
        {
            rowIndex: '0bd35e51-fa6e-4694-8ea3-4f31e6ec7e02',
            name: 'placeholder',
            value: 'your email address',
            valueDataType: 'String'
        }
    ],
    isNewField: false,
    isRequired: true,
    isVisible: undefined,
    outputParameters: [],
    scale: '0',
    storeOutputAutomatically: false,
    visibilityRule: {
        conditionLogic: 'and',
        conditions: [
            {
                operator: 'EqualTo'
            }
        ]
    }
});

const componentAutomaticScreenFieldStore = () => ({
    guid: '06001014-dce2-4206-add3-d73bdcc38174',
    name: 'myEmail',
    choiceReferences: [],
    dataType: 'LightningComponentOutput',
    defaultValue: '',
    defaultValueIndex: '5d457ada-a9de-41b0-8225-847942f4f69b',
    validationRule: {
        formulaExpression: null,
        errorMessage: null
    },
    extensionName: 'flowruntime:email',
    fieldType: 'ComponentInstance',
    fieldText: '',
    helpText: '',
    dynamicTypeMappings: [
        {
            typeName: 'T',
            typeValue: 'Asset'
        }
    ],
    inputParameters: [
        {
            rowIndex: '9950e933-80b8-4352-b1d1-3c186f502765',
            name: 'placeholder',
            value: 'your email address',
            valueDataType: 'String'
        }
    ],
    isNewField: false,
    isRequired: true,
    outputParameters: [],
    scale: '0',
    type: {
        name: 'flowruntime:email',
        fieldType: 'ComponentInstance',
        label: 'flowruntime:email',
        icon: 'standard:lightning_component',
        source: 'local'
    },
    elementType: 'SCREEN_FIELD',
    visibilityRule: {
        conditionLogic: 'and',
        conditions: [
            {
                operator: 'EqualTo'
            }
        ]
    },
    storeOutputAutomatically: true
});

describe('screenField', () => {
    describe('Add new Component on the screen (createEmptyScreenFieldOfType)', () => {
        describe('LC screen field (automatic output handling supported)', () => {
            let actualResult;
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Supported'
                );
                actualResult = createEmptyScreenFieldOfType(
                    'flowruntime:email'
                );
            });
            it('"storeOutputAutomatically" should be false', () => {
                expect(actualResult.storeOutputAutomatically).toBe(false);
            });
        });
    });
    describe('screenField flow metadata => UI model', () => {
        describe('LC screen field with automatic output handling', () => {
            let screenFieldMetadata;
            beforeEach(() => {
                screenFieldMetadata = componentAutomaticScreenFieldMetadata();
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Supported'
                );
            });
            it('has no common mutable object with screen field metadata passed as parameter', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult).toHaveNoCommonMutableObjectWith(
                    screenFieldMetadata
                );
            });
            it('"outputParameters" should be an empty array', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.outputParameters).toEqual([]);
            });
            it('should have a LIGHTNING_COMPONENT_OUTPUT datatype', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.dataType).toBe(
                    FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value
                );
                expect(actualResult.isCollection).toBeFalsy();
                expect(actualResult.subtype).toBeFalsy();
            });
            it('"storeOutputAutomatically" should be true', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.storeOutputAutomatically).toBe(true);
            });
            it('should have one type mapping', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult).toHaveProperty('dynamicTypeMappings');
                expect(actualResult.dynamicTypeMappings).toHaveLength(1);
                expect(actualResult.dynamicTypeMappings[0]).toMatchObject({
                    typeName: 'T',
                    typeValue: 'Asset'
                });
            });
        });
        describe('LC screen field (automatic output handling not supported)', () => {
            let screenFieldMetadata;
            beforeEach(() => {
                screenFieldMetadata = componentScreenFieldEmailMetadata();
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Unsupported'
                );
            });
            it('"outputParameters" should be an empty array', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.outputParameters).toEqual([]);
            });
            it('should have a datatype undefined', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.dataType).toBeUndefined();
                expect(actualResult.isCollection).toBeFalsy();
                expect(actualResult.subtype).toBeFalsy();
            });
            it('"storeOutputAutomatically" should be false', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult.storeOutputAutomatically).toBe(false);
            });
            it('has no dynamic type mappings', () => {
                const actualResult = createScreenField(screenFieldMetadata);
                expect(actualResult).not.toHaveProperty('dynamicTypeMappings');
            });
        });
    });
    describe('screenField UI model => flow metadata', () => {
        describe('LC screen field with automatic output handling', () => {
            beforeEach(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Supported'
                );
            });
            it('converts to flow metadata', () => {
                const actualResult = createScreenFieldMetadataObject(
                    componentAutomaticScreenFieldStore()
                );

                expect(actualResult).toMatchObject(
                    componentAutomaticScreenFieldMetadata()
                );
            });
            it('has no common mutable object with screen field from store passed as parameter', () => {
                const screenFieldStore = componentAutomaticScreenFieldStore();
                const actualResult = createScreenFieldMetadataObject(
                    screenFieldStore
                );
                expect(actualResult).toHaveNoCommonMutableObjectWith(
                    screenFieldStore
                );
            });
            it('has dynamic type mappings', () => {
                const actualResult = createScreenFieldMetadataObject(
                    componentAutomaticScreenFieldStore()
                );
                expect(actualResult).toHaveProperty('dataTypeMappings');
                expect(actualResult.dataTypeMappings).toHaveLength(1);
                expect(actualResult.dataTypeMappings[0]).toEqual({
                    typeName: 'T',
                    typeValue: 'Asset'
                });
            });
        });
        describe('LC screen field (automatic output handling not supported)', () => {
            beforeAll(() => {
                getProcessTypeAutomaticOutPutHandlingSupport.mockReturnValue(
                    'Unsupported'
                );
            });
            it('convert to flow metadata', () => {
                const actualResult = createScreenFieldMetadataObject(
                    componentScreenFieldEmailStore()
                );
                expect(actualResult).toMatchObject(
                    componentScreenFieldEmailMetadata()
                );
                expect(actualResult.storeOutputAutomatically).not.toBeDefined();
                expect(actualResult).not.toHaveProperty('dataTypeMappings');
            });
            it('convert to flow metadata should remove the storeOutputAutomatically if processType does not support it', () => {
                const actualResult = createScreenFieldMetadataObject(
                    componentAutomaticScreenFieldStore()
                );
                expect(actualResult).toMatchObject(
                    componentScreenFieldEmailMetadata()
                );
                expect(actualResult.storeOutputAutomatically).not.toBeDefined();
            });
        });
    });
});
