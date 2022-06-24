// @ts-nocheck
import { FLOW_DATA_TYPE } from 'builder_platform_interaction/dataTypeLib';
import {
    ACTION_TYPE,
    CONNECTOR_TYPE,
    ELEMENT_TYPE,
    EntryCriteria,
    ExitCriteria,
    StageExitCriteria
} from 'builder_platform_interaction/flowMetadata';
import { InvocableAction } from 'builder_platform_interaction/invocableActionLib';
import { getElementByGuid, getElementsForElementType } from 'builder_platform_interaction/storeUtils';
import { createActionCall } from '../actionCall';
import {
    baseCanvasElement,
    baseCanvasElementsArrayToMap,
    baseChildElement,
    duplicateCanvasElementWithChildElements
} from '../base/baseElement';
import { ParameterListRowItem } from '../base/baseList';
import { baseCanvasElementMetadataObject, baseChildElementMetadataObject } from '../base/baseMetadata';
import { createInputParameter, createInputParameterMetadataObject } from '../inputParameter';
import {
    ASSIGNEE_TYPE,
    createDuplicateOrchestratedStage,
    createOrchestratedStageMetadataObject,
    createOrchestratedStageWithItemReferences,
    createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor,
    createOrchestratedStageWithItems,
    createStageStep,
    getOrchestratedStageChildren,
    getOtherItemsInOrchestratedStage,
    getStageStepChildren,
    getSteps,
    RELATED_RECORD_INPUT_PARAMETER_NAME
} from '../orchestratedStage';
import { createOutputParameter, createOutputParameterMetadataObject } from '../outputParameter';

jest.mock('builder_platform_interaction/alcCanvasUtils');
jest.mock('builder_platform_interaction/sharedUtils', () => require('builder_platform_interaction_mocks/sharedUtils'));

jest.mock('builder_platform_interaction/storeUtils', () => {
    return {
        getElementByGuid: jest.fn(),
        isExecuteOnlyWhenChangeMatchesConditionsPossible: jest.fn().mockReturnValue(true),
        getElementsForElementType: jest.fn(() => {
            return [];
        })
    };
});

const mockActionWithOutputParametersName = 'actionWithOutput';
const mockOutputParameters = [
    {
        name: 'record',
        dataType: 'sobject',
        sobjectType: 'U__record',
        isOutput: true,
        maxOccurs: 2000
    },
    {
        name: 'aNumber',
        dataType: 'double',
        isOutput: true,
        maxOccurs: 1
    }
];

const mockActionWithInputParametersName = 'actionWithInput';
const mockInputParameters = [
    {
        name: 'record',
        dataType: 'sobject',
        sobjectType: 'U__record',
        isOutput: false
    }
];

jest.mock('builder_platform_interaction/invocableActionLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/invocableActionLib');

    return Object.assign({}, actual, {
        getParametersForInvocableAction: (actionInfo) => {
            if (actionInfo.actionName === mockActionWithOutputParametersName) {
                return mockOutputParameters;
            } else if (actionInfo.actionName === mockActionWithInputParametersName) {
                return mockInputParameters;
            }

            return [];
        }
    });
});

const newOrchestratedStageGuid = 'newOrchestratedStage';
const existingOrchestratedStageGuid = 'existingOrchestratedStage';
const orchestratedStageWithChildrenGuid = 'newOrchestratedStageWithChildren';
const existingOrchestratedStageWithOneChildGuid = 'existingOrchestratedStageWithOneChild';
const existingOrchestratedStageWithChildrenGuid = 'existingOrchestratedStageWithChildren';
const existingOrchestrationStageWithDiffStepTypeChildrenGuid = 'existingOrchestrationStageWithDiffStepTypeChildren';

const existingOrchestratedStage: OrchestratedStage = {
    guid: existingOrchestratedStageGuid,
    childReferences: [{ childReference: 'existingItem1' }, { childReference: 'existingItem2' }],
    stageSteps: []
};
const existingOrchestratedStageWithOneChild = {
    guid: existingOrchestratedStageWithOneChildGuid,
    childReferences: [{ childReference: 'interactiveStep' }]
};

const existingOrchestratedStageWithChildren = {
    guid: existingOrchestratedStageWithChildrenGuid,
    childReferences: [{ childReference: 'interactiveStep' }, { childReference: 'backgroundStep' }]
};

const existingOrchestrationStageWithDiffStepTypeChildren = {
    guid: existingOrchestrationStageWithDiffStepTypeChildrenGuid,
    childReferences: [
        { childReference: 'backgroundStep' },
        { childReference: 'interactiveStep' },
        { childReference: 'neither' }
    ]
};

