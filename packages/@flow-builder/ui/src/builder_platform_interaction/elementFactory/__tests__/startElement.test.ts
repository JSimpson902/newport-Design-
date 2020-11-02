// @ts-nocheck
import { getElementByGuid, shouldUseAutoLayoutCanvas } from 'builder_platform_interaction/storeUtils';
import {
    shouldSupportTimeTriggers,
    createStartElementForPropertyEditor,
    createStartElementWithConnectors,
    createStartElementMetadataObject,
    createTimeTrigger,
    createStartElementWhenUpdatingFromPropertyEditor
} from '../startElement';
import { baseCanvasElementMetadataObject, baseChildElementMetadataObject } from '../base/baseMetadata';
import {
    CONDITION_LOGIC,
    FLOW_TRIGGER_SAVE_TYPE,
    FLOW_TRIGGER_TYPE,
    START_ELEMENT_LOCATION,
    CONNECTOR_TYPE,
    TIME_OPTION,
    SCHEDULED_PATH_TIME_SOURCE_TYPE,
    SCHEDULED_PATH_OFFSET_UNIT
} from 'builder_platform_interaction/flowMetadata';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { baseChildElement, baseCanvasElement } from '../base/baseElement';
import { getConnectionProperties } from '../commonFactoryUtils/decisionAndWaitConnectionPropertiesUtil';
import { TimeTrigger } from 'builder_platform_interaction/flowModel';
import { LABELS } from '../elementFactoryLabels';

const startElementReference = 'assignment1';

const MOCK_GUID = 'mockGuid';

const MOCK_NAMES = {
    name1: 'abc',
    name2: 'cdf',
    name3: 'def'
};

const newStartElementGuid = 'newStart';
const existingStartElementGuid = 'existingStart';
const startElementWithChildrenGuid = 'newStartWithChildren';
const existingStartElementWithChildrenGuid = 'existingStartWithChildren';

const existingStartElement = {
    guid: existingStartElementGuid,
    childReferences: [{ childReference: 'existingTrigger1' }, { childReference: 'existingTrigger2' }]
};
const existingStartElementWithChildren = {
    guid: existingStartElementWithChildrenGuid,
    childReferences: [{ childReference: 'existingTrigger1' }, { childReference: 'existingTrigger2' }],
    children: ['screen1', 'screen2', null]
};

jest.mock('builder_platform_interaction/storeLib', () => require('builder_platform_interaction_mocks/storeLib'));

jest.mock('builder_platform_interaction/storeUtils', () => ({
    getProcessType: jest.fn(),
    shouldUseAutoLayoutCanvas: jest.fn(),
    getElementByGuid: jest.fn()
}));

jest.mock('../base/baseMetadata');

baseCanvasElementMetadataObject.mockImplementation((element) => {
    return Object.assign({}, element);
});

baseChildElementMetadataObject.mockImplementation((child) => {
    let name;
    if (child.name === MOCK_NAMES.name1) {
        name = MOCK_NAMES.name1;
    } else if (child.name === MOCK_NAMES.name2) {
        name = MOCK_NAMES.name2;
    } else {
        name = MOCK_NAMES.name3;
    }
    return {
        name
    };
});

getElementByGuid.mockImplementation((guid) => {
    if (guid === newStartElementGuid || guid === startElementWithChildrenGuid) {
        return null;
    } else if (guid === existingStartElementGuid) {
        return existingStartElement;
    } else if (guid === existingStartElementWithChildrenGuid) {
        return existingStartElementWithChildren;
    } else if (guid === MOCK_NAMES.name1) {
        return {
            name: MOCK_NAMES.name1,
            offsetNumber: 20,
            offsetUnit: TIME_OPTION.DAYS_AFTER,
            timeSource: 'abc'
        };
    } else if (guid === MOCK_NAMES.name2) {
        return {
            name: MOCK_NAMES.name2,
            offsetNumber: 20,
            offsetUnit: TIME_OPTION.DAYS_BEFORE,
            timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT
        };
    } else if (guid === MOCK_NAMES.name3) {
        return {
            name: MOCK_NAMES.name3,
            offsetNumber: 20,
            offsetUnit: TIME_OPTION.HOURS_BEFORE,
            timeSource: 'abc'
        };
    }
    return {
        guid
    };
});

jest.mock('../base/baseElement', () => {
    return Object.assign(jest.requireActual('../base/baseElement'), {
        baseChildElement: jest.fn(),
        baseCanvasElement: jest.fn()
    });
});
baseChildElement
    .mockImplementation((timeTrigger) => {
        return Object.assign({}, timeTrigger);
    })
    .mockName('baseChildElementMock');
baseCanvasElement
    .mockImplementation((element) => {
        return Object.assign({}, element);
    })
    .mockName('baseCanvasElementMock');

