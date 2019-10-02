import {
    getElementsForMenuData,
    getEntitiesMenuData,
    getStoreElements,
    filterAndMutateMenuData,
    getEventTypesMenuData,
    getSecondLevelItems,
    getResourceTypesMenuData
} from '../menuDataRetrieval.js';
import {
    numberParamCanBeAnything,
    stringParam,
    booleanParam,
    stageParam
} from 'mock/ruleService';
import * as store from 'mock/storeData';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import * as selectorsMock from 'builder_platform_interaction/selectors';
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import { getAllEntities } from 'builder_platform_interaction/sobjectLib';
import {
    GLOBAL_CONSTANTS as gcLabels,
    GLOBAL_CONSTANT_OBJECTS as gcObjects,
    SYSTEM_VARIABLE_PREFIX
} from 'builder_platform_interaction/systemLib';
import { LABELS } from '../expressionUtilsLabels';
import { addCurlyBraces } from 'builder_platform_interaction/commonUtils';
import variablePluralLabel from '@salesforce/label/FlowBuilderElementConfig.variablePluralLabel';
import {
    platformEvent1ApiName,
    platformEvent1Label
} from 'mock/eventTypesData';
import {
    getEventTypes,
    getFieldsForEntity
} from 'builder_platform_interaction/sobjectLib';
import { setSystemVariables } from '../../../../jest-modules/builder_platform_interaction/systemLib/systemLib';
import { getSystemVariables } from '../../systemLib/systemLib';
import { getPropertiesForClass } from 'builder_platform_interaction/apexTypeLib';
import { systemVariablesForFlow as systemVariables } from 'serverData/GetSystemVariables/systemVariablesForFlow.json';
import { mockFlowRuntimeEmailFlowExtensionDescription } from 'mock/flowExtensionsData';
import { untilNoFailure } from 'builder_platform_interaction/builderTestUtils';
import { chatterPostActionParameters as mockChatterPostActionParameters } from 'serverData/GetInvocableActionParameters/chatterPostActionParameters.json';
import { logACallActionParameters as mockLogACallActionParameters } from 'serverData/GetInvocableActionParameters/logACallActionParameters.json';
import { getScreenElement } from '../resourceUtils';
import { mockScreenElement } from 'mock/calloutData';

jest.mock('builder_platform_interaction/storeLib', () =>
    require('builder_platform_interaction_mocks/storeLib')
);

const collectionVariable = LABELS.collectionVariablePluralLabel.toUpperCase();
const sobjectVariable = LABELS.sObjectPluralLabel.toUpperCase();
const sobjectCollectionVariable = LABELS.sObjectCollectionPluralLabel.toUpperCase();
const screenFieldVariable = LABELS.screenFieldPluralLabel.toUpperCase();

/*
    Desired format output from getStoreElements
    [
        {
         label: "Collection Variable",
         items: [{collStrVar1}, {collStrVar2}]
        },
        {
         label: "SObject Variable",
         items: [{accVar1}]
        },
        {
         label: "Variable",
         items: [{numVar1}]
        },
        ...
    ]
 */

const sampleNumberParamTypes = {
    Number: [numberParamCanBeAnything],
    canBeSobjectField: true
};

const sampleStringParamTypes = {
    String: [stringParam]
};

const sampleBooleanParamTypes = {
    Boolean: [booleanParam]
};

const sampleStageParamTypes = {
    STAGE: [stageParam]
};

const parentSObjectItem = {
    dataType: FLOW_DATA_TYPE.SOBJECT.value,
    subtype: 'Account',
    displayText: 'recordVar'
};

const parentApexItem = {
    dataType: FLOW_DATA_TYPE.APEX.value,
    subtype: 'ApexClass',
    displayText: 'apexVar'
};

const parentLightningComponentScreenFieldItem = {
    dataType: FLOW_DATA_TYPE.LIGHTNING_COMPONENT_OUTPUT.value,
    displayText: 'emailComponent',
    value: store.emailScreenFieldAutomaticOutput.guid
};