getElementByGuid.mockImplementation((guid) => {
    if (guid === newOrchestratedStageGuid || guid === orchestratedStageWithChildrenGuid) {
        return null;
    } else if (guid === existingOrchestratedStageGuid) {
        return existingOrchestratedStage;
    } else if (guid === existingOrchestratedStageWithChildren.guid) {
        return existingOrchestratedStageWithChildren;
    } else if (guid === existingOrchestrationStageWithDiffStepTypeChildren.guid) {
        return existingOrchestrationStageWithDiffStepTypeChildren;
    } else if (guid === 'interactiveStep') {
        return {
            guid,
            actionType: 'stepInteractive'
        };
    } else if (guid === 'backgroundStep') {
        return {
            guid,
            actionType: 'stepBackground'
        };
    } else if (guid === 'neither') {
        return {
            guid
        };
    } else if (guid === 'step1' || guid === 'step2' || guid === 'step3') {
        return {
            guid,
            label: `${guid}-label`,
            name: `${guid}-name`,
            description: `${guid}-description`,
            relatedRecordItem: <ParameterListRowItem>{
                name: `relatedRecord-${guid}`,
                rowIndex: guid,
                valueDataType: 'string'
            },
            entryAction: {
                actionName: {
                    value: null
                },
                actionType: {
                    value: null
                }
            },
            action: {
                actionName: {
                    value: 'autolaunchedFlow'
                },
                actionType: {
                    value: 'stepBackground'
                }
            },
            exitAction: {
                actionName: {
                    value: null
                },
                actionType: {
                    value: null
                }
            },
            inputParameters: [
                <ParameterListRowItem>{ name: 'ip' },
                <ParameterListRowItem>{ name: RELATED_RECORD_INPUT_PARAMETER_NAME }
            ],
            outputParameters: [<ParameterListRowItem>{ name: 'op1' }, <ParameterListRowItem>{ name: 'op2' }],
            entryActionInputParameters: [<ParameterListRowItem>jest.fn()],
            exitActionInputParameters: [<ParameterListRowItem>jest.fn()],
            assignees: [
                {
                    assignee: `assignee-${guid}`,
                    assigneeType: 'User',
                    isReference: guid === 'step1' ? true : false
                }
            ]
        };
    } else if (guid === 'stepWithNoRelatedRecord') {
        return {
            guid,
            label: `${guid}-label`,
            name: `${guid}-name`,
            description: `${guid}-description`,
            entryAction: {
                actionName: {
                    value: null
                },
                actionType: {
                    value: null
                }
            },
            action: {
                actionName: {
                    value: 'autolaunchedFlow'
                },
                actionType: {
                    value: 'stepBackground'
                }
            },
            exitAction: {
                actionName: {
                    value: null
                },
                actionType: {
                    value: null
                }
            },
            inputParameters: [<ParameterListRowItem>{ name: 'ip' }],
            outputParameters: [<ParameterListRowItem>{ name: 'op1' }, <ParameterListRowItem>{ name: 'op2' }],
            entryActionInputParameters: [<ParameterListRowItem>jest.fn()],
            exitActionInputParameters: [<ParameterListRowItem>jest.fn()],
            assignees: []
        };
    } else if (guid === '$Api') {
        return undefined;
    }

    return {
        guid
    };
});

jest.mock('../base/baseElement');
baseCanvasElement
    .mockImplementation((element) => {
        return Object.assign({}, element);
    })
    .mockName('baseCanvasElementMock');
baseChildElement
    .mockImplementation((outcome) => {
        return Object.assign({}, outcome);
    })
    .mockName('baseChildElementMock');

duplicateCanvasElementWithChildElements
    .mockImplementation(() => {
        const duplicatedElement = {};
        const duplicatedChildElements = {
            duplicatedStageStepGuid: {
                guid: 'duplicatedStageStepGuid',
                name: 'duplicatedStageStepName',
                assignees: []
            }
        };
        const updatedChildReferences = [
            {
                childReference: 'duplicatedStageStepGuid'
            }
        ];
        const availableConnections = [
            {
                type: CONNECTOR_TYPE.DEFAULT
            }
        ];

        return {
            duplicatedElement,
            duplicatedChildElements,
            updatedChildReferences,
            availableConnections
        };
    })
    .mockName('duplicateCanvasElementWithChildElementsMock');
baseChildElement
    .mockImplementation((step) => {
        return Object.assign({}, step);
    })
    .mockName('baseChildElementMock');

baseCanvasElementsArrayToMap.mockImplementation(jest.requireActual('../base/baseElement').baseCanvasElementsArrayToMap);

jest.mock('../base/baseMetadata');
baseCanvasElementMetadataObject.mockImplementation((element) => {
    return Object.assign({}, element);
});
baseChildElementMetadataObject.mockImplementation((element) => {
    return Object.assign({}, element);
});

jest.mock('../actionCall');
createActionCall.mockImplementation((action) => {
    return Object.assign({}, action);
});

jest.mock('../inputParameter');
createInputParameter.mockImplementation((p) => {
    return Object.assign({}, p);
});
createInputParameterMetadataObject.mockImplementation((p) => {
    return Object.assign({}, p);
});