jest.mock('../commonFactoryUtils/decisionAndWaitConnectionPropertiesUtil');
getConnectionProperties.mockImplementation(() => {
    return {
        connectorCount: 1,
        availableConnections: [
            {
                type: CONNECTOR_TYPE.IMMEDIATE
            }
        ]
    };
});

describe('Start element', () => {
    const storeLib = require('builder_platform_interaction/storeLib');
    storeLib.generateGuid = jest.fn().mockReturnValue(MOCK_GUID);
    describe('shouldSupportTimeTriggers function', () => {
        describe('When triggerType is AFTER_SAVE', () => {
            let startElement;

            beforeEach(() => {
                startElement = {
                    triggerType: FLOW_TRIGGER_TYPE.AFTER_SAVE
                };
            });

            it('No object is defined', () => {
                expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
            });

            describe('recordTriggerType is Create', () => {
                beforeEach(() => {
                    startElement.object = 'Account';
                    startElement.recordTriggerType = FLOW_TRIGGER_SAVE_TYPE.CREATE;
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });
            });

            describe('recordTriggerType is Update', () => {
                beforeEach(() => {
                    startElement.object = 'Account';
                    startElement.recordTriggerType = FLOW_TRIGGER_SAVE_TYPE.UPDATE;
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });
            });

            describe('recordTriggerType is CreateAndUpdate', () => {
                beforeEach(() => {
                    startElement.object = 'Account';
                    startElement.recordTriggerType = FLOW_TRIGGER_SAVE_TYPE.CREATE_AND_UPDATE;
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });

                it('filterLogic is no conditions and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is true', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = true;
                    expect(shouldSupportTimeTriggers(startElement)).toBeTruthy();
                });

                it('filterLogic is "and" and doesRequireRecordChangedToMeetCriteria is false', () => {
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.doesRequireRecordChangedToMeetCriteria = false;
                    expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
                });
            });
        });

        it('When triggerType is BEFORE_SAVE', () => {
            const startElement = {
                triggerType: FLOW_TRIGGER_TYPE.BEFORE_SAVE,
                recordTriggerType: FLOW_TRIGGER_SAVE_TYPE.CREATE,
                object: 'Account'
            };
            expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
        });

        it('When triggerType is BEFORE_DELETE', () => {
            const startElement = {
                triggerType: FLOW_TRIGGER_TYPE.BEFORE_DELETE,
                recordTriggerType: FLOW_TRIGGER_SAVE_TYPE.DELETE,
                object: 'Account'
            };
            expect(shouldSupportTimeTriggers(startElement)).toBeFalsy();
        });
    });

    describe('createStartElement function', () => {
        let startElement = {
            locationX: START_ELEMENT_LOCATION.x,
            locationY: START_ELEMENT_LOCATION.y,
            objectContainer: 'MarketAudience',
            triggerType: 'None',
            recordTriggerType: undefined
        };
        let expectedResult = {
            locationX: START_ELEMENT_LOCATION.x,
            locationY: START_ELEMENT_LOCATION.y,
            filters: [
                {
                    leftHandSide: '',
                    operator: '',
                    rightHandSide: '',
                    rightHandSideDataType: '',
                    rowIndex: MOCK_GUID
                }
            ],
            filterLogic: CONDITION_LOGIC.AND,
            elementType: 'START_ELEMENT',
            maxConnections: 1,
            triggerType: 'None',
            recordTriggerType: undefined
        };
        it('with empty base start element object', () => {
            expect.assertions(1);
            const actualResult = createStartElementForPropertyEditor();
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with empty base start element object and triggerType = RecordBeforeSave', () => {
            expect.assertions(1);
            startElement.triggerType = 'RecordBeforeSave';
            expectedResult.triggerType = 'RecordBeforeSave';
            expectedResult.recordTriggerType = 'Create';
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with empty base start element object and triggerType = RecordAfterSave', () => {
            expect.assertions(1);
            startElement.triggerType = 'RecordAfterSave';
            expectedResult.triggerType = 'RecordAfterSave';
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with empty base start element object and triggerType = RecordBeforeDelete', () => {
            expect.assertions(1);
            startElement.triggerType = 'RecordBeforeDelete';
            expectedResult.triggerType = 'RecordBeforeDelete';
            expectedResult.recordTriggerType = 'Delete';
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with empty base start element object and triggerType = Scheduled', () => {
            expect.assertions(1);
            startElement.triggerType = 'Scheduled';
            expectedResult.triggerType = 'Scheduled';
            expectedResult.recordTriggerType = undefined;
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });

        it('with non-empty start element object', () => {
            expect.assertions(1);
            startElement = {
                locationX: 10,
                locationY: 20,
                filterLogic: CONDITION_LOGIC.AND,
                filters: [
                    {
                        field: 'Name',
                        operator: 'EqualTo',
                        value: {
                            stringValue: 'myAccount'
                        }
                    }
                ],
                object: 'Account',
                objectContainer: 'MarketAudience',
                triggerType: 'scheduled',
                frequency: 'hourly',
                startDate: '1/1/2001',
                startTime: '18:00:00'
            };
            expectedResult = {
                locationX: 10,
                locationY: 20,
                filterLogic: 'and',
                filters: [
                    {
                        leftHandSide: 'Account.Name',
                        operator: 'EqualTo',
                        rightHandSide: 'myAccount',
                        rightHandSideDataType: 'String',
                        rowIndex: MOCK_GUID
                    }
                ],
                object: 'Account',
                objectContainer: 'MarketAudience',
                triggerType: 'scheduled',
                frequency: 'hourly',
                startDate: '1/1/2001',
                startTime: '18:00:00',
                elementType: 'START_ELEMENT',
                maxConnections: 1
            };
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });

        it('with no filter type specified on the start element object', () => {
            expect.assertions(1);
            startElement = {
                locationX: 10,
                locationY: 20,
                filters: [],
                object: 'Account',
                triggerType: 'scheduled',
                schedule: {
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00'
                }
            };
            expectedResult = {
                locationX: 10,
                locationY: 20,
                filterLogic: 'no_conditions',
                filters: [
                    {
                        leftHandSide: '',
                        operator: '',
                        rightHandSide: '',
                        rightHandSideDataType: '',
                        rowIndex: MOCK_GUID
                    }
                ],
                object: 'Account',
                triggerType: 'scheduled',
                frequency: 'hourly',
                startDate: '1/1/2001',
                startTime: '18:00:00',
                elementType: 'START_ELEMENT',
                maxConnections: 1
            };
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with non-empty start element object when trigger type is RecordAfterSave and recordTriggerType is set and no child references', () => {
            expect.assertions(1);
            startElement = {
                locationX: START_ELEMENT_LOCATION.x,
                locationY: START_ELEMENT_LOCATION.y,
                objectContainer: 'MarketAudience',
                triggerType: 'RecordAfterSave',
                recordTriggerType: 'Create'
            };
            expectedResult = {
                locationX: START_ELEMENT_LOCATION.x,
                locationY: START_ELEMENT_LOCATION.y,
                filters: [
                    {
                        leftHandSide: '',
                        operator: '',
                        rightHandSide: '',
                        rightHandSideDataType: '',
                        rowIndex: MOCK_GUID
                    }
                ],
                filterLogic: CONDITION_LOGIC.AND,
                elementType: 'START_ELEMENT',
                maxConnections: 1,
                triggerType: 'RecordAfterSave',
                recordTriggerType: 'Create',
                timeTriggers: [
                    {
                        offsetUnit: '',
                        timeSource: '',
                        offsetNumber: ''
                    }
                ]
            };
            const actualResult = createStartElementForPropertyEditor(startElement);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('with non-empty start element object when trigger type is RecordAfterSave and recordTriggerType is set and 3 child references', () => {
            expect.assertions(4);
            const childReferences = [
                { childReference: MOCK_GUID },
                { childReference: MOCK_GUID },
                { childReference: MOCK_GUID }
            ];

            const testStartElement = createStartElementForPropertyEditor({
                childReferences,
                triggerType: 'RecordAfterSave',
                recordTriggerType: 'Create'
            });

            expect(testStartElement.timeTriggers).toHaveLength(3);
            expect(testStartElement.timeTriggers[0].guid).toEqual(childReferences[0].childReference);
            expect(testStartElement.timeTriggers[1].guid).toEqual(childReferences[1].childReference);
            expect(testStartElement.timeTriggers[2].guid).toEqual(childReferences[2].childReference);
        });
    });

    describe('createTimeTrigger', () => {
        beforeEach(() => {
            baseChildElement.mockClear();
        });
        it('calls baseChildElement with elementType = TimeTrigger and an empty time trigger by default', () => {
            expect.assertions(2);
            createTimeTrigger(<TimeTrigger>{});
            expect(baseChildElement.mock.calls[0][0]).toEqual({});
            expect(baseChildElement.mock.calls[0][1]).toEqual(ELEMENT_TYPE.TIME_TRIGGER);
        });

        it('uses existing values when passed in a time trigger object', () => {
            expect.assertions(2);
            const existingTimeTrigger = {
                name: 'Trigger1',
                offsetUnit: TIME_OPTION.DAYS_BEFORE,
                timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT,
                offsetNumber: '20'
            };

            const newTimeTrigger = createTimeTrigger(existingTimeTrigger);

            expect(baseChildElement.mock.calls[0][0]).toEqual(existingTimeTrigger);
            expect(newTimeTrigger).toMatchObject(existingTimeTrigger);
        });
    });

    describe('createStartElementWithConnector function', () => {
        let startElementFromFlow;
        beforeEach(() => {
            startElementFromFlow = {
                triggerType: undefined,
                guid: existingStartElementGuid,
                scheduledPaths: [
                    {
                        name: MOCK_NAMES.name1,
                        guid: MOCK_NAMES.name1,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.DAYS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT,
                        offsetNumber: -20,
                        recordField: undefined
                    },
                    {
                        name: MOCK_NAMES.name2,
                        guid: MOCK_NAMES.name2,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.HOURS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT,
                        offsetNumber: 20,
                        recordField: undefined
                    },
                    {
                        name: MOCK_NAMES.name3,
                        guid: MOCK_NAMES.name3,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.DAYS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_FIELD,
                        offsetNumber: 20,
                        recordField: 'ABC'
                    }
                ]
            };
        });
        it('includes the return value of a call to baseCanvasElement', () => {
            expect.assertions(1);
            createStartElementWithConnectors(startElementFromFlow);

            expect(baseCanvasElement).toHaveBeenCalledWith(startElementFromFlow);
        });

        it('element type is START ELEMENT', () => {
            expect.assertions(1);
            const result = createStartElementWithConnectors(startElementFromFlow);

            const startElement = result.elements[existingStartElementGuid];
            expect(startElement.elementType).toEqual(ELEMENT_TYPE.START_ELEMENT);
        });

        it('returns new start element with connector having target as start element reference', () => {
            expect.assertions(1);
            const { connectors } = createStartElementWithConnectors({}, startElementReference);
            const target = connectors[0].target;
            expect(target).toBe(startElementReference);
        });

        it('returns new start element with connector using connector from base start element object', () => {
            expect.assertions(1);
            const { connectors } = createStartElementWithConnectors({
                connector: { targetReference: 'foo' }
            });
            const target = connectors[0].target;
            expect(target).toBe('foo');
        });

        it('returns empty start element when null is passed in', () => {
            expect.assertions(6);
            const result = createStartElementWithConnectors();
            expect(result.childReferences).toBe(undefined);
            expect(result.availableConnections).toBe(undefined);
            expect(result.connectors).toBeDefined();
            expect(result.elements).toBeDefined();
            const startElement = result.elements[undefined];
            expect(startElement.elementType).toEqual(ELEMENT_TYPE.START_ELEMENT);
            expect(startElement.triggerType).toEqual('None');
        });

        describe('time triggers', () => {
            it('childReferences and availableConnections are not present on start for non record triggered flow', () => {
                expect.assertions(2);
                startElementFromFlow.triggerType = 'Scheduled';
                const result = createStartElementWithConnectors(startElementFromFlow);
                expect(result.childReferences).toBe(undefined);
                expect(result.availableConnections).toBe(undefined);
            });
            it('start element includes child references for all scheduled paths present for Record Trigger Flows', () => {
                expect.assertions(4);
                startElementFromFlow.triggerType = 'RecordAfterSave';
                const result = createStartElementWithConnectors(startElementFromFlow);
                const startElement = result.elements[existingStartElementGuid];
                expect(startElement.childReferences).toHaveLength(3);
                expect(startElement.childReferences[0].childReference).toEqual(
                    startElementFromFlow.scheduledPaths[0].guid
                );
                expect(startElement.childReferences[1].childReference).toEqual(
                    startElementFromFlow.scheduledPaths[1].guid
                );
                expect(startElement.childReferences[2].childReference).toEqual(
                    startElementFromFlow.scheduledPaths[2].guid
                );
            });

            it('start element includes immediate connector in availableConnections for Record Trigger Flows', () => {
                expect.assertions(2);
                startElementFromFlow.triggerType = 'RecordAfterSave';
                const result = createStartElementWithConnectors(startElementFromFlow);
                const startElement = result.elements[existingStartElementGuid];
                expect(startElement.availableConnections).toHaveLength(4);
                expect(startElement.availableConnections[3].type).toEqual('IMMEDIATE');
            });

            it('are included in element map for all scheduled paths present', () => {
                expect.assertions(3);
                startElementFromFlow.triggerType = 'RecordAfterSave';
                const result = createStartElementWithConnectors(startElementFromFlow);
                expect(result.elements[startElementFromFlow.scheduledPaths[0].guid]).toMatchObject({
                    name: MOCK_NAMES.name1,
                    guid: MOCK_NAMES.name1,
                    offsetUnit: TIME_OPTION.DAYS_BEFORE,
                    timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT,
                    offsetNumber: '20'
                });
                expect(result.elements[startElementFromFlow.scheduledPaths[1].guid]).toMatchObject({
                    name: MOCK_NAMES.name2,
                    guid: MOCK_NAMES.name2,
                    offsetUnit: TIME_OPTION.HOURS_AFTER,
                    timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT,
                    offsetNumber: '20'
                });
                expect(result.elements[startElementFromFlow.scheduledPaths[2].guid]).toMatchObject({
                    name: MOCK_NAMES.name3,
                    guid: MOCK_NAMES.name3,
                    offsetUnit: TIME_OPTION.DAYS_AFTER,
                    timeSource: 'ABC',
                    offsetNumber: '20'
                });
            });
            it('first connector from Start is of IMMEDIATE connector type with immediate connector label for Record Trigger Flow', () => {
                expect.assertions(2);
                startElementFromFlow.triggerType = 'RecordAfterSave';
                startElementFromFlow.connector = {
                    targetReference: MOCK_NAMES.name1
                };
                const result = createStartElementWithConnectors(startElementFromFlow);
                expect(result.connectors[0].label).toEqual(LABELS.immediateConnectorLabel);
                expect(result.connectors[0].type).toEqual(CONNECTOR_TYPE.IMMEDIATE);
            });
        });
    });

    describe('createStartElementWhenUpdatingFromPropertyEditor', () => {
        const shouldUseFlc = (useFlc) => {
            shouldUseAutoLayoutCanvas.mockImplementation(() => {
                return useFlc;
            });
        };

        let startElementFromPropertyEditor;
        let newStartElement;
        let startElementFromPropertyEditorWithChildren;
        let existingStartElementFromPropertyEditorWithChildren;

        beforeEach(() => {
            shouldUseFlc(false);

            startElementFromPropertyEditor = {
                guid: newStartElementGuid,
                timeTriggers: [
                    {
                        guid: 'trigger1',
                        name: 'abc'
                    }
                ],
                triggerType: 'RecordAfterSave'
            };

            newStartElement = {
                elementType: 'START_ELEMENT',
                triggerType: 'RecordAfterSave'
            };

            startElementFromPropertyEditorWithChildren = {
                guid: startElementWithChildrenGuid,
                timeTriggers: [
                    {
                        guid: 'trigger1',
                        name: 'abc'
                    }
                ],
                triggerType: 'RecordAfterSave',
                children: null
            };

            existingStartElementFromPropertyEditorWithChildren = {
                guid: existingStartElementWithChildrenGuid,
                timeTriggers: [
                    {
                        guid: 'existingTrigger1',
                        name: 'abc'
                    }
                ],
                triggerType: 'RecordAfterSave',
                children: ['screen1', 'screen2', null]
            };
        });

        it('includes the return value of a call to baseCanvasElement', () => {
            expect.assertions(1);

            createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);

            expect(baseCanvasElement).toHaveBeenCalledWith(startElementFromPropertyEditor);
        });

        it('calls createStartElement if the start element has not been created', () => {
            expect.assertions(1);
            const startElementWithoutGuid = {
                triggerType: 'RecordAfterSave'
            };
            const expectedResult = {
                locationX: START_ELEMENT_LOCATION.x,
                locationY: START_ELEMENT_LOCATION.y,
                filters: [
                    {
                        leftHandSide: '',
                        operator: '',
                        rightHandSide: '',
                        rightHandSideDataType: '',
                        rowIndex: MOCK_GUID
                    }
                ],
                filterLogic: CONDITION_LOGIC.AND,
                elementType: 'START_ELEMENT',
                maxConnections: 1,
                triggerType: 'RecordAfterSave',
                recordTriggerType: 'Create'
            };
            const actualResult = createStartElementWhenUpdatingFromPropertyEditor(startElementWithoutGuid);
            expect(actualResult).toMatchObject(expectedResult);
        });
        it('creates start element without available connections if not Record Triggered Flow', () => {
            expect.assertions(1);
            const testStartElement = {
                locationX: 10,
                locationY: 20,
                filters: [],
                object: 'Account',
                triggerType: 'Scheduled',
                schedule: {
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00'
                }
            };
            const actualResult = createStartElementWhenUpdatingFromPropertyEditor(testStartElement);
            expect(actualResult.availableConnections).toEqual(undefined);
        });

        it('element type is START WITH MODIFIED AND DELETED TIME TRIGGERS', () => {
            expect.assertions(1);
            const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);

            expect(result.elementType).toEqual(ELEMENT_TYPE.START_WITH_MODIFIED_AND_DELETED_TIME_TRIGGERS);
        });

        it('Start element type is START_ELEMENT', () => {
            expect.assertions(1);
            const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);

            expect(result.canvasElement.elementType).toEqual(ELEMENT_TYPE.START_ELEMENT);
        });

        it('initializes children correctly for new start element with children', () => {
            expect.assertions(1);
            shouldUseFlc(true);
            const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditorWithChildren);

            expect(result.canvasElement.children).toEqual([null, null]);
        });
        it('Should not fail if timeTriggers is undefined', () => {
            expect.assertions(1);
            startElementFromPropertyEditor.timeTriggers = undefined;
            shouldUseFlc(true);
            const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);

            expect(result.canvasElement.children).toEqual([null]);
        });

        describe('connection properties of a start element for record triggered flow', () => {
            it('result has availableConnections', () => {
                expect.assertions(3);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.availableConnections).toHaveLength(1);
                expect(result.canvasElement.maxConnections).toEqual(2);
                expect(result.canvasElement.availableConnections[0]).toEqual({
                    type: CONNECTOR_TYPE.IMMEDIATE
                });
            });

            it('result has availableConnections of immediate for a new flow', () => {
                expect.assertions(2);
                const result = createStartElementWhenUpdatingFromPropertyEditor(newStartElement);
                expect(result.availableConnections).toHaveLength(1);
                expect(result.availableConnections[0]).toEqual({
                    type: CONNECTOR_TYPE.IMMEDIATE
                });
            });
            it('result has only 1 available connection (IMMEDIATE) and 1 maxConnections for a start element with blank time trigger and no connections', () => {
                expect.assertions(3);
                const startElementWithBlankTimeTrigger = {
                    guid: newStartElementGuid,
                    timeTriggers: [
                        {
                            guid: MOCK_GUID,
                            elementType: ELEMENT_TYPE.TIME_TRIGGER,
                            name: '',
                            label: '',
                            offsetNumber: '',
                            offsetUnit: '',
                            timeSource: ''
                        }
                    ],
                    triggerType: 'RecordAfterSave'
                };
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementWithBlankTimeTrigger);
                expect(result.canvasElement.availableConnections).toHaveLength(1);
                expect(result.canvasElement.maxConnections).toEqual(1);
                expect(result.canvasElement.availableConnections[0]).toEqual({
                    type: CONNECTOR_TYPE.IMMEDIATE
                });
            });

            it('has connectorCount', () => {
                expect.assertions(1);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.connectorCount).toEqual(1);
            });

            it('start element has the right maxConnections', () => {
                expect.assertions(1);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.maxConnections).toEqual(2);
            });
        });

        describe('new/modified timeTriggers', () => {
            let timeTriggers;
            beforeEach(() => {
                timeTriggers = [
                    { guid: 'a', name: MOCK_NAMES.name1 },
                    { guid: 'b', name: MOCK_NAMES.name2 },
                    { guid: 'c', name: MOCK_NAMES.name3 }
                ];
                startElementFromPropertyEditor.timeTriggers = timeTriggers;
            });
            it('start element includes timeTrigger child references for all timeTriggers present', () => {
                expect.assertions(4);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.childReferences).toHaveLength(3);
                expect(result.canvasElement.childReferences[0].childReference).toEqual(timeTriggers[0].guid);
                expect(result.canvasElement.childReferences[1].childReference).toEqual(timeTriggers[1].guid);
                expect(result.canvasElement.childReferences[2].childReference).toEqual(timeTriggers[2].guid);
            });
            it('includes timeTriggers for all timeTriggers present', () => {
                expect.assertions(4);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.childElements).toHaveLength(3);
                expect(result.childElements[0].guid).toEqual(timeTriggers[0].guid);
                expect(result.childElements[1].guid).toEqual(timeTriggers[1].guid);
                expect(result.childElements[2].guid).toEqual(timeTriggers[2].guid);
            });
            it('has the right maxConnections', () => {
                expect.assertions(1);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.maxConnections).toEqual(4);
            });
        });

        describe('deleted time triggers', () => {
            beforeEach(() => {
                startElementFromPropertyEditor = {
                    guid: existingStartElementGuid,
                    triggerType: 'RecordAfterSave',
                    timeTriggers: [
                        {
                            guid: 'trigger1',
                            name: MOCK_NAMES.name1
                        }
                    ]
                };
            });

            it('start element does not include time trigger child references for deleted time triggers', () => {
                expect.assertions(2);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.childReferences).toHaveLength(1);
                expect(result.canvasElement.childReferences[0].childReference).toEqual(
                    startElementFromPropertyEditor.timeTriggers[0].guid
                );
            });

            it('includes all deleted time triggers', () => {
                expect.assertions(3);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.deletedChildElementGuids).toHaveLength(2);
                expect(result.deletedChildElementGuids[0]).toEqual(
                    existingStartElement.childReferences[0].childReference
                );
                expect(result.deletedChildElementGuids[1]).toEqual(
                    existingStartElement.childReferences[1].childReference
                );
            });

            it('has the right maxConnections', () => {
                expect.assertions(1);
                const result = createStartElementWhenUpdatingFromPropertyEditor(startElementFromPropertyEditor);
                expect(result.canvasElement.maxConnections).toEqual(2);
            });

            it('updates children property for existing start element with children', () => {
                expect.assertions(1);
                shouldUseFlc(true);
                const result = createStartElementWhenUpdatingFromPropertyEditor(
                    existingStartElementFromPropertyEditorWithChildren
                );
                expect(result.canvasElement.children).toEqual(['screen1', null]);
            });

            it('deletedBranchHeadGuids should include "screen2" for existing start element with children', () => {
                expect.assertions(1);
                shouldUseFlc(true);
                const result = createStartElementWhenUpdatingFromPropertyEditor(
                    existingStartElementFromPropertyEditorWithChildren
                );
                expect(result.deletedBranchHeadGuids).toEqual(['screen2']);
            });
        });
    });

    describe('createStartElementMetadataObject function', () => {
        it('calls baseCanvasElementMetadataObject function', () => {
            expect.assertions(1);
            const startElement = {};
            createStartElementMetadataObject(startElement);

            expect(baseCanvasElementMetadataObject).toHaveBeenCalledWith(startElement, {});
        });

        it('creates start element metadata object', () => {
            expect.assertions(1);
            const startElement = {
                filterLogic: CONDITION_LOGIC.NO_CONDITIONS,
                filters: [],
                object: 'Account',
                objectContainer: 'MarketAudience',
                triggerType: 'scheduled',
                frequency: 'hourly',
                startDate: '1/1/2001',
                startTime: '18:00:00'
            };

            const expectedResult = {
                name: undefined,
                description: undefined,
                label: undefined,
                filters: [],
                filterLogic: undefined,
                object: 'Account',
                objectContainer: 'MarketAudience',
                triggerType: 'scheduled',
                schedule: {
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00'
                }
            };
            const actualResult = createStartElementMetadataObject(startElement);

            expect(actualResult).toMatchObject(expectedResult);
        });

        it('creates start element metadata object for delete', () => {
            expect.assertions(1);
            const startElement = {
                filterLogic: CONDITION_LOGIC.NO_CONDITIONS,
                filters: [],
                object: 'Account',
                objectContainer: undefined,
                triggerType: FLOW_TRIGGER_TYPE.BEFORE_DELETE,
                frequency: undefined,
                startDate: undefined,
                startTime: undefined,
                recordTriggerType: FLOW_TRIGGER_SAVE_TYPE.DELETE
            };

            const expectedResult = {
                name: undefined,
                description: undefined,
                label: undefined,
                filters: [],
                filterLogic: undefined,
                object: 'Account',
                objectContainer: undefined,
                triggerType: FLOW_TRIGGER_TYPE.BEFORE_DELETE,
                recordTriggerType: FLOW_TRIGGER_SAVE_TYPE.DELETE,
                schedule: undefined
            };
            const actualResult = createStartElementMetadataObject(startElement);

            expect(actualResult).toMatchObject(expectedResult);
        });

        it('creates start element metadata object with filters', () => {
            expect.assertions(1);
            const startElement = {
                filterLogic: '1 AND 2 OR 3',
                filters: [
                    {
                        leftHandSide: 'Account.Name',
                        operator: 'EqualTo',
                        rightHandSide: 'myAccount',
                        rightHandSideDataType: 'String',
                        rowIndex: MOCK_GUID
                    },
                    {
                        leftHandSide: 'Account.NumberOfEmployees',
                        operator: 'EqualTo',
                        rightHandSide: '5',
                        rightHandSideDataType: 'Number',
                        rowIndex: MOCK_GUID
                    },
                    {
                        leftHandSide: 'Account.Name',
                        operator: 'EqualTo',
                        rightHandSide: 'yourAccount',
                        rightHandSideDataType: 'String',
                        rowIndex: MOCK_GUID
                    }
                ],
                object: 'Account',
                triggerType: 'scheduled',
                frequency: 'hourly',
                startDate: '1/1/2001',
                startTime: '18:00:00'
            };

            const expectedResult = {
                name: undefined,
                description: undefined,
                label: undefined,
                filters: [
                    {
                        field: 'Name',
                        operator: 'EqualTo',
                        value: {
                            stringValue: 'myAccount'
                        }
                    },
                    {
                        field: 'NumberOfEmployees',
                        operator: 'EqualTo',
                        value: {
                            numberValue: '5'
                        }
                    },
                    {
                        field: 'Name',
                        operator: 'EqualTo',
                        value: {
                            stringValue: 'yourAccount'
                        }
                    }
                ],
                filterLogic: '1 AND 2 OR 3',
                object: 'Account',
                triggerType: 'scheduled',
                schedule: {
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00'
                }
            };
            const actualResult = createStartElementMetadataObject(startElement);

            expect(actualResult).toMatchObject(expectedResult);
        });

        it('creates start element metadata object with no schedule set', () => {
            expect.assertions(1);
            const startElement = {
                filterLogic: 'and',
                filters: [
                    {
                        leftHandSide: 'Account.Name',
                        operator: 'EqualTo',
                        rightHandSide: 'myAccount',
                        rightHandSideDataType: 'String',
                        rowIndex: MOCK_GUID
                    }
                ],
                object: 'Account',
                triggerType: 'invoked'
            };

            const expectedResult = {
                name: undefined,
                description: undefined,
                label: undefined,
                filterLogic: 'and',
                filters: [
                    {
                        field: 'Name',
                        operator: 'EqualTo',
                        value: {
                            stringValue: 'myAccount'
                        }
                    }
                ],
                object: 'Account',
                triggerType: 'invoked',
                schedule: undefined
            };
            const actualResult = createStartElementMetadataObject(startElement);

            expect(actualResult).toMatchObject(expectedResult);
        });
        describe('creates start element metadata object from element', () => {
            let startElement;
            beforeEach(() => {
                startElement = {
                    filterLogic: undefined,
                    filters: [],
                    object: 'Account',
                    objectContainer: undefined,
                    triggerType: 'RecordBeforeSave',
                    recordTriggerType: 'Create',
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00',
                    timeTriggers: undefined,
                    childReferences: undefined
                };
            });
            const expectedStartElement = {
                name: undefined,
                description: undefined,
                label: undefined,
                filters: [],
                filterLogic: undefined,
                object: 'Account',
                objectContainer: undefined,
                triggerType: 'RecordBeforeSave',
                recordTriggerType: 'Create',
                schedule: {
                    frequency: 'hourly',
                    startDate: '1/1/2001',
                    startTime: '18:00:00'
                }
            };

            const filters = [
                {
                    leftHandSide: 'Account.Name',
                    operator: 'EqualTo',
                    rightHandSide: 'myAccount',
                    rightHandSideDataType: 'String',
                    rowIndex: MOCK_GUID
                },
                {
                    leftHandSide: 'Account.NumberOfEmployees',
                    operator: 'EqualTo',
                    rightHandSide: '5',
                    rightHandSideDataType: 'Number',
                    rowIndex: MOCK_GUID
                },
                {
                    leftHandSide: 'Account.Name',
                    operator: 'EqualTo',
                    rightHandSide: 'yourAccount',
                    rightHandSideDataType: 'String',
                    rowIndex: MOCK_GUID
                }
            ];

            describe('time triggers', () => {
                it('start element includes time triggers for all time trigger child references present', () => {
                    expect.assertions(4);
                    startElement.childReferences = [
                        {
                            childReference: MOCK_NAMES.name1
                        },
                        {
                            childReference: MOCK_NAMES.name2
                        },
                        {
                            childReference: MOCK_NAMES.name3
                        }
                    ];
                    const actualResult = createStartElementMetadataObject(startElement);

                    expect(actualResult.scheduledPaths).toHaveLength(3);
                    expect(actualResult.scheduledPaths[0]).toMatchObject({
                        name: MOCK_NAMES.name1,
                        offsetNumber: 20,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.DAYS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_FIELD,
                        recordField: 'abc'
                    });
                    expect(actualResult.scheduledPaths[1]).toMatchObject({
                        name: MOCK_NAMES.name2,
                        offsetNumber: -20,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.DAYS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_TRIGGER_EVENT
                    });

                    expect(actualResult.scheduledPaths[2]).toMatchObject({
                        name: MOCK_NAMES.name3,
                        offsetNumber: -20,
                        offsetUnit: SCHEDULED_PATH_OFFSET_UNIT.HOURS,
                        timeSource: SCHEDULED_PATH_TIME_SOURCE_TYPE.RECORD_FIELD,
                        recordField: 'abc'
                    });
                });
            });
            describe('With filter logic = no_conditions', () => {
                it('should have filterLogic = undefined', () => {
                    expect.assertions(1);
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    const actualResult = createStartElementMetadataObject(startElement);

                    expect(actualResult).toMatchObject(expectedStartElement);
                });
            });
            describe('With filter logic = no_conditions and filters ', () => {
                it('should have filterLogic = undefined', () => {
                    expect.assertions(1);
                    startElement.filterLogic = CONDITION_LOGIC.NO_CONDITIONS;
                    startElement.filters = filters;

                    const actualResult = createStartElementMetadataObject(startElement);
                    expect(actualResult).toMatchObject(expectedStartElement);
                });
            });
            describe('With filter logic = "and" and no filters ', () => {
                it('should have filterLogic = undefined', () => {
                    expect.assertions(1);
                    startElement.filterLogic = CONDITION_LOGIC.AND;
                    startElement.filters = undefined;

                    const actualResult = createStartElementMetadataObject(startElement);
                    expect(actualResult).toMatchObject(expectedStartElement);
                });
            });
        });
    });
});