const parentActionItem = {
    dataType: FLOW_DATA_TYPE.ACTION_OUTPUT.value,
    displayText: 'action',
    value: store.actionCallAutomaticOutput.guid
};

jest.mock('builder_platform_interaction/apexTypeLib', () => {
    return {
        getPropertiesForClass: jest.fn()
    };
});

jest.mock('builder_platform_interaction/flowExtensionLib', () => {
    return {
        getCachedExtension: jest
            .fn()
            .mockImplementation(
                () => mockFlowRuntimeEmailFlowExtensionDescription
            )
    };
});

jest.mock('builder_platform_interaction/screenEditorUtils', () => {
    const actual = require.requireActual(
        '../../screenEditorUtils/screenEditorUtils.js'
    );
    return {
        getFlowDataTypeByName: actual.getFlowDataTypeByName,
        getIconNameFromDataType: jest.fn().mockImplementation(() => {
            return 'standard:email';
        })
    };
});

jest.mock('builder_platform_interaction/invocableActionLib', () => {
    return {
        getParametersForInvocableAction: jest
            .fn()
            .mockImplementation(({ actionName, actionType }) => {
                const key = `${actionType}-${actionName}`;
                switch (key) {
                    case 'chatterPost-chatterPost':
                        return mockChatterPostActionParameters;
                    case 'quickAction-Case.LogACall':
                        return mockLogACallActionParameters;
                    default:
                        return undefined;
                }
            })
    };
});

jest.mock('builder_platform_interaction/sobjectLib', () => {
    const sobjectLib = require.requireActual('../../sobjectLib/sobjectLib.js');
    return {
        getFieldsForEntity: jest
            .fn()
            .mockImplementation((entityName, callback) => {
                if (callback) {
                    callback(
                        require.requireActual('mock/serverEntityData')
                            .accountFields
                    );
                }
            }),
        getAllEntities: jest.fn().mockImplementation(() => {
            return require.requireActual('mock/serverEntityData').mockEntities;
        }),
        getEventTypes: jest.fn().mockImplementation(() => {
            return require('mock/eventTypesData').mockEventTypes;
        }),
        ENTITY_TYPE: sobjectLib.ENTITY_TYPE
    };
});

jest.mock('builder_platform_interaction/selectors', () => {
    return {
        writableElementsSelector: jest.fn(),
        sObjectOrSObjectCollectionByEntitySelector: jest.fn(),
        readableElementsSelector: jest.fn()
    };
});

jest.mock('builder_platform_interaction/dataTypeLib', () => {
    const actual = require.requireActual('../../dataTypeLib/dataTypeLib.js');
    const {
        ELEMENT_TYPE: elementType
    } = require('builder_platform_interaction/flowMetadata');
    return {
        getDataTypeLabel: actual.getDataTypeLabel,
        getDataTypeIcons: actual.getDataTypeIcons,
        FLOW_DATA_TYPE: actual.FLOW_DATA_TYPE,
        FEROV_DATA_TYPE: actual.FEROV_DATA_TYPE,
        isComplexType: actual.isComplexType,
        getFlowDataType: actual.getFlowDataType,
        getResourceTypes: jest.fn().mockImplementation(() => {
            return [
                { name: elementType.VARIABLE },
                { name: elementType.CONSTANT },
                { name: elementType.FORMULA }
            ];
        })
    };
});

jest.mock('builder_platform_interaction/elementLabelLib', () => {
    const actual = require.requireActual(
        '../../elementLabelLib/elementLabelLib.js'
    );
    return {
        getResourceLabel: jest
            .fn()
            .mockImplementation(resource => resource.name),
        getResourceCategory: actual.getResourceCategory
    };
});

jest.mock('../resourceUtils', () => {
    return {
        getScreenElement: jest.fn().mockImplementation(() => mockScreenElement)
    };
});