jest.mock('../outputParameter');
createOutputParameter.mockImplementation((p) => {
    return Object.assign({}, p);
});
createOutputParameterMetadataObject.mockImplementation((p) => {
    return Object.assign({}, p);
});

describe('OrchestratedStage', () => {
    describe('createOrchestratedStageWithItems', () => {
        it('includes the return value of a call to baseCanvasElement', () => {
            createOrchestratedStageWithItems(existingOrchestratedStage);

            expect(baseCanvasElement).toHaveBeenCalledWith(existingOrchestratedStage);
        });

        it('element type is ORCHESTRATED_STAGE', () => {
            const orchestratedStage = createOrchestratedStageWithItems(existingOrchestratedStage);

            expect(orchestratedStage.elementType).toEqual(ELEMENT_TYPE.ORCHESTRATED_STAGE);
        });

        it('dataType is ORCHESTRATED_STAGE', () => {
            const orchestratedStage = createOrchestratedStageWithItems(existingOrchestratedStage);

            expect(orchestratedStage.dataType).toEqual(FLOW_DATA_TYPE.ORCHESTRATED_STAGE.value);
        });

        describe('items', () => {
            it('includes items for all item references present', () => {
                const childReferences = [{ childReference: 'a' }, { childReference: 'b' }, { childReference: 'c' }];

                const stage = createOrchestratedStageWithItems({ childReferences });

                expect(stage.stageSteps).toHaveLength(3);
                expect(stage.stageSteps[0].guid).toEqual(childReferences[0].childReference);
                expect(stage.stageSteps[1].guid).toEqual(childReferences[1].childReference);
                expect(stage.stageSteps[2].guid).toEqual(childReferences[2].childReference);
            });
        });

        describe('newStage exitCriteria', () => {
            it('defaults to ON_STEP_COMPLETE if not specified by existingStage and no exitAction present', () => {
                const orchestratedStage = createOrchestratedStageWithItems({});

                expect(orchestratedStage.exitCriteria).toEqual(StageExitCriteria.ON_STEP_COMPLETE);
            });

            it('is ON_DETERMINATION_COMPLETE if not specified by existingStage and exitAction is present', () => {
                const orchestratedStage = createOrchestratedStageWithItems({
                    exitAction: {
                        actionName: 'testAction'
                    }
                });

                expect(orchestratedStage.exitCriteria).toEqual(StageExitCriteria.ON_DETERMINATION_COMPLETE);
            });

            it('is the same as existingStage exitCriteria if specified', () => {
                const orchestratedStage = createOrchestratedStageWithItems({
                    exitCriteria: StageExitCriteria.ON_DETERMINATION_COMPLETE
                });

                expect(orchestratedStage.exitCriteria).toEqual(StageExitCriteria.ON_DETERMINATION_COMPLETE);
            });
        });
    });

    describe('createStageStep', () => {
        beforeEach(() => {
            baseChildElement.mockClear();
        });
        it('calls baseChildElement with elementType = StageStep', () => {
            createStageStep({
                assignees: []
            });
            expect(baseChildElement.mock.calls[0][1]).toEqual(ELEMENT_TYPE.STAGE_STEP);
        });

        it('calls baseChildElement with a step type of "Interactive Step"', () => {
            const interactiveStepLabel = 'FlowBuilderElementConfig.interactiveStepLabel';
            createStageStep({
                actionType: 'stepInteractive',
                assignees: []
            });
            expect(baseChildElement.mock.calls[0][0]).toEqual({
                actionType: 'stepInteractive',
                stepTypeLabel: interactiveStepLabel,
                assignees: []
            });
        });

        it('uses existing values when passed in an item object', () => {
            const mockItem = {
                label: 'foo',
                assignees: []
            };

            createStageStep(mockItem);

            expect(baseChildElement.mock.calls[0][0]).toMatchObject(mockItem);
        });

        it('uses existing action if provided', () => {
            const mockItem = {
                action: {
                    actionName: {
                        value: 'autolaunchedFlow'
                    },
                    actionType: {
                        value: 'stepBackground'
                    }
                },
                assignees: []
            };

            const item = createStageStep(mockItem);

            expect(item.action).toEqual(createActionCall(mockItem.action));
        });

        it('uses existing input parameters if provided', () => {
            const mockItem = {
                inputParameters: [<InvocableAction>jest.fn()],
                assignees: []
            };

            const item = createStageStep(mockItem);

            expect(item.inputParameters).toHaveLength(1);
            expect(item.inputParameters[0]).toEqual(createInputParameter(mockItem.inputParameters[0]));
        });

        it('uses existing output parameters if provided', () => {
            const mockItem = {
                outputParameters: [<InvocableAction>jest.fn()],
                assignees: []
            };

            const item = createStageStep(mockItem);

            expect(item.outputParameters).toHaveLength(1);
            expect(item.outputParameters[0]).toEqual(createOutputParameter(mockItem.outputParameters[0]));
        });

        describe('config', () => {
            it('uses default if not provided', () => {
                const mockItem = {
                    assignees: []
                };

                const item = createStageStep(mockItem);

                expect(item.config).toEqual({
                    isSelected: false,
                    isHighlighted: false,
                    isSelectable: true,
                    hasError: false
                });
            });
            it('uses existing if provided', () => {
                const mockItem = {
                    config: jest.fn(),
                    assignees: []
                };

                const item = createStageStep(mockItem);

                expect(item.config).toEqual(mockItem.config);
            });
        });

        describe('assignees', () => {
            it('contains a single assignee of type User and value null if not provided and is interactive step', () => {
                const mockItem = {
                    actionType: ACTION_TYPE.STEP_INTERACTIVE
                };

                const item = createStageStep(mockItem);

                expect(item.assignees).toHaveLength(1);
                expect(item.assignees[0].assignee).toBeNull();
                expect(item.assignees[0].assigneeType).toEqual(ASSIGNEE_TYPE.User);
            });
            it('contains no assignees if not provided and is background step', () => {
                const mockItem = {
                    actionType: ACTION_TYPE.STEP_BACKGROUND
                };

                const item = createStageStep(mockItem);

                expect(item.assignees).toHaveLength(0);
            });
            describe('user', () => {
                it('string values are set if provided', () => {
                    const mockItem = {
                        assignees: [
                            {
                                assignee: {
                                    stringValue: 'foo'
                                },
                                assigneeType: 'User'
                            }
                        ]
                    };

                    const item = createStageStep(mockItem);

                    expect(item.assignees).toHaveLength(1);
                    expect(item.assignees[0].assignee).toEqual(mockItem.assignees[0].assignee.stringValue);
                    expect(item.assignees[0].assigneeType).toEqual(mockItem.assignees[0].assigneeType);
                    expect(item.assignees[0]?.isReference).toBeFalsy();
                });

                it('element reference are set if provided', () => {
                    const mockItem = {
                        assignees: [
                            {
                                assignee: {
                                    elementReference: '$Api.Enterprise_Server_URL_140'
                                },
                                assigneeType: 'User'
                            }
                        ]
                    };

                    const item = createStageStep(mockItem);

                    expect(item.assignees).toHaveLength(1);
                    expect(item.assignees[0].assignee).toEqual(mockItem.assignees[0].assignee.elementReference);
                    expect(item.assignees[0].assigneeType).toEqual(mockItem.assignees[0].assigneeType);
                    expect(item.assignees[0]?.isReference).toBeTruthy();
                });
            });
        });
        describe('relatedRecordItem', () => {
            it('is set from existing relatedRecordItem if present', () => {
                const mockItem = {
                    relatedRecordItem: { value: 'foo' }
                };
                const item = createStageStep(mockItem);

                expect(item.relatedRecordItem).toEqual(mockItem.relatedRecordItem);
            });
            it('is set from input param if present and not falsy', () => {
                const mockItem = {
                    inputParameters: [
                        { name: 'someInputParam1', value: { value: '1' } },
                        { name: RELATED_RECORD_INPUT_PARAMETER_NAME, value: { value: 'someValue' } },
                        { name: 'someInputParam2', value: { value: '2' } }
                    ]
                };
                const item = createStageStep(mockItem);

                expect(item.relatedRecordItem).toEqual(mockItem.inputParameters[1]);
            });
            describe('is empty', () => {
                it('if no existing relatedRecordItem', () => {
                    const mockItem = {};
                    const item = createStageStep(mockItem);

                    expect(item.relatedRecordItem).toEqual({});
                });
                it('if input parameter is falsy', () => {
                    const mockItem = {
                        inputParameters: [
                            { name: 'someInputParam1', value: { value: '1' } },
                            { name: RELATED_RECORD_INPUT_PARAMETER_NAME, value: '' },
                            { name: 'someInputParam2', value: { value: '2' } }
                        ]
                    };

                    const item = createStageStep(mockItem);

                    expect(item.relatedRecordItem).toEqual({});
                });
            });
        });

        describe('entryCriteria', () => {
            it('defaults to ON_STAGE_START if not specified by existing step and no entryAction present', () => {
                const newStep = createStageStep({});

                expect(newStep.entryCriteria).toEqual(EntryCriteria.ON_STAGE_START);
            });

            it('is ON_DETERMINATION_COMPLETE if not specified by existing step and entryAction is present', () => {
                const newStep = createStageStep({
                    entryAction: {
                        actionName: 'testAction'
                    },
                    entryConditions: [{ leftHandSide: { value: 'nonexistentItem.Status' } }]
                });

                expect(newStep.entryCriteria).toEqual(EntryCriteria.ON_DETERMINATION_COMPLETE);
            });

            it('is ON_STEP_COMPLETE if not specified by existing step, entryAction is not present, and entryConditions are present', () => {
                const newStep = createStageStep({
                    entryConditions: [{ leftHandSide: { value: 'nonexistentItem.Status' } }]
                });

                expect(newStep.entryCriteria).toEqual(EntryCriteria.ON_STEP_COMPLETE);
            });

            it('is the same as existing step entryCriteria if specified', () => {
                const newStep = createStageStep({
                    entryCriteria: EntryCriteria.ON_STEP_COMPLETE
                });

                expect(newStep.entryCriteria).toEqual(EntryCriteria.ON_STEP_COMPLETE);
            });
        });

        describe('exitCriteria', () => {
            it('defaults to ON_STEP_COMPLETE if not specified by existing step and no exitAction present', () => {
                const newStep = createStageStep({});

                expect(newStep.exitCriteria).toEqual(ExitCriteria.ON_STEP_COMPLETE);
            });

            it('is ON_DETERMINATION_COMPLETE if not specified by existing step and exitAction is present', () => {
                const newStep = createStageStep({
                    exitAction: {
                        actionName: 'testAction'
                    }
                });

                expect(newStep.exitCriteria).toEqual(ExitCriteria.ON_DETERMINATION_COMPLETE);
            });

            it('is the same as existing step exitCriteria if specified', () => {
                const newStep = createStageStep({
                    exitCriteria: ExitCriteria.ON_DETERMINATION_COMPLETE
                });

                expect(newStep.exitCriteria).toEqual(ExitCriteria.ON_DETERMINATION_COMPLETE);
            });
        });
    });

    describe('createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor', () => {
        let orchestratedStageFromPropertyEditor;

        beforeEach(() => {
            orchestratedStageFromPropertyEditor = {
                guid: newOrchestratedStageGuid,
                exitActionInputParameters: [],
                stageSteps: [
                    {
                        guid: 'item1',
                        entryConditions: [],
                        assignees: []
                    }
                ]
            };
        });

        it('includes the return value of a call to baseCanvasElement', () => {
            createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor(
                orchestratedStageFromPropertyEditor
            );

            expect(baseCanvasElement).toHaveBeenCalledWith(orchestratedStageFromPropertyEditor);
        });

        it('element type is ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS', () => {
            const result = createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor(
                orchestratedStageFromPropertyEditor
            );

            expect(result.elementType).toEqual(ELEMENT_TYPE.ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS);
        });

        it('canvas element type is ORCHESTRATED_STAGE', () => {
            const result = createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor(
                orchestratedStageFromPropertyEditor
            );

            expect(result.canvasElement.elementType).toEqual(ELEMENT_TYPE.ORCHESTRATED_STAGE);
        });

        it('canvas element dataType is ORCHESTRATED_STAGE', () => {
            const result = createOrchestratedStageWithItemReferencesWhenUpdatingFromPropertyEditor(
                orchestratedStageFromPropertyEditor
            );

            expect(result.canvasElement.dataType).toEqual(FLOW_DATA_TYPE.ORCHESTRATED_STAGE.value);
        });
    });

    describe('createOrchestratedStageWithItemReferences', () => {
        let orchestratedStageFromFlow;

        beforeEach(() => {
            orchestratedStageFromFlow = {
                guid: existingOrchestratedStageGuid,
                stageSteps: [
                    {
                        name: 'step1',
                        guid: 'step1',
                        assignees: [
                            {
                                assignee: null,
                                assigneeType: 'User',
                                isReference: false
                            }
                        ]
                    },
                    {
                        name: 'step2',
                        guid: 'step2',
                        assignees: [
                            {
                                assignee: null,
                                assigneeType: 'User',
                                isReference: false
                            }
                        ]
                    },
                    {
                        name: 'step3',
                        guid: 'step3',
                        assignees: [
                            {
                                assignee: null,
                                assigneeType: 'User',
                                isReference: false
                            }
                        ]
                    }
                ]
            };
        });

        it('includes the return value of a call to baseCanvasElement', () => {
            createOrchestratedStageWithItemReferences(orchestratedStageFromFlow);

            expect(baseCanvasElement).toHaveBeenCalledWith(orchestratedStageFromFlow);
        });

        it('element type is ORCHESTRATED_STAGE', () => {
            const result = createOrchestratedStageWithItemReferences(orchestratedStageFromFlow);

            const orchestratedStage = result.elements[existingOrchestratedStageGuid];
            expect(orchestratedStage.elementType).toEqual(ELEMENT_TYPE.ORCHESTRATED_STAGE);
        });

        it('maxConnections = 1', () => {
            const result = createOrchestratedStageWithItemReferences(orchestratedStageFromFlow);

            const orchestratedStage = result.elements[existingOrchestratedStageGuid];
            expect(orchestratedStage.maxConnections).toEqual(1);
        });

        describe('StageSteps', () => {
            it('includes childReferences for all items present', () => {
                const result = createOrchestratedStageWithItemReferences(orchestratedStageFromFlow);
                const orchestratedStage = result.elements[existingOrchestratedStageGuid];

                expect(orchestratedStage.childReferences).toHaveLength(3);
                expect(orchestratedStage.childReferences[0].childReference).toEqual(
                    orchestratedStageFromFlow.stageSteps[0].guid
                );
                expect(orchestratedStage.childReferences[1].childReference).toEqual(
                    orchestratedStageFromFlow.stageSteps[1].guid
                );
                expect(orchestratedStage.childReferences[2].childReference).toEqual(
                    orchestratedStageFromFlow.stageSteps[2].guid
                );
            });

            it('are included in element map for all stageSteps present', () => {
                const result = createOrchestratedStageWithItemReferences(orchestratedStageFromFlow);

                expect(result.elements[orchestratedStageFromFlow.stageSteps[0].guid]).toMatchObject(
                    orchestratedStageFromFlow.stageSteps[0]
                );
                expect(result.elements[orchestratedStageFromFlow.stageSteps[1].guid]).toMatchObject(
                    orchestratedStageFromFlow.stageSteps[1]
                );
                expect(result.elements[orchestratedStageFromFlow.stageSteps[2].guid]).toMatchObject(
                    orchestratedStageFromFlow.stageSteps[2]
                );
            });
        });

        it('maps received exitActionInputParameters to UI inputParameters', () => {
            const exitActionInputParameter = {
                name: 'Param',
                value: {
                    stringValue: 'testValue'
                }
            };

            const orchestratedStageFromFlowWithInputParams = {
                ...orchestratedStageFromFlow,
                exitActionInputParameters: [exitActionInputParameter]
            };

            createOrchestratedStageWithItemReferences(orchestratedStageFromFlowWithInputParams);

            expect(createInputParameter).toHaveBeenCalledWith(exitActionInputParameter);
        });
    });
    describe('createOrchestratedStageMetadataObject', () => {
        let orchestratedStageFromStore;

        beforeEach(() => {
            orchestratedStageFromStore = {
                guid: existingOrchestratedStageGuid,
                childReferences: [
                    {
                        childReference: 'step1'
                    },
                    {
                        childReference: 'step2'
                    },
                    {
                        childReference: 'step3'
                    }
                ],
                exitAction: {
                    actionName: null,
                    actionType: null
                },
                exitActionInputParameters: [<ParameterListRowItem>jest.fn()]
            };
        });

        it('includes the return value of a call to baseCanvasElementMetadataObject', () => {
            createOrchestratedStageMetadataObject(orchestratedStageFromStore);

            expect(baseCanvasElementMetadataObject).toHaveBeenCalledWith(orchestratedStageFromStore, {});
        });

        describe('exit criteria', () => {
            it('default to when all stageSteps are completed', () => {
                const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);
                expect(orchestratedStage.exitConditions).toEqual(undefined);
            });
        });

        describe('stageSteps', () => {
            it('are included for all child references present', () => {
                const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);

                expect(orchestratedStage.stageSteps).toHaveLength(3);
                expect(orchestratedStage.stageSteps[0].guid).toEqual(
                    orchestratedStageFromStore.childReferences[0].childReference
                );
                expect(orchestratedStage.stageSteps[0].label).toEqual(`${orchestratedStage.stageSteps[0].guid}-label`);
                expect(orchestratedStage.stageSteps[0].name).toEqual(`${orchestratedStage.stageSteps[0].guid}-name`);
                expect(orchestratedStage.stageSteps[0].description).toEqual(
                    `${orchestratedStage.stageSteps[0].guid}-description`
                );
                expect(orchestratedStage.stageSteps[0].inputParameters).toHaveLength(2);
                expect(orchestratedStage.stageSteps[0].inputParameters[0]).toEqual(
                    createInputParameterMetadataObject(orchestratedStage.stageSteps[0].inputParameters[0])
                );

                expect(orchestratedStage.stageSteps[1].guid).toEqual(
                    orchestratedStageFromStore.childReferences[1].childReference
                );
                expect(orchestratedStage.stageSteps[1].label).toEqual(`${orchestratedStage.stageSteps[1].guid}-label`);
                expect(orchestratedStage.stageSteps[1].name).toEqual(`${orchestratedStage.stageSteps[1].guid}-name`);
                expect(orchestratedStage.stageSteps[1].description).toEqual(
                    `${orchestratedStage.stageSteps[1].guid}-description`
                );
                expect(orchestratedStage.stageSteps[1].inputParameters).toHaveLength(2);
                expect(orchestratedStage.stageSteps[1].inputParameters[0]).toEqual(
                    createInputParameterMetadataObject(orchestratedStage.stageSteps[1].inputParameters[0])
                );

                expect(orchestratedStage.stageSteps[2].guid).toEqual(
                    orchestratedStageFromStore.childReferences[2].childReference
                );
                expect(orchestratedStage.stageSteps[2].label).toEqual(`${orchestratedStage.stageSteps[2].guid}-label`);
                expect(orchestratedStage.stageSteps[2].name).toEqual(`${orchestratedStage.stageSteps[2].guid}-name`);
                expect(orchestratedStage.stageSteps[2].description).toEqual(
                    `${orchestratedStage.stageSteps[2].guid}-description`
                );
                expect(orchestratedStage.stageSteps[2].inputParameters).toHaveLength(2);
                expect(orchestratedStage.stageSteps[2].inputParameters[0]).toEqual(
                    createInputParameterMetadataObject(orchestratedStage.stageSteps[2].inputParameters[0])
                );
            });

            describe('assignee', () => {
                it('used  ferovDataType STRING if not a reference', () => {
                    const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);
                    expect(orchestratedStage.stageSteps[1].assignees).toEqual([
                        {
                            assignee: {
                                stringValue: `assignee-${orchestratedStage.stageSteps[1].guid}`
                            },
                            assigneeType: 'User'
                        }
                    ]);
                });
                it('used  ferovDataType REFERENCE if a reference', () => {
                    const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);
                    expect(orchestratedStage.stageSteps[0].assignees).toEqual([
                        {
                            assignee: {
                                elementReference: `assignee-${orchestratedStage.stageSteps[0].guid}`
                            },
                            assigneeType: 'User'
                        }
                    ]);
                });
            });

            describe('related record', () => {
                it('is injected in to the action inputs if present', () => {
                    const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);

                    expect(orchestratedStage.stageSteps[0].inputParameters).toHaveLength(2);
                    expect(orchestratedStage.stageSteps[0].inputParameters[1]).toEqual(
                        orchestratedStage.stageSteps[0].relatedRecordItem
                    );

                    expect(orchestratedStage.stageSteps[1].inputParameters).toHaveLength(2);
                    expect(orchestratedStage.stageSteps[1].inputParameters[1]).toEqual(
                        orchestratedStage.stageSteps[1].relatedRecordItem
                    );

                    expect(orchestratedStage.stageSteps[2].inputParameters).toHaveLength(2);
                    expect(orchestratedStage.stageSteps[2].inputParameters[1]).toEqual(
                        orchestratedStage.stageSteps[2].relatedRecordItem
                    );
                });

                it('is not inject in to the action inputs if not present', () => {
                    orchestratedStageFromStore.childReferences = [
                        {
                            childReference: 'stepWithNoRelatedRecord'
                        }
                    ];

                    const orchestratedStage = createOrchestratedStageMetadataObject(orchestratedStageFromStore);

                    expect(orchestratedStage.stageSteps[0].inputParameters).toHaveLength(1);
                    expect(orchestratedStage.stageSteps[0].inputParameters[0]).toEqual({
                        name: 'ip'
                    });
                });
            });
        });
    });

    describe('getSteps', () => {
        const interactiveStepLabel = 'FlowBuilderElementConfig.interactiveStepLabel';
        const backgroundStepLabel = 'FlowBuilderElementConfig.backgroundStepLabel';

        it('returns all items for the OrchestratedStage', () => {
            const data = getSteps(existingOrchestratedStageWithChildren.guid);
            expect(data).toHaveLength(2);
            expect(getElementByGuid).toHaveBeenCalledTimes(3);
            expect(getElementByGuid.mock.calls[1][0]).toEqual(
                existingOrchestratedStageWithChildren.childReferences[0].childReference
            );
            expect(getElementByGuid.mock.calls[2][0]).toEqual(
                existingOrchestratedStageWithChildren.childReferences[1].childReference
            );
        });

        it('sets the label to Interactive Step for worksteps', () => {
            const data = getSteps(existingOrchestratedStageWithChildren.guid);
            expect(data[0].stepTypeLabel).toEqual(interactiveStepLabel);
            expect(data[1].stepTypeLabel).toEqual(backgroundStepLabel);
        });

        it('sets the label to steps appropriately', () => {
            const data = getSteps(existingOrchestrationStageWithDiffStepTypeChildren.guid);
            expect(data[0].stepTypeLabel).toEqual(backgroundStepLabel);
            expect(data[1].stepTypeLabel).toEqual(interactiveStepLabel);
            expect(data[2].stepTypeLabel).toEqual(null);
        });
    });

    describe('getOtherItemsInOrchestratedStage', () => {
        it('throws an error if no parent found', () => {
            const nonexistantGuid: UI.Guid = 'foo';

            expect(() => {
                getOtherItemsInOrchestratedStage(nonexistantGuid);
            }).toThrow(`No parent OrchestratedStage found for StageStep ${nonexistantGuid}`);
        });

        it('returns an empty array if the only step is the selected one', () => {
            getElementsForElementType.mockImplementation(() => {
                return [existingOrchestratedStageWithOneChild];
            });

            const data = getOtherItemsInOrchestratedStage('interactiveStep');

            expect(data).toHaveLength(0);
        });

        it('returns all other children', () => {
            getElementsForElementType.mockImplementation(() => {
                return [existingOrchestratedStageWithChildren];
            });

            const data = getOtherItemsInOrchestratedStage('interactiveStep');

            expect(data).toHaveLength(1);
            expect(data[0]).toMatchObject({ guid: 'backgroundStep' });
        });
    });

    describe('createDuplicateOrchestratedStage function', () => {
        const { duplicatedElement, duplicatedChildElements } = createDuplicateOrchestratedStage(
            {},
            'duplicatedGuid',
            'duplicatedName',
            {},
            {}
        );

        it('duplicatedElement has updated childReferences', () => {
            expect(duplicatedElement.childReferences).toEqual([
                {
                    childReference: 'duplicatedStageStepGuid'
                }
            ]);
        });
        it('duplicatedElement has updated availableConnections', () => {
            expect(duplicatedElement.availableConnections).toEqual([
                {
                    type: CONNECTOR_TYPE.DEFAULT
                }
            ]);
        });
        it('returns correct duplicatedChildElements', () => {
            expect(duplicatedChildElements).toEqual({
                duplicatedStageStepGuid: {
                    guid: 'duplicatedStageStepGuid',
                    name: 'duplicatedStageStepName',
                    assignees: []
                }
            });
        });
    });

    describe('getStageStepChildren', () => {
        let step;
        beforeEach(() => {
            step = {
                entryAction: {
                    actionName: {
                        value: null
                    },
                    actionType: {
                        value: null
                    }
                },
                action: {
                    actionName: {
                        value: 'autolaunchedFlow'
                    },
                    actionType: {
                        value: 'stepBackground'
                    }
                },
                exitAction: {
                    actionName: {
                        value: null
                    },
                    actionType: {
                        value: null
                    }
                },
                outputParameters: []
            };
        });

        it('includes status', () => {
            const data = getStageStepChildren(step);

            expect(data.Status).toMatchObject({
                name: 'Status',
                apiName: 'Status',
                dataType: 'String'
            });
        });
        describe('Outputs', () => {
            it('returns existing outputs if already present', () => {
                step.outputParameters = [
                    {
                        name: 'foo',
                        apiName: 'foo',
                        dataType: 'string',
                        subtype: 'Account',
                        valueDataType: 'string',
                        label: 'foo',
                        isCollection: true
                    }
                ];
                const data = getStageStepChildren(step);
                expect(step.outputParameters[0]).toMatchObject(
                    data.Outputs.getChildrenItems()[step.outputParameters[0].apiName]
                );
                expect(data.Outputs.subtype).toEqual(step.action.actionName);
            });
            it('not present if no parameters', () => {
                const data = getStageStepChildren(step);
                expect(Object.keys(data)).toHaveLength(1);
                expect(data.Status).toBeTruthy();
            });
            it('not present if no actionName', () => {
                step.action.actionName = undefined;
                const data = getStageStepChildren(step);
                expect(Object.keys(data)).toHaveLength(1);
                expect(data.Status).toBeTruthy();
            });
            it('not present if no output parameters', () => {
                step.action.actionName = mockActionWithInputParametersName;
                const data = getStageStepChildren(step);
                expect(Object.keys(data)).toHaveLength(1);
                expect(data.Status).toBeTruthy();
            });

            it('is present if there are output parameters', () => {
                step.action = {
                    actionName: mockActionWithOutputParametersName,
                    actionType: ACTION_TYPE.STEP_INTERACTIVE
                };

                const data = getStageStepChildren(step);
                expect(Object.keys(data)).toHaveLength(2);
                expect(data.Outputs).toMatchObject({
                    name: 'Outputs',
                    apiName: 'Outputs',
                    dataType: FLOW_DATA_TYPE.ACTION_OUTPUT.value,
                    isSpanningAllowed: true
                });
            });
            it('getChildrenItems returns output parameters', () => {
                step.action = {
                    actionName: mockActionWithOutputParametersName,
                    actionType: ACTION_TYPE.STEP_INTERACTIVE
                };

                const data = getStageStepChildren(step);
                const outputChildren = data.Outputs.getChildrenItems();
                expect(Object.keys(outputChildren)).toHaveLength(2);
                expect(outputChildren.record).toMatchObject({
                    name: 'record',
                    apiName: 'record',
                    dataType: 'SObject',
                    isCollection: true
                });
                expect(outputChildren.aNumber).toMatchObject({
                    name: 'aNumber',
                    apiName: 'aNumber',
                    dataType: 'Number'
                });
            });
        });
    });

    it('getOrchestratedStageChildren returns only status', () => {
        const stage = {};

        const data = getOrchestratedStageChildren(stage);

        expect(data.Status).toMatchObject({
            name: 'Status',
            apiName: 'Status',
            dataType: 'String'
        });
    });
});