describe('Menu data retrieval', () => {
    afterEach(() => {
        selectorsMock.writableElementsSelector.mockReset();
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReset();
        selectorsMock.readableElementsSelector.mockReset();
    });
    it('should sort alphabetically by category', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable,
            store.accountSObjectVariable,
            store.stringCollectionVariable1,
            store.stringCollectionVariable2,
            store.dateVariable
        ]);
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        });
        expect(menuData[0].label).toBe(collectionVariable);
        expect(menuData[1].label).toBe(screenFieldVariable);
        expect(menuData[2].label).toBe(sobjectVariable);
        expect(menuData[3].label).toBe(variablePluralLabel.toUpperCase());
    });
    it('should sort alphabetically within category', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.stringCollectionVariable1,
            store.stringCollectionVariable2
        ]);
        const collectionVariables = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[0];
        expect(collectionVariables.items).toHaveLength(2);
        expect(collectionVariables.items[0].text).toBe(
            store.stringCollectionVariable1.name
        );
        expect(collectionVariables.items[1].text).toBe(
            store.stringCollectionVariable2.name
        );
    });
    it('should filter by allowed types', () => {
        jest.mock('builder_platform_interaction/ruleLib', () => {
            return {
                isMatch: jest
                    .fn()
                    .mockImplementationOnce(() => true)
                    .mockImplementationOnce(() => false)
            };
        });
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable,
            store.stringCollectionVariable1
        ]);
        const allowedVariables = getElementsForMenuData(
            {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: true
            },
            sampleNumberParamTypes
        );
        expect(allowedVariables).toHaveLength(1);
        expect(allowedVariables[0].items).toHaveLength(1);
        expect(allowedVariables[0].items[0].displayText).toBe(
            addCurlyBraces(store.numberVariable.name)
        );
    });
    it('should preserve devName in text & value field', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.text).toBe(store.numberVariable.name);
        expect(copiedElement.displayText).toBe(
            addCurlyBraces(store.numberVariable.name)
        );
    });
    it('should set subText to subtype for sObject var', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.accountSObjectVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.subText).toBe('Account');
    });
    it('should set subText to label if there is a label', () => {
        selectorsMock.readableElementsSelector.mockReturnValue([
            store.decisionOutcome
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.DECISION,
            shouldBeWritable: true
        })[0].items[0];
        expect(copiedElement.subText).toBe(store.decisionOutcome.name);
    });
    it('should set subText to dataType label if no subtype or label', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.subText).toBe(FLOW_DATA_TYPE.NUMBER.label);
    });

    it('should have New Resource as first element', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable
        ]);
        const allowedVariables = getElementsForMenuData(
            {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: true
            },
            sampleNumberParamTypes,
            true
        );
        expect(allowedVariables).toHaveLength(2);
        expect(allowedVariables[0].text).toBe(
            'FlowBuilderExpressionUtils.newResourceLabel'
        );
        expect(allowedVariables[0].value).toBe('%%NewResource%%');
    });
    it('should include complex objects (non-collection) when fields are allowed', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.accountSObjectVariable,
            store.accountSObjectCollectionVariable,
            store.apexSampleVariable,
            store.apexSampleCollectionVariable,
            store.emailScreenFieldAutomaticOutput,
            store.lookupRecordAutomaticOutput,
            store.lookupRecordCollectionAutomaticOutput,
            store.actionCallAutomaticOutput,
            store.caseLogACallAutomatic // no outputs : should not be included
        ]);
        const primitivesWithObjects = getElementsForMenuData(
            {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: true
            },
            sampleNumberParamTypes,
            false,
            true,
            false
        );
        expect(primitivesWithObjects).toEqual([
            {
                label: 'FLOWBUILDERELEMENTCONFIG.ACTIONPLURALLABEL',
                items: [
                    expect.objectContaining({
                        value: store.actionCallAutomaticOutput.guid
                    })
                ]
            },
            {
                label: 'FLOWBUILDERELEMENTCONFIG.APEXVARIABLEPLURALLABEL',
                items: [
                    expect.objectContaining({
                        value: store.apexSampleVariable.guid
                    })
                ]
            },
            {
                label: 'FLOWBUILDERELEMENTCONFIG.SCREENFIELDPLURALLABEL',
                items: [
                    expect.objectContaining({
                        value: store.emailScreenFieldAutomaticOutput.guid
                    })
                ]
            },
            {
                label: 'FLOWBUILDERELEMENTCONFIG.SOBJECTPLURALLABEL',
                items: [
                    expect.objectContaining({
                        value: store.accountSObjectVariable.guid
                    }),
                    expect.objectContaining({
                        value: store.lookupRecordAutomaticOutput.guid
                    })
                ]
            }
        ]);
        const primitivesNoObjects = getElementsForMenuData(
            {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: true
            },
            sampleNumberParamTypes,
            false,
            true,
            true
        );
        expect(primitivesNoObjects).toHaveLength(0);
    });
    it('should have only sobject variables', () => {
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
            jest.fn().mockReturnValue([store.accountSObjectVariable])
        );
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.RECORD_LOOKUP,
            sObjectSelector: true
        });
        expect(menuData[1].label).toBe(sobjectVariable);
        expect(menuData[1].items).toHaveLength(1);
        expect(menuData[1].items[0].value).toEqual(
            store.accountSObjectVariable.guid
        );
    });
    it('should have only sobject collection variables', () => {
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
            jest.fn().mockReturnValue([store.accountSObjectCollectionVariable])
        );
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.RECORD_LOOKUP,
            sObjectSelector: true
        });
        expect(menuData[1].label).toBe(sobjectCollectionVariable);
        expect(menuData[1].items).toHaveLength(1);
        expect(menuData[1].items[0].value).toEqual(
            store.accountSObjectCollectionVariable.guid
        );
    });
    it('should have one sobject variable and one sobject collection variable', () => {
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
            jest
                .fn()
                .mockReturnValue([
                    store.accountSObjectVariable,
                    store.accountSObjectCollectionVariable
                ])
        );
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.RECORD_LOOKUP,
            sObjectSelector: true
        });
        // TODO: W-5624868 when getElementsForMenuData is removed, this test should pass showSystemVariables = false so that menuData only expects length 2
        expect(menuData).toHaveLength(4);
        expect(menuData[1].label).toBe(sobjectCollectionVariable);
        expect(menuData[2].label).toBe(sobjectVariable);
        expect(menuData[1].items).toHaveLength(1);
        expect(menuData[1].items[0].value).toEqual(
            store.accountSObjectCollectionVariable.guid
        );
        expect(menuData[2].items).toHaveLength(1);
        expect(menuData[2].items[0].value).toEqual(
            store.accountSObjectVariable.guid
        );
    });
    it('should have only sobject variables (record Update)', () => {
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
            jest.fn().mockReturnValue([store.accountSObjectVariable])
        );
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.RECORD_UPDATE,
            sObjectSelector: true
        });
        expect(menuData[1].label).toBe(sobjectVariable);
        expect(menuData[1].items).toHaveLength(1);
        expect(menuData[1].items[0].value).toEqual(
            store.accountSObjectVariable.guid
        );
    });
    it('should have only sobject collection variables  (record Update)', () => {
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
            jest.fn().mockReturnValue([store.accountSObjectCollectionVariable])
        );
        const menuData = getElementsForMenuData({
            elementType: ELEMENT_TYPE.RECORD_UPDATE,
            sObjectSelector: true
        });
        expect(menuData[1].label).toBe(sobjectCollectionVariable);
        expect(menuData[1].items).toHaveLength(1);
        expect(menuData[1].items[0].value).toEqual(
            store.accountSObjectCollectionVariable.guid
        );
    });
    it('should have dataType populated for number variable', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.numberVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.dataType).toBe('Number');
        expect(copiedElement.subtype).toBeNull();
    });
    it('should have dataType and subtype populated for sObject var', () => {
        selectorsMock.writableElementsSelector.mockReturnValue([
            store.accountSObjectVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.dataType).toBe(FLOW_DATA_TYPE.SOBJECT.value);
        expect(copiedElement.subtype).toBe('Account');
    });
    it('should have the iconName and iconSize populated', () => {
        selectorsMock.writableElementsSelector.mockReturnValueOnce([
            store.numberVariable
        ]);
        const copiedElement = getElementsForMenuData({
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            shouldBeWritable: true
        })[1].items[0];
        expect(copiedElement.iconName).toBe(
            FLOW_DATA_TYPE.NUMBER.utilityIconName
        );
        expect(copiedElement.iconSize).toBe('xx-small');
    });

    describe('disableHasNext', () => {
        it('should set hasNext to false for all menu items when true', () => {
            selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
                jest
                    .fn()
                    .mockReturnValue([
                        store.accountSObjectVariable,
                        store.accountSObjectCollectionVariable
                    ])
            );
            const menuData = getElementsForMenuData(
                {
                    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
                    sObjectSelector: true
                },
                null,
                false,
                false,
                true
            );

            expect(menuData[1].items[0].hasNext).toBeFalsy();
            expect(menuData[2].items[0].hasNext).toBeFalsy();
        });

        it('should not manipulate hasNext for all menu items when false', () => {
            selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockReturnValue(
                jest
                    .fn()
                    .mockReturnValue([
                        store.accountSObjectVariable,
                        store.accountSObjectCollectionVariable
                    ])
            );
            const menuData = getElementsForMenuData(
                {
                    elementType: ELEMENT_TYPE.RECORD_LOOKUP,
                    sObjectSelector: true
                },
                null,
                false,
                false
            );

            expect(menuData[1].items[0].hasNext).toBeFalsy();
            expect(menuData[2].items[0].hasNext).toBeTruthy();
        });
        selectorsMock.sObjectOrSObjectCollectionByEntitySelector.mockClear();
    });
    describe('RHS menuData', () => {
        it('should have active picklist values in menu data when LHS is picklist field', () => {
            selectorsMock.writableElementsSelector.mockReturnValue([
                store.accountSObjectVariable
            ]);
            // configuration for menu data retrieval
            const allowedParamTypes = null;
            const includeNewResource = false;
            const allowSObjectForFields = false;
            const disableHasNext = false;
            const activePicklistValues = ['pick1', 'pick2'];

            const menuData = getElementsForMenuData(
                {
                    elementType: ELEMENT_TYPE.ASSIGNMENT,
                    shouldBeWritable: true
                },
                allowedParamTypes,
                includeNewResource,
                allowSObjectForFields,
                disableHasNext,
                activePicklistValues
            );
            const picklistLabel =
                'FlowBuilderExpressionUtils.picklistValuesLabel';
            expect(menuData).toContainEqual(
                expect.objectContaining({ label: picklistLabel })
            );
            expect(menuData).toContainEqual(
                expect.objectContaining({ items: expect.any(Array) })
            );
        });
    });
    describe('global constants', () => {
        it('empty string should show in menuData when allowed', () => {
            // all global constants returned from selector
            selectorsMock.readableElementsSelector.mockReturnValue([
                gcObjects[gcLabels.BOOLEAN_FALSE],
                gcObjects[gcLabels.BOOLEAN_TRUE],
                gcObjects[gcLabels.EMPTY_STRING]
            ]);

            // only pass a string param for allowedParamTypes
            const menuData = getElementsForMenuData(
                { elementType: ELEMENT_TYPE.ASSIGNMENT },
                sampleStringParamTypes
            );

            // only the empty string global constant is added to the menu data
            expect(menuData).toContainEqual(
                expect.objectContaining({
                    label: LABELS.globalConstantCategory
                })
            );
            expect(menuData).toContainEqual(
                expect.objectContaining({ items: expect.any(Array) })
            );
            expect(menuData[1].items).toHaveLength(1);
        });
        it('true and false should show in menuData when allowed', () => {
            // all global constants returned from selector
            selectorsMock.readableElementsSelector.mockReturnValue([
                gcObjects[gcLabels.BOOLEAN_FALSE],
                gcObjects[gcLabels.BOOLEAN_TRUE],
                gcObjects[gcLabels.EMPTY_STRING]
            ]);

            // only pass a boolean param for allowedParamTypes
            const menuData = getElementsForMenuData(
                { elementType: ELEMENT_TYPE.ASSIGNMENT },
                sampleBooleanParamTypes
            );

            // only the boolean global constant is added to the menu data
            expect(menuData).toContainEqual(
                expect.objectContaining({
                    label: LABELS.globalConstantCategory
                })
            );
            expect(menuData).toContainEqual(
                expect.objectContaining({ items: expect.any(Array) })
            );
            expect(menuData[0].items).toHaveLength(2);
        });
    });
    describe('entities menu data', () => {
        it('uses api name for null label', () => {
            getAllEntities.mockImplementationOnce(() => {
                return require('mock/serverEntityData').mockEntitiesWithNoLabel;
            });
            const entityApiName = 'AcceptedEventRelation';
            const entitiesMenuData = getEntitiesMenuData();
            expect(entitiesMenuData).toBeDefined();
            expect(entitiesMenuData[0].displayText).toEqual(entityApiName);
            expect(entitiesMenuData[0].text).toEqual(entityApiName);
            expect(entitiesMenuData[0].subText).toEqual(entityApiName);
        });
    });

    describe('get store elements', () => {
        afterEach(() => {
            getScreenElement.mockReset();
        });
        // TODO: W-5470931 more tests for getStoreElements
        it('returns elements based on element type - source data from store alone', () => {
            selectorsMock.readableElementsSelector.mockReturnValue([
                store.outcome
            ]);
            getScreenElement.mockReturnValue(null);
            const menuData = getStoreElements(jest.fn(), {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: false
            });
            expect(menuData).toHaveLength(1);
        });

        it('returns elements based on element type - source data from store and localstorage', () => {
            selectorsMock.readableElementsSelector.mockReturnValue([
                store.outcome
            ]);
            getScreenElement.mockReturnValue(mockScreenElement);
            const menuData = getStoreElements(jest.fn(), {
                elementType: ELEMENT_TYPE.ASSIGNMENT,
                shouldBeWritable: false
            });
            expect(menuData).toHaveLength(4);
        });
    });

    describe('Filter and mutate menu data', () => {
        it('filters using data type param and returns in format combobox expects', () => {
            const menuData = filterAndMutateMenuData(
                [store.numberVariable, store.dateVariable],
                sampleNumberParamTypes
            );
            expect(menuData).toHaveLength(1);
            expect(menuData[0].items).toHaveLength(1);
            const element = menuData[0].items[0];
            expect(element.value).toBe(store.numberVariable.guid);
            expect(element.text).toBe(store.numberVariable.name);
            expect(element.subText).toBe(FLOW_DATA_TYPE.NUMBER.label);
            expect(element.displayText).toBe(
                addCurlyBraces(store.numberVariable.name)
            );
        });
        it('filters using element type', () => {
            const menuData = filterAndMutateMenuData(
                [store.stageElement, store.dateVariable],
                sampleStageParamTypes
            );
            expect(menuData).toHaveLength(1);
            expect(menuData[0].items).toHaveLength(1);
            const element = menuData[0].items[0];
            expect(element.value).toBe(store.stageElement.guid);
        });
    });

    describe('Event types menu data', () => {
        it('uses cache to fetch the data', () => {
            getEventTypesMenuData();
            const eventTypesMenuData = getEventTypesMenuData();
            expect(getEventTypes).toHaveBeenCalledTimes(1);
            expect(eventTypesMenuData).toBeDefined();
            expect(eventTypesMenuData).toHaveLength(3);
        });

        it('fetches and formats data', () => {
            const eventTypesMenuData = getEventTypesMenuData();
            expect(eventTypesMenuData).toBeDefined();
            expect(eventTypesMenuData).toHaveLength(3);
            expect(eventTypesMenuData[0].displayText).toEqual(
                platformEvent1Label
            );
            expect(eventTypesMenuData[0].text).toEqual(platformEvent1Label);
            expect(eventTypesMenuData[0].subText).toEqual(
                platformEvent1ApiName
            );
            expect(eventTypesMenuData[0].dataType).toEqual('SObject');
            expect(eventTypesMenuData[0].subtype).toEqual(
                platformEvent1ApiName
            );
        });
    });

    describe('getSecondLevelItems', () => {
        let mockSystemVariables;

        describe('system variables', () => {
            beforeEach(() => {
                setSystemVariables(systemVariables);
                mockSystemVariables = getSystemVariables();
            });
            it('calls the callback with all system variables when shouldBeWritable is false', () => {
                const callback = jest.fn();
                const mockConfig = {
                    elementType: ELEMENT_TYPE.WAIT,
                    shouldBeWritable: false
                };
                getSecondLevelItems(
                    mockConfig,
                    { subtype: SYSTEM_VARIABLE_PREFIX },
                    callback
                );
                expect(callback).toHaveBeenCalledWith(mockSystemVariables);
            });

            it('calls the callback with only writeable variables when shouldBeWritable is true', () => {
                const callback = jest.fn();
                const mockConfig = {
                    elementType: ELEMENT_TYPE.WAIT,
                    shouldBeWritable: true
                };
                getSecondLevelItems(
                    mockConfig,
                    { subtype: SYSTEM_VARIABLE_PREFIX },
                    callback
                );
                const filteredSystemVariables = callback.mock.calls[0][0];
                expect(Object.keys(filteredSystemVariables)).toHaveLength(3);
                expect(Object.keys(filteredSystemVariables)).toContain(
                    '$Flow.CurrentStage'
                );
                expect(Object.keys(filteredSystemVariables)).toContain(
                    '$Flow.ActiveStages'
                );
                expect(Object.keys(filteredSystemVariables)).toContain(
                    '$Flow.CurrentRecord'
                );
            });
        });
        it('should fetch fields for sobject variables', () => {
            const mockConfig = {
                elementType: ELEMENT_TYPE.WAIT,
                shouldBeWritable: false
            };
            getSecondLevelItems(mockConfig, parentSObjectItem, jest.fn());
            expect(getFieldsForEntity).toHaveBeenCalledTimes(1);
        });
        it('should fetch properties for apex variables', () => {
            const mockConfig = {
                elementType: ELEMENT_TYPE.WAIT,
                shouldBeWritable: false
            };
            getSecondLevelItems(mockConfig, parentApexItem, jest.fn());
            expect(getPropertiesForClass).toHaveBeenCalledTimes(1);
        });
        it('should fetch ouput parameters for LC screen field with automatic handling', async () => {
            const callback = jest.fn();
            const mockConfig = { elementType: ELEMENT_TYPE.SCREEN };
            getSecondLevelItems(
                mockConfig,
                parentLightningComponentScreenFieldItem,
                callback
            );
            await untilNoFailure(() => {
                expect(callback).toHaveBeenCalledTimes(1);
            });
            const secondLevelItems = callback.mock.calls[0][0];
            expect(Object.keys(secondLevelItems)).toEqual(
                expect.arrayContaining(['label', 'value'])
            );
        });
        it('should fetch ouput parameters for action with automatic handling', async () => {
            const callback = jest.fn();
            const mockConfig = { elementType: ELEMENT_TYPE.ACTION_CALL };
            getSecondLevelItems(mockConfig, parentActionItem, callback);
            await untilNoFailure(() => {
                expect(callback).toHaveBeenCalledTimes(1);
            });
            const secondLevelItems = callback.mock.calls[0][0];
            expect(Object.keys(secondLevelItems)).toEqual(
                expect.arrayContaining(['feedItemId'])
            );
        });
    });

    describe('getResourceTypesMenuData', () => {
        it('Get list of menu data based on the allowed resource types', () => {
            const resourceTypesMenuData = getResourceTypesMenuData();
            const expectedResourceTypes = [
                {
                    value: 'variable',
                    label: 'FlowBuilderNewResource.variableLabel'
                },
                {
                    value: 'constant',
                    label: 'FlowBuilderNewResource.constantLabel'
                },
                {
                    value: 'formula',
                    label: 'FlowBuilderNewResource.formulaLabel'
                }
            ];
            expect(resourceTypesMenuData).toHaveLength(3);
            expect(resourceTypesMenuData).toEqual(expectedResourceTypes);
        });
    });
    // TODO: write tests for gettings category once we switch to using labels
});
