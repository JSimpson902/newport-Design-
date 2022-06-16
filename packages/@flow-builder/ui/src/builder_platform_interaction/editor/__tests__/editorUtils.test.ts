// @ts-nocheck
import { sanitizeDevName } from 'builder_platform_interaction/commonUtils';
import { CHILD_REFERENCES, MAX_API_NAME_LENGTH, MAX_LABEL_LENGTH } from 'builder_platform_interaction/elementFactory';
import { SaveFlowEvent } from 'builder_platform_interaction/events';
import {
    CONNECTOR_TYPE,
    ELEMENT_TYPE as mockElementType,
    FLOW_TRIGGER_TYPE
} from 'builder_platform_interaction/flowMetadata';
import { SaveType } from 'builder_platform_interaction/saveType';
import { commonUtils, loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { deepCopy } from 'builder_platform_interaction/storeLib';
import * as flowWithAllElements from 'mock/flows/flowWithAllElements.json';
import { HeaderConfig } from '../../contextLib/contextLib';
import { LABELS } from '../editorLabels';
import {
    badgeClass,
    badgeStatus,
    childElementLabelToNameConverter,
    debugInterviewResponseCallback,
    decorateLabelsAndApiNames,
    dedupeLabel,
    flowPropertiesCallback,
    generateDefaultLabel,
    getConnectorsToHighlight,
    getConnectorToDuplicate,
    getCopiedChildElements,
    getCopiedData,
    getDuplicateElementGuidMaps,
    getElementsToBeDeleted,
    getElementsWithError,
    getPasteElementGuidMaps,
    getSaveType,
    highlightCanvasElement,
    isDebugInterviewInError,
    logElementCreation,
    saveAsFlowCallback,
    screenFieldsReferencedByLoops,
    setFlowErrorsAndWarnings,
    shiftFocusFromCanvas,
    shiftFocusFromToolbar,
    showLabel,
    updateStoreAfterSaveAsNewFlowIsFailed,
    updateStoreAfterSaveAsNewVersionIsFailed,
    updateStoreAfterSaveFlowIsSuccessful,
    updateUrl
} from '../editorUtils';

const { logInteraction } = loggingUtils;

jest.mock('builder_platform_interaction/selectors', () => {
    return {
        canvasSelector: jest.fn().mockImplementation(() => {
            return [
                {
                    guid: 'canvasElement1',
                    elementType: mockElementType.ASSIGNMENT,
                    config: {
                        isSelected: true,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement2',
                    elementType: mockElementType.DECISION,
                    config: {
                        isSelected: false,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement3',
                    elementType: mockElementType.ASSIGNMENT,
                    config: {
                        isSelected: true,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement4',
                    elementType: mockElementType.ASSIGNMENT,
                    config: {
                        isSelected: false,
                        isHighlighted: false
                    }
                }
            ];
        })
    };
});

jest.mock('builder_platform_interaction/actions', () => {
    return {
        deleteElements: jest.fn().mockImplementation((payload) => {
            return {
                type: 'deleteElement',
                payload
            };
        }),
        updatePropertiesAfterSaving: jest.fn().mockImplementation((payload) => {
            return {
                type: 'updatePropertiesAfterSaving',
                payload
            };
        }),
        updatePropertiesAfterSaveFailed: jest.fn().mockImplementation((payload) => {
            return {
                type: 'updatePropertiesAfterSaveFailed',
                payload
            };
        }),
        updateProperties: jest.fn().mockImplementation((payload) => {
            return {
                type: 'updateProperties',
                payload
            };
        }),
        updateElement: jest.fn().mockImplementation((payload) => {
            return {
                type: 'updateElement',
                payload
            };
        }),
        highlightOnCanvas: jest.fn().mockImplementation((payload) => {
            return {
                type: 'highlightOnCanvas',
                payload
            };
        }),
        decorateCanvas: jest.fn().mockImplementation((payload) => {
            return {
                type: 'decorateCanvas',
                payload
            };
        }),
        clearCanvasDecoration: {
            type: 'clearCanvasDecoration'
        }
    };
});

jest.mock('builder_platform_interaction/usedByLib', () => {
    return {
        usedBy: jest.fn().mockImplementation(() => {
            return [];
        })
    };
});

jest.mock('builder_platform_interaction/drawingLib', () => require('builder_platform_interaction_mocks/drawingLib'));

jest.mock('builder_platform_interaction/propertyEditorFactory', () => {
    return {
        getElementForStore: jest.fn().mockImplementation(() => {
            return {
                name: 'flowProperties'
            };
        })
    };
});

jest.mock('builder_platform_interaction/storeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/storeLib');
    return {
        deepCopy: actual.deepCopy,
        generateGuid: jest.fn().mockImplementation(() => {
            return 'rand_guid';
        })
    };
});

jest.mock('builder_platform_interaction/apexTypeLib', () => {
    return {
        setApexClasses: jest.fn()
    };
});

jest.mock('builder_platform_interaction/processTypeLib', () => {
    const actual = jest.requireActual('builder_platform_interaction/processTypeLib');

    return {
        isConfigurableStartSupported: jest.fn().mockImplementation(() => {
            return true;
        }),
        isScheduledPathSupported: jest.fn(),
        isOrchestrator: actual.isOrchestrator
    };
});

jest.mock('builder_platform_interaction/expressionUtils', () => {
    return {
        getFlowSystemVariableComboboxItem: jest.fn().mockImplementation(() => {
            return [];
        }),
        getGlobalVariableTypeComboboxItems: jest.fn().mockImplementation(() => {
            return [];
        })
    };
});

jest.mock('builder_platform_interaction/elementConfig', () => {
    return {
        getConfigForElementType: jest.fn().mockImplementation((elementType) => {
            if (elementType === mockElementType.START_ELEMENT) {
                return {
                    canBeDuplicated: false,
                    isDeletable: false
                };
            } else if (elementType === mockElementType.DECISION) {
                return {
                    areChildElementsSupported: true,
                    labels: {
                        singular: 'Decision'
                    }
                };
            } else if (elementType === mockElementType.WAIT || elementType === mockElementType.SCREEN) {
                return {
                    areChildElementsSupported: true
                };
            } else if (elementType === mockElementType.ORCHESTRATED_STAGE) {
                return {
                    labels: {
                        singular: 'Stage'
                    }
                };
            } else if (elementType === mockElementType.STAGE_STEP) {
                return {
                    labels: {
                        singular: 'Step'
                    }
                };
            } else if (elementType === mockElementType.RECORD_CREATE) {
                return {
                    labels: {
                        singular: 'Create Records'
                    }
                };
            }
            return {};
        }),
        isChildElement: jest.fn().mockImplementation((elementType) => {
            if (elementType === mockElementType.STAGE_STEP) {
                return true;
            }
            return false;
        })
    };
});

jest.mock('builder_platform_interaction/storeUtils', () => {
    return {
        getElementByDevName: jest.fn().mockImplementation((devName) => {
            return {
                guid: devName
            };
        }),
        getStartElement: jest.fn().mockImplementation(() => {
            return {
                guid: 'startGuid'
            };
        }),
        getProcessType: jest.fn(),
        getElementsForElementType: jest.fn().mockImplementation((elementType) => {
            if (mockElementType.ORCHESTRATED_STAGE === elementType) {
                // return empty object to stand in for created but unlabelled element to be auto labeled
                return [
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,9)' },
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,10)' },
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,11)' },
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,17)' },
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,19)' },
                    { label: 'FlowBuilderElementConfig.defaultFlowElementName(Stage,26)' },
                    {}
                ];
            }
            if (mockElementType.RECORD_CREATE === elementType) {
                return [{}];
            }
            if (mockElementType.DECISION === elementType) {
                return [
                    {
                        label: 'FlowBuilderElementConfig.defaultFlowElementName(Decision,1)',
                        name: 'FlowBuilderElementConfig.defaultFlowElementName(Decision,1)'
                    },
                    {
                        label: 'over written label',
                        name: 'FlowBuilderElementConfig.defaultFlowElementName(Decision,3)'
                    }
                ];
            }
            return [];
        }),
        getElementByGuid: jest.fn().mockImplementation(() => {})
    };
});

jest.mock('builder_platform_interaction/sharedUtils', () => require('builder_platform_interaction_mocks/sharedUtils'));
const canvasElement1 = {
    guid: 'canvasElement1',
    elementType: mockElementType.ASSIGNMENT,
    config: {
        isSelected: true,
        isHighlighted: false
    }
};

const canvasElement2 = {
    guid: 'canvasElement2',
    elementType: mockElementType.DECISION,
    config: {
        isSelected: false,
        isHighlighted: false
    }
};
const canvasElement3 = {
    guid: 'canvasElement3',
    elementType: mockElementType.ASSIGNMENT,
    config: {
        isSelected: true,
        isHighlighted: false
    }
};

describe('Editor Utils Test', () => {
    describe('getElementsToBeDeleted function', () => {
        let storeInstance;
        let dispatch;
        let getCurrentState;

        beforeEach(() => {
            dispatch = jest.fn();
            getCurrentState = jest.fn().mockImplementation(() => {
                return {
                    elements: {
                        startElement: {
                            guid: 'startElement',
                            elementType: mockElementType.START_ELEMENT,
                            config: {
                                isSelected: true,
                                isHighlighted: false
                            }
                        },
                        canvasElement1,
                        canvasElement2,
                        canvasElement3,
                        canvasElement4: {
                            guid: 'canvasElement4',
                            elementType: mockElementType.ASSIGNMENT,
                            config: {
                                isSelected: false,
                                isHighlighted: false
                            }
                        }
                    },
                    connectors: [
                        {
                            source: 'canvasElement2',
                            target: 'canvasElement3',
                            config: {
                                isSelected: false
                            }
                        },
                        {
                            source: 'canvasElement3',
                            target: 'canvasElement4',
                            config: {
                                isSelected: false
                            }
                        },
                        {
                            source: 'canvasElement2',
                            target: 'canvasElement4',
                            config: {
                                isSelected: true
                            }
                        },
                        {
                            source: 'startElement',
                            target: 'canvasElement4',
                            config: {
                                isSelected: true
                            }
                        }
                    ]
                };
            });

            storeInstance = {
                dispatch,
                getCurrentState
            };
        });

        it('dispatch deleteElement action with only one element when isMultiElementDelete is false and no connectors are involved', () => {
            const selectedElementGUID = ['canvasElement1'];
            const selectedElementType = mockElementType.ASSIGNMENT;

            const payload = {
                selectedElements: [canvasElement1],
                connectorsToDelete: [],
                elementType: mockElementType.ASSIGNMENT
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID,
                selectedElementType
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });

        it('dispatch deleteElement action with only one element when isMultiElementDelete is false, no connectors are involved and childIndexToKeep is 1', () => {
            const selectedElementGUID = ['canvasElement1'];
            const selectedElementType = mockElementType.ASSIGNMENT;

            const payload = {
                selectedElements: [canvasElement1],
                connectorsToDelete: [],
                elementType: mockElementType.ASSIGNMENT,
                childIndexToKeep: 1
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID,
                selectedElementType,
                childIndexToKeep: 1
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });

        it('dispatch deleteElement action when childIndexToKeep is 0 results in the dispatch also having childIndexToKeep as 0 W-11296861', () => {
            const selectedElementGUID = ['canvasElement1'];
            const selectedElementType = mockElementType.DECISION;

            const payload = {
                selectedElements: [canvasElement1],
                connectorsToDelete: [],
                elementType: mockElementType.DECISION,
                childIndexToKeep: 0
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID,
                selectedElementType,
                childIndexToKeep: 0
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });

        it('dispatch deleteElement action when isMultiElementDelete is false and all connectors are involved', () => {
            const selectedElementGUID = ['canvasElement2'];
            const selectedElementType = mockElementType.ASSIGNMENT;

            const payload = {
                selectedElements: [canvasElement2],
                connectorsToDelete: [
                    {
                        source: 'canvasElement2',
                        target: 'canvasElement3',
                        config: {
                            isSelected: false
                        }
                    },
                    {
                        source: 'canvasElement2',
                        target: 'canvasElement4',
                        config: {
                            isSelected: true
                        }
                    }
                ],
                elementType: mockElementType.ASSIGNMENT
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID,
                selectedElementType
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });

        it('dispatch deleteElement action when isMultiElementDelete is true and some of connectors are involved', () => {
            const selectedElementGUID = undefined;
            const selectedElementType = undefined;

            const payload = {
                selectedElements: [canvasElement1, canvasElement3],
                connectorsToDelete: [
                    {
                        source: 'canvasElement2',
                        target: 'canvasElement3',
                        config: {
                            isSelected: false
                        }
                    },
                    {
                        source: 'canvasElement3',
                        target: 'canvasElement4',
                        config: {
                            isSelected: false
                        }
                    },
                    {
                        source: 'canvasElement2',
                        target: 'canvasElement4',
                        config: {
                            isSelected: true
                        }
                    },
                    {
                        source: 'startElement',
                        target: 'canvasElement4',
                        config: {
                            isSelected: true
                        }
                    }
                ],
                elementType: undefined
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID,
                selectedElementType
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });

        it('dispatch deleteElement action with selected element and parentGUID when parentGUID present', () => {
            const guid = canvasElement1.guid;
            const parentGuid = 'foo';

            const payload = {
                selectedElements: [canvasElement1],
                elementType: mockElementType.STAGE_STEP,
                childIndexToKeep: undefined,
                connectorsToDelete: [],
                parentGUID: parentGuid
            };

            getElementsToBeDeleted(storeInstance, {
                selectedElementGUID: [guid],
                selectedElementType: payload.elementType,
                parentGUID: parentGuid
            });

            expect(dispatch).toHaveBeenCalledWith({
                type: 'deleteElement',
                payload
            });
        });
    });

    describe('getSaveType function', () => {
        it('throw an error if event type not defined', () => {
            expect(() => {
                getSaveType();
            }).toThrow();
        });

        it.each`
            eventType                                | flowId       | canOnlySaveAsNewDefinition | saveType
            ${SaveFlowEvent.Type.SAVE}               | ${'flowid'}  | ${false}                   | ${SaveType.UPDATE}
            ${SaveFlowEvent.Type.SAVE}               | ${undefined} | ${false}                   | ${SaveType.CREATE}
            ${SaveFlowEvent.Type.SAVE_AS}            | ${undefined} | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS}            | ${'flowid'}  | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS}            | ${undefined} | ${false}                   | ${SaveType.NEW_VERSION}
            ${SaveFlowEvent.Type.SAVE_AS}            | ${'flowid'}  | ${false}                   | ${SaveType.NEW_VERSION}
            ${SaveFlowEvent.Type.SAVE_AS_OVERRIDDEN} | ${undefined} | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS_OVERRIDDEN} | ${'flowid'}  | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS_OVERRIDDEN} | ${undefined} | ${false}                   | ${SaveType.NEW_VERSION}
            ${SaveFlowEvent.Type.SAVE_AS_OVERRIDDEN} | ${'flowid'}  | ${false}                   | ${SaveType.NEW_VERSION}
            ${SaveFlowEvent.Type.SAVE_AS_TEMPLATE}   | ${undefined} | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS_TEMPLATE}   | ${'flowid'}  | ${true}                    | ${SaveType.NEW_DEFINITION}
            ${SaveFlowEvent.Type.SAVE_AS_TEMPLATE}   | ${undefined} | ${false}                   | ${SaveType.NEW_VERSION}
            ${SaveFlowEvent.Type.SAVE_AS_TEMPLATE}   | ${'flowid'}  | ${false}                   | ${SaveType.NEW_VERSION}
        `(
            'return "$saveType" save type if flow event type is "$eventType", flowid is $flowId and canOnlySaveAsNewDefinition is $canOnlySaveAsNewDefinition',
            async ({ saveType, eventType, flowId, canOnlySaveAsNewDefinition }) => {
                expect(getSaveType(eventType, flowId, canOnlySaveAsNewDefinition)).toBe(saveType);
            }
        );
    });

    describe('header badge and label functions', () => {
        it('showLabel should return true when showInterviewLabel is true', () => {
            const headerConfig: HeaderConfig = {
                showDebugStatus: true,
                showInterviewLabel: true,
                showTestStatus: false
            };
            expect(showLabel(headerConfig)).toBe(true);
        });

        it('showLabel should return true when showTestStatus is true', () => {
            const headerConfig: HeaderConfig = {
                showDebugStatus: false,
                showInterviewLabel: false,
                showTestStatus: true
            };
            expect(showLabel(headerConfig)).toBe(true);
        });

        it.each`
            debugInterviewStatus | expectedExtraCssClass
            ${'FINISHED'}        | ${'slds-theme_success'}
            ${'WAITING'}         | ${'slds-theme_warning'}
            ${'ERROR'}           | ${'slds-theme_error'}
            ${'STARTED'}         | ${'slds-theme_warning'}
        `(
            'return "$expectedExtraCssClass" css class if debugInterviewStatus is "$debugInterviewStatus"',
            async ({ debugInterviewStatus, expectedExtraCssClass }) => {
                const headerConfig: HeaderConfig = {
                    showDebugStatus: true,
                    showInterviewLabel: true,
                    showTestStatus: false
                };
                expect(badgeClass(headerConfig, '', debugInterviewStatus)[expectedExtraCssClass]).toBe(true);
            }
        );
        it.each`
            debugInterviewStatus | expectedBadgeLabel
            ${'FINISHED'}        | ${LABELS.debugBadgeCompleted}
            ${'WAITING'}         | ${LABELS.debugBadgePaused}
            ${'ERROR'}           | ${LABELS.debugBadgeError}
            ${'STARTED'}         | ${LABELS.debugBadgeNotTriggered}
        `(
            'return "$expectedExtraCssClass" css class if debugInterviewStatus is "$debugInterviewStatus"',
            async ({ debugInterviewStatus, expectedBadgeLabel }) => {
                const headerConfig: HeaderConfig = {
                    showDebugStatus: true,
                    showInterviewLabel: true,
                    showTestStatus: false
                };
                expect(badgeStatus(headerConfig, debugInterviewStatus, '')).toBe(expectedBadgeLabel);
            }
        );

        it.each`
            testStatus | expectedExtraCssClass
            ${'Pass'}  | ${'slds-theme_success'}
            ${'Fail'}  | ${'slds-theme_error'}
            ${'Error'} | ${'slds-theme_error'}
        `(
            'return "$expectedExtraCssClass" css class if debugInterviewStatus is "$debugInterviewStatus"',
            async ({ testStatus, expectedExtraCssClass }) => {
                const headerConfig: HeaderConfig = {
                    showDebugStatus: false,
                    showInterviewLabel: false,
                    showTestStatus: true
                };
                expect(badgeClass(headerConfig, testStatus, '')[expectedExtraCssClass]).toBe(true);
            }
        );
        it.each`
            testStatus | expectedBadgeLabel
            ${'Pass'}  | ${LABELS.testBadgePass}
            ${'Fail'}  | ${LABELS.testBadgeFail}
            ${'Error'} | ${LABELS.testBadgeError}
        `(
            'return "$expectedExtraCssClass" css class if debugInterviewStatus is "$debugInterviewStatus"',
            async ({ testStatus, expectedBadgeLabel }) => {
                const headerConfig: HeaderConfig = {
                    showDebugStatus: false,
                    showInterviewLabel: false,
                    showTestStatus: true
                };
                expect(badgeStatus(headerConfig, '', testStatus)).toBe(expectedBadgeLabel);
            }
        );
    });

    describe('updateStoreAfterSaveFlowIsSuccessful function', () => {
        it('throw an error if store instance not defined', () => {
            expect(() => {
                updateStoreAfterSaveFlowIsSuccessful();
            }).toThrow();
        });
        it('dispatch updatePropertiesAfterSaving action if flow save success', () => {
            const dispatch = jest.fn();
            const storeInstance = {
                dispatch
            };

            updateStoreAfterSaveFlowIsSuccessful(storeInstance, {
                versionNumber: '1',
                status: 'Active',
                lastModifiedDate: '',
                lastModifiedBy: 'user1',
                definitionId: '300xxxxxxxxxxxxxxx'
            });

            const payload = {
                versionNumber: '1',
                status: 'Active',
                lastModifiedDate: '',
                isLightningFlowBuilder: true,
                lastModifiedBy: 'user1',
                canOnlySaveAsNewDefinition: false,
                definitionId: '300xxxxxxxxxxxxxxx'
            };

            expect(dispatch).toHaveBeenCalledWith({
                type: 'updatePropertiesAfterSaving',
                payload
            });
        });
    });

    describe('updateStoreAfterSaveAsNewFlowIsFailed function', () => {
        it('throw an error if store instance not defined', () => {
            expect(() => {
                updateStoreAfterSaveAsNewFlowIsFailed();
            }).toThrow();
        });

        it('dispatch updateProperties action if saveAsNewFlow fails', () => {
            const dispatch = jest.fn();
            const storeInstance = {
                dispatch
            };

            updateStoreAfterSaveAsNewFlowIsFailed(storeInstance);

            const payload = {
                versionNumber: null,
                status: null,
                lastModifiedDate: null,
                isLightningFlowBuilder: true,
                lastModifiedBy: null,
                canOnlySaveAsNewDefinition: false
            };

            expect(dispatch).toHaveBeenCalledWith({
                type: 'updatePropertiesAfterSaveFailed',
                payload
            });
        });
    });

    describe('updateStoreAfterSaveAsNewVersionIsFailed function', () => {
        it('throw an error if store instance not defined', () => {
            expect(() => {
                updateStoreAfterSaveAsNewVersionIsFailed();
            }).toThrow();
        });

        it('dispatch updateProperties action if saveAsNewVersion fails', () => {
            const dispatch = jest.fn();
            const storeInstance = {
                dispatch
            };

            updateStoreAfterSaveAsNewVersionIsFailed(storeInstance, 'label1', 'description1', 'interviewLabel1');

            const payload = {
                label: 'label1',
                description: 'description1',
                interviewLabel: 'interviewLabel1'
            };

            expect(dispatch).toHaveBeenCalledWith({
                type: 'updateProperties',
                payload
            });
        });
    });

    describe('updateUrl function', () => {
        it('when update url check the window history state', () => {
            window.history.pushState = jest.fn();
            updateUrl('123');
            expect(window.history.pushState).toHaveBeenCalled();
        });
    });

    describe('setFlowErrorsAndWarnings function', () => {
        it('when undefined data object is passed', () => {
            expect(setFlowErrorsAndWarnings()).toEqual({
                errors: {},
                warnings: {}
            });
        });

        it('when no errors and warnings are present', () => {
            expect(setFlowErrorsAndWarnings({})).toEqual({
                errors: {},
                warnings: {}
            });
        });

        it('when errors are present, but warnings are not', () => {
            const errors = { e1: 'e1' },
                warnings = {};
            expect(setFlowErrorsAndWarnings({ errors, warnings })).toEqual({
                errors: { e1: 'e1' },
                warnings: {}
            });
        });

        it('when errors are not present and warnings are present', () => {
            const errors = {},
                warnings = { w1: 'w1' };
            expect(setFlowErrorsAndWarnings({ errors, warnings })).toEqual({
                errors: {},
                warnings: { w1: 'w1' }
            });
        });

        it('when both errors and warnings are present', () => {
            const errors = { e1: 'e1' },
                warnings = { e1: 'e1' };
            expect(setFlowErrorsAndWarnings({ errors, warnings })).toEqual({
                errors: { e1: 'e1' },
                warnings: { e1: 'e1' }
            });
        });
    });

    describe('flowPropertiesCallback function', () => {
        it('throw an error if store instance is not defined', () => {
            expect(() => {
                flowPropertiesCallback()({});
            }).toThrow('Store instance is not defined');
        });

        it('dispatch updateProperties action when flow property editor ok', () => {
            const dispatch = jest.fn();
            const storeInstance = {
                dispatch
            };

            flowPropertiesCallback(storeInstance)({
                name: { error: null, value: 'flowProperties' }
            });

            const payload = {
                name: 'flowProperties'
            };

            expect(dispatch).toHaveBeenCalledWith({
                type: 'updateProperties',
                payload
            });
        });
    });

    describe('saveAsFlowCallback function', () => {
        it('throw an error if store instance is not defined', () => {
            expect(() => {
                saveAsFlowCallback()();
            }).toThrow('Store instance is not defined');
        });

        it('throw an error if save flow function is not defined', () => {
            expect(() => {
                saveAsFlowCallback({})();
            }).toThrow('Save flow function is not defined');
        });

        it('saveFlowFn is called with appropriate save type', () => {
            const dispatch = jest.fn();
            const getCurrentState = jest.fn().mockImplementation(() => {
                return {
                    elements: {
                        startElement: {
                            guid: 'startElement',
                            elementType: mockElementType.START_ELEMENT,
                            config: {
                                isSelected: true,
                                isHighlighted: false
                            }
                        }
                    }
                };
            });
            const storeInstance = {
                dispatch,
                getCurrentState
            };
            const flowProperties = {
                saveType: SaveType.CREATE,
                processType: 'AutoLaunchedFlow'
            };
            const mocksaveFlowFn = jest.fn((saveType) => saveType);
            saveAsFlowCallback(storeInstance, mocksaveFlowFn)(flowProperties);
            expect(mocksaveFlowFn.mock.results[0].value).toBe(SaveType.CREATE);
        });
        it('removes scheduled paths when saving to a different process type', () => {
            const dispatch = jest.fn();
            const getCurrentState = jest.fn().mockImplementation(() => {
                return {
                    elements: {
                        startElement: {
                            guid: 'startElement',
                            elementType: mockElementType.START_ELEMENT,
                            config: {
                                isSelected: true,
                                isHighlighted: false
                            },
                            childReferences: [{ childReference: '1' }],
                            triggerType: FLOW_TRIGGER_TYPE.AFTER_SAVE,
                            maxConnections: 2,
                            connectorCount: 1
                        },
                        scheduledPath: {
                            dataType: 'Boolean',
                            elementType: mockElementType.SCHEDULED_PATH,
                            guid: '1',
                            label: 'pathTest',
                            name: 'pathTest',
                            offsetNumber: '1',
                            offsetUnit: 'DaysBefore',
                            timeSource: 'RecordTriggerEvent'
                        }
                    }
                };
            });
            const storeInstance = {
                dispatch,
                getCurrentState
            };
            const flowProperties = {
                saveType: SaveType.CREATE,
                processType: 'Flow',
                triggerType: FLOW_TRIGGER_TYPE.NONE
            };
            const mocksaveFlowFn = jest.fn((saveType) => saveType);
            saveAsFlowCallback(storeInstance, mocksaveFlowFn)(flowProperties);
            const deletedChildElementGuids = dispatch.mock.calls[1][0].payload.deletedChildElementGuids;
            const maxConnections = dispatch.mock.calls[1][0].payload.canvasElement.maxConnections;
            const connectorCount = dispatch.mock.calls[1][0].payload.canvasElement.connectorCount;
            expect(deletedChildElementGuids).toEqual(['1']);
            expect(maxConnections).toEqual(1);
            expect(connectorCount).toEqual(0);
        });
    });

    describe('getCopiedChildElements', () => {
        it('Returns an empty object when the copied element does not have any child elements', () => {
            const elementsInStore = {
                assignment1: {
                    guid: 'assignment1',
                    next: 'end',
                    config: { isSelected: true },
                    elementType: mockElementType.ASSIGNMENT
                }
            };

            const result = getCopiedChildElements(elementsInStore, elementsInStore.assignment1);
            expect(result).toMatchObject({});
        });

        it('Should return all the child elements (outcomes) when the copied element is a Decision', () => {
            const elementsInStore = {
                decision1: {
                    guid: 'decision1',
                    children: [null, null],
                    childReferences: [
                        {
                            childReference: 'outcome1'
                        },
                        {
                            childReference: 'outcome2'
                        }
                    ],
                    elementType: mockElementType.DECISION
                },
                outcome1: {
                    guid: 'outcome1'
                },
                outcome2: {
                    guid: 'outcome2'
                }
            };

            const result = getCopiedChildElements(elementsInStore, elementsInStore.decision1);
            expect(result).toMatchObject({
                outcome1: {
                    guid: 'outcome1'
                },
                outcome2: {
                    guid: 'outcome2'
                }
            });
        });

        it('Should return all the nested screen fields when the copied element is a Screen', () => {
            const elementsInStore = {
                screen1: {
                    guid: 'screen1',
                    config: { isSelected: true },
                    elementType: mockElementType.SCREEN,
                    childReferences: [
                        {
                            childReference: 'section1'
                        },
                        {
                            childReference: 'textField1'
                        }
                    ]
                },
                section1: {
                    guid: 'section1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [
                        {
                            childReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: mockElementType.SCREEN_FIELD
                }
            };

            const result = getCopiedChildElements(elementsInStore, elementsInStore.screen1);
            expect(result).toMatchObject({
                section1: {
                    guid: 'section1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [
                        {
                            childReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: mockElementType.SCREEN_FIELD
                }
            });
        });
    });

    describe('getCopiedData function', () => {
        it('getCopiedData returns the correct data that includes selected elements and associated child elements', () => {
            const elementsInStore = {
                assignment1: {
                    guid: 'assignment1',
                    next: 'decision1',
                    config: { isSelected: true },
                    elementType: mockElementType.ASSIGNMENT
                },
                decision1: {
                    guid: 'decision1',
                    config: { isSelected: true },
                    children: ['assignment2', 'assignment3'],
                    childReferences: [
                        {
                            childReference: 'outcome1'
                        }
                    ],
                    elementType: mockElementType.DECISION
                },
                outcome1: {
                    guid: 'outcome1'
                },
                assignment2: {
                    guid: 'assignment2',
                    config: { isSelected: true },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: mockElementType.ASSIGNMENT
                },
                assignment3: {
                    guid: 'assignment3',
                    config: { isSelected: false },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: mockElementType.ASSIGNMENT
                }
            };

            const expectedCopiedElements = {
                assignment1: {
                    guid: 'assignment1',
                    next: 'decision1',
                    config: { isSelected: true },
                    elementType: mockElementType.ASSIGNMENT
                },
                decision1: {
                    guid: 'decision1',
                    config: { isSelected: true },
                    children: ['assignment2', 'assignment3'],
                    childReferences: [
                        {
                            childReference: 'outcome1'
                        }
                    ],
                    elementType: mockElementType.DECISION
                },
                assignment2: {
                    guid: 'assignment2',
                    config: { isSelected: true },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: mockElementType.ASSIGNMENT
                }
            };

            const expectedCopiedChildElements = {
                outcome1: {
                    guid: 'outcome1'
                }
            };

            const result = getCopiedData(elementsInStore, 'assignment1');

            expect(result.copiedCanvasElements).toMatchObject(expectedCopiedElements);
            expect(result.copiedChildElements).toMatchObject(expectedCopiedChildElements);
            expect(result.bottomCutOrCopiedGuid).toEqual('decision1');
        });

        it('getCopiedData returns the correct data when copying a screen with nested screen fields', () => {
            const elementsInStore = {
                screen1: {
                    guid: 'screen1',
                    config: { isSelected: true },
                    elementType: mockElementType.SCREEN,
                    childReferences: [
                        {
                            childReference: 'section1'
                        },
                        {
                            childReference: 'textField1'
                        }
                    ]
                },
                section1: {
                    guid: 'section1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [
                        {
                            childReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: mockElementType.SCREEN_FIELD
                }
            };

            const expectedCopiedElements = {
                screen1: {
                    guid: 'screen1',
                    config: { isSelected: true },
                    elementType: mockElementType.SCREEN,
                    childReferences: [
                        {
                            childReference: 'section1'
                        },
                        {
                            childReference: 'textField1'
                        }
                    ]
                }
            };

            const expectedCopiedChildElements = {
                section1: {
                    guid: 'section1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [
                        {
                            childReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: mockElementType.SCREEN_FIELD
                }
            };

            const result = getCopiedData(elementsInStore, 'screen1');

            expect(result.copiedCanvasElements).toMatchObject(expectedCopiedElements);
            expect(result.copiedChildElements).toMatchObject(expectedCopiedChildElements);
            expect(result.bottomCutOrCopiedGuid).toEqual('screen1');
        });
    });

    describe('getPasteElementGuidMaps function', () => {
        it('Creates the guids map successfully', () => {
            const elements = {
                guid1: {
                    guid: 'guid1'
                }
            };
            const childElements = {
                childGuid1: {
                    guid: 'childGuid1'
                }
            };
            const result = getPasteElementGuidMaps(elements, childElements);

            expect(result.canvasElementGuidMap).toMatchObject({
                guid1: 'rand_guid'
            });
            expect(result.childElementGuidMap).toMatchObject({
                childGuid1: 'rand_guid'
            });
        });
    });

    describe('getDuplicateElementGuidMaps function', () => {
        it('throw an error if canvasElementsInStore is not defined', () => {
            expect(() => {
                getDuplicateElementGuidMaps(undefined, {});
            }).toThrow('canvasElementsInStore is not defined');
        });

        it('throw an error if elementsInStore is not defined', () => {
            expect(() => {
                getDuplicateElementGuidMaps([], undefined);
            }).toThrow('elementsInStore is not defined');
        });

        it('return {canvasElementGuidMap, childElementGuidMap}', () => {
            const canvasElementsInStore = ['guid1', 'guid2'];
            const elementsInStore = {
                guid1: {
                    config: { isSelected: true, isHighlighted: false },
                    connectorCount: 0,
                    elementType: 'START_ELEMENT',
                    guid: 'guid1',
                    isCanvasElement: true
                },
                guid2: {
                    config: { isSelected: true, isHighlighted: false },
                    connectorCount: 0,
                    elementType: 'SCREEN',
                    guid: 'guid2',
                    isCanvasElement: true
                },
                guid3: {
                    config: { isSelected: false, isHighlighted: false },
                    connectorCount: 0,
                    elementType: 'SCREEN',
                    guid: 'guid3',
                    isCanvasElement: true
                }
            };

            const canvasElementGuidMap = {
                guid2: 'rand_guid'
            };

            const unduplicatedCanvasElementsGuids = ['guid1'];
            const childElementGuidMap = {};
            const res = {
                canvasElementGuidMap,
                childElementGuidMap,
                unduplicatedCanvasElementsGuids
            };
            expect(getDuplicateElementGuidMaps(canvasElementsInStore, elementsInStore)).toEqual(res);
        });

        it('includes nested screen fields in the childElementGuidMap', () => {
            const canvasElementsInStore = ['guid1', 'guid2'];
            const elementsInStore = {
                guid1: {
                    config: { isSelected: true, isHighlighted: false },
                    connectorCount: 0,
                    elementType: mockElementType.DECISION,
                    guid: 'guid1',
                    isCanvasElement: true,
                    childReferences: [{ childReference: 'guid3' }]
                },
                guid2: {
                    config: { isSelected: true, isHighlighted: false },
                    connectorCount: 0,
                    elementType: mockElementType.SCREEN,
                    guid: 'guid2',
                    isCanvasElement: true,
                    childReferences: [{ childReference: 'guid4' }, { childReference: 'guid5' }]
                },
                guid3: {
                    guid: 'guid3'
                },
                guid4: {
                    guid: 'guid4',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [{ childReference: 'guid6' }]
                },
                guid5: {
                    guid: 'guid5'
                },
                guid6: {
                    guid: 'guid6',
                    elementType: mockElementType.SCREEN_FIELD,
                    childReferences: [{ childReference: 'guid7' }]
                },
                guid7: {
                    guid: 'guid7'
                }
            };

            const childElementGuidMap = {
                guid3: 'rand_guid',
                guid4: 'rand_guid',
                guid5: 'rand_guid',
                guid6: 'rand_guid',
                guid7: 'rand_guid'
            };

            const res = {
                canvasElementGuidMap: {
                    guid1: 'rand_guid',
                    guid2: 'rand_guid'
                },
                childElementGuidMap,
                unduplicatedCanvasElementsGuids: []
            };

            expect(getDuplicateElementGuidMaps(canvasElementsInStore, elementsInStore)).toEqual(res);
        });
    });

    describe('getConnectorToDuplicate function', () => {
        it('throw an error if connectorsInStore is not defined', () => {
            expect(() => {
                getConnectorToDuplicate(undefined, {});
            }).toThrow('connectorsInStore is not defined');
        });

        it('throw an error if canvasElementGuidMap is not defined', () => {
            expect(() => {
                getConnectorToDuplicate([], undefined);
            }).toThrow('canvasElementGuidMap is not defined');
        });

        it('return array containing connectors that need to be duplicated', () => {
            const connectorsInStore = [
                {
                    guid: 'conn1',
                    source: 'guid1',
                    target: 'guid2',
                    config: { isSelected: false },
                    type: 'REGULAR'
                },
                {
                    guid: 'conn2',
                    source: 'guid2',
                    target: 'guid3',
                    config: { isSelected: true },
                    type: 'REGULAR'
                },
                {
                    guid: 'conn3',
                    source: 'guid3',
                    target: 'guid4',
                    config: { isSelected: true },
                    type: 'REGULAR'
                }
            ];
            const canvasElementGuidMap = {
                guid3: 'rand_guid3',
                guid4: 'rand_guid4'
            };

            const connectorsToDuplicate = [
                {
                    guid: 'conn3',
                    source: 'guid3',
                    target: 'guid4',
                    config: { isSelected: true },
                    type: 'REGULAR'
                }
            ];
            expect(getConnectorToDuplicate(connectorsInStore, canvasElementGuidMap)).toEqual(connectorsToDuplicate);
        });
    });

    describe('highlightCanvasElement function', () => {
        it('throw an error if store instance is not defined', () => {
            expect(() => {
                highlightCanvasElement(undefined, 'guid1');
            }).toThrow('Store instance is not defined');
        });

        it('throw an error if elementGuid is not defined', () => {
            expect(() => {
                highlightCanvasElement({}, undefined);
            }).toThrow('elementGuid is not defined');
        });

        it('dispatch highlightOnCanvas action if the searched element is not highlighted', () => {
            const dispatch = jest.fn();
            const getCurrentState = jest.fn().mockImplementation(() => {
                return {
                    elements: {
                        guid1: {
                            guid: 'guid1',
                            config: {
                                isHighlighted: false
                            }
                        }
                    }
                };
            });
            const storeInstance = {
                dispatch,
                getCurrentState
            };
            const elementGuid = 'guid1';

            highlightCanvasElement(storeInstance, elementGuid);

            const payload = {
                guid: 'guid1'
            };
            expect(dispatch).toHaveBeenCalledWith({
                type: 'highlightOnCanvas',
                payload
            });
        });

        it('highlightOnCanvas action is not dispatched if the searched element is already highlighted', () => {
            const dispatch = jest.fn();
            const getCurrentState = jest.fn().mockImplementation(() => {
                return {
                    elements: {
                        guid1: {
                            guid: 'guid1',
                            config: {
                                isHighlighted: true
                            }
                        }
                    }
                };
            });
            const storeInstance = {
                dispatch,
                getCurrentState
            };
            const elementGuid = 'guid1';

            highlightCanvasElement(storeInstance, elementGuid);

            const payload = {
                guid: 'guid1'
            };
            expect(dispatch).not.toHaveBeenCalledWith({
                type: 'highlightOnCanvas',
                payload
            });
        });
    });

    describe('getConnectorsToHighlight function', () => {
        it('returns highlighted connectors for every element in the canvas decorator', () => {
            const canvasDecorator = {
                decoratedElements: [
                    {
                        elementType: 'START',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.REGULAR
                            }
                        ]
                    },
                    {
                        elementApiName: 'element1',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.REGULAR
                            }
                        ]
                    },
                    {
                        elementApiName: 'element2',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.FAULT
                            }
                        ]
                    }
                ]
            };
            const expected = [
                { source: 'startGuid', type: CONNECTOR_TYPE.REGULAR },
                { source: 'element1', type: CONNECTOR_TYPE.REGULAR },
                { source: 'element2', type: CONNECTOR_TYPE.FAULT }
            ];
            expect(getConnectorsToHighlight(canvasDecorator)).toEqual(expected);
        });

        it('returns highlighted connectors for elements with child sources in the canvas decorator', () => {
            const canvasDecorator = {
                decoratedElements: [
                    {
                        elementType: 'START',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.REGULAR
                            }
                        ]
                    },
                    {
                        elementApiName: 'element1',
                        decoratedConnectors: [
                            {
                                childSource: 'childElement',
                                connectorType: CONNECTOR_TYPE.REGULAR
                            }
                        ]
                    }
                ]
            };
            const expected = [
                { source: 'startGuid', type: CONNECTOR_TYPE.REGULAR },
                { source: 'element1', childSource: 'childElement', type: CONNECTOR_TYPE.REGULAR }
            ];
            expect(getConnectorsToHighlight(canvasDecorator)).toEqual(expected);
        });
    });

    describe('getElementsWithError function', () => {
        it('returns empty [] when no other decorators are passed in', () => {
            expect(getElementsWithError({})).toEqual([]);
        });

        it('returns filtered objects with right properties using the canvas decorator', () => {
            const canvasDecorator = {
                decoratedElements: [
                    {
                        elementApiName: 'element1',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.REGULAR
                            }
                        ],
                        decorationType: null
                    },
                    {
                        elementApiName: 'element2',
                        decoratedConnectors: [
                            {
                                connectorType: CONNECTOR_TYPE.FAULT
                            }
                        ],
                        decorationType: 'ERROR'
                    },
                    {
                        elementApiName: 'element3',
                        decoratedConnectors: null,
                        decorationType: 'ERROR'
                    }
                ]
            };
            const expected = [
                {
                    elementName: 'element2',
                    decorationType: 'ERROR'
                },
                {
                    elementName: 'element3',
                    decorationType: 'ERROR'
                }
            ];
            expect(getElementsWithError(canvasDecorator)).toEqual(expected);
        });
    });

    describe('screenFieldsReferencedByLoops', () => {
        it('only returns screen fields referenced by loop', () => {
            const screenFields = screenFieldsReferencedByLoops(flowWithAllElements.metadata);

            expect(screenFields).toMatchObject([
                {
                    fieldType: 'ComponentInstance',
                    name: 'lightningCompWithAccountsOutput',
                    extensionName: 'c:sobjectCollectionOutputComp'
                },
                {
                    fieldType: 'ComponentInstance',
                    name: 'screenCompInSectionColumnWithSObjectCollAutoOutput',
                    extensionName: 'c:sobjectCollectionOutputComp'
                }
            ]);
        });
        it('does not alter original metadata', () => {
            const originalMetadata = deepCopy(flowWithAllElements.metadata);

            screenFieldsReferencedByLoops(flowWithAllElements.metadata);

            expect(flowWithAllElements.metadata).toEqual(originalMetadata);
        });
    });

    describe('debugInterviewResponseCallback function including wait event and serializedInterview', () => {
        let storeInstance;
        let dispatch;

        beforeEach(() => {
            dispatch = jest.fn();
            storeInstance = {
                dispatch
            };
        });

        it('constructs the debug data object for debug panel correctly', () => {
            const startTime = new Date();
            const endTime = new Date();
            const data = [
                {
                    interviewStatus: 'waiting',
                    debugTrace: 'testTrace',
                    errors: undefined,
                    startInterviewTime: startTime,
                    endInterviewTime: endTime,
                    waitEvents: {
                        PC: '2022-01-02T00:00:00Z',
                        PC2: '2022-01-02T16:40:00Z'
                    },
                    serializedInterview: 'serializedInterview'
                },
                {}
            ];

            const debugData = debugInterviewResponseCallback(data, storeInstance, false);
            expect(debugData).toMatchObject({
                interviewStatus: 'waiting',
                debugTrace: 'testTrace',
                error: undefined,
                startInterviewTime: startTime,
                endInterviewTime: endTime,
                waitEvent: {
                    PC: '2022-01-02T00:00:00Z',
                    PC2: '2022-01-02T16:40:00Z'
                },
                serializedInterview: 'serializedInterview'
            });
        });
    });

    describe('debugInterviewResponseCallback function', () => {
        let storeInstance;
        let dispatch;

        beforeEach(() => {
            dispatch = jest.fn();
            storeInstance = {
                dispatch
            };
        });

        it('constructs the debug data object for debug panel correctly', () => {
            const startTime = new Date();
            const endTime = new Date();
            const data = [
                {
                    interviewStatus: 'finished',
                    debugTrace: 'testTrace',
                    errors: 'testErrors',
                    startInterviewTime: startTime,
                    endInterviewTime: endTime
                },
                {}
            ];

            const debugData = debugInterviewResponseCallback(data, storeInstance, false);
            expect(debugData).toMatchObject({
                interviewStatus: 'finished',
                debugTrace: 'testTrace',
                error: 'testErrors',
                startInterviewTime: startTime,
                endInterviewTime: endTime
            });
        });

        it('reports errored debug interview correctly', () => {
            const startTime = new Date();
            const endTime = new Date();
            const data = [
                {
                    interviewStatus: 'ERROR',
                    debugTrace: 'testTrace',
                    errors: 'testErrors',
                    startInterviewTime: startTime,
                    endInterviewTime: endTime
                },
                {}
            ];

            expect(isDebugInterviewInError(data[0])).toEqual(true);
        });

        it('fires the canvas decorate action if no errors or unsaved changes', () => {
            const data = [
                {
                    interviewStatus: 'finished',
                    debugTrace: 'testTrace',
                    errors: '',
                    startInterviewTime: new Date(),
                    endInterviewTime: new Date()
                },
                {
                    decoratedElements: [
                        {
                            elementType: 'START',
                            decoratedConnectors: [
                                {
                                    connectorType: CONNECTOR_TYPE.REGULAR
                                }
                            ]
                        }
                    ]
                }
            ];
            debugInterviewResponseCallback(data, storeInstance, false);

            expect(dispatch).toHaveBeenCalledWith({
                type: 'decorateCanvas',
                payload: {
                    connectorsToHighlight: [
                        {
                            source: 'startGuid',
                            type: 'REGULAR'
                        }
                    ],
                    elementsToDecorate: []
                }
            });
        });

        it('does not fire the clear canvas decoration action on errors if keepHighlightOnError is true', () => {
            const data = [
                {
                    interviewStatus: 'error',
                    debugTrace: '',
                    errors: 'errors',
                    startInterviewTime: new Date(),
                    endInterviewTime: new Date()
                },
                {}
            ];
            debugInterviewResponseCallback(data, storeInstance, false, true);

            expect(dispatch).not.toHaveBeenCalledWith({
                type: 'clearCanvasDecoration'
            });
        });

        it('fires the clear canvas decoration action if there are errors', () => {
            const data = [
                {
                    interviewStatus: 'error',
                    debugTrace: '',
                    errors: 'errors',
                    startInterviewTime: new Date(),
                    endInterviewTime: new Date()
                },
                {}
            ];
            debugInterviewResponseCallback(data, storeInstance, false);

            expect(dispatch).toHaveBeenCalledWith({
                type: 'clearCanvasDecoration'
            });
        });

        it('fires the clear canvas decoration action if there unsaved changes', () => {
            const data = [
                {
                    interviewStatus: 'finished',
                    debugTrace: 'testTrace',
                    errors: '',
                    startInterviewTime: new Date(),
                    endInterviewTime: new Date()
                },
                {}
            ];
            debugInterviewResponseCallback(data, storeInstance, true);

            expect(dispatch).toHaveBeenCalledWith({
                type: 'clearCanvasDecoration'
            });
        });

        it('constructs the debug data object for test mode correctly', () => {
            const startTime = new Date();
            const endTime = new Date();
            const data = [
                {
                    interviewStatus: 'finished',
                    debugTrace: 'testTrace',
                    testAssertionTrace: 'assertions',
                    errors: 'testErrors',
                    startInterviewTime: startTime,
                    endInterviewTime: endTime
                },
                {}
            ];

            const debugData = debugInterviewResponseCallback(data, storeInstance, false);
            expect(debugData).toMatchObject({
                interviewStatus: 'finished',
                debugTrace: 'testTrace',
                testAssertionTrace: 'assertions',
                error: 'testErrors',
                startInterviewTime: startTime,
                endInterviewTime: endTime
            });
        });
    });

    describe('shiftFocusFromCanvas function', () => {
        it('focuses on header when shifting focus forward and right panel is not present', () => {
            const mockFocusFunction = jest.fn();
            const mockHeaderComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromCanvas(null, null, mockHeaderComponent, null, false);
            expect(mockFocusFunction).toHaveBeenCalled();
        });

        it('focuses on right panel when shifting focus forward and right panel is present', () => {
            const mockFocusFunction = jest.fn();
            const mockRightPanelComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromCanvas(null, null, null, mockRightPanelComponent, false);
            expect(mockFocusFunction).toHaveBeenCalled();
        });

        it('focuses on left panel when shifting focus backward', () => {
            const mockFocusFunction = jest.fn();
            const mockLeftPanelComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromCanvas(mockLeftPanelComponent, null, null, null, true);
            expect(mockFocusFunction).toHaveBeenCalled();
        });

        it('focuses on toolbar when shifting focus backward and left panel is not present', () => {
            const mockFocusFunction = jest.fn();
            const mockToolbarComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromCanvas(null, mockToolbarComponent, null, null, true);
            expect(mockFocusFunction).toHaveBeenCalled();
        });
    });

    describe('shiftFocusFromToolbar function', () => {
        it('focuses on header when shifting backward', () => {
            const mockFocusFunction = jest.fn();
            const mockHeaderComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromToolbar(mockHeaderComponent, null, true);
            expect(mockFocusFunction).toHaveBeenCalled();
        });

        it('focuses on the canvas when shifting forward', () => {
            const mockFocusFunction = jest.fn();
            const mockCanvasComponent = {
                focus: mockFocusFunction
            };

            shiftFocusFromToolbar(null, mockCanvasComponent, false);
            expect(mockFocusFunction).toHaveBeenCalled();
        });
    });

    describe('logElementCreation', () => {
        beforeEach(() => {
            logInteraction.mockClear();
        });
        it('logs on element creation with correct element type', () => {
            const element = {
                elementType: 'Variable'
            };
            logElementCreation(element, false);
            expect(logInteraction).toHaveBeenCalled();
            expect(logInteraction.mock.calls[0][0]).toBe(`add-node-of-type-Variable`);
        });
        it('logs on choice creation with correct element type and data', () => {
            const element = {
                elementType: 'Choice',
                isAddingResourceViaLeftPanel: true
            };
            logElementCreation(element, false);
            expect(logInteraction).toHaveBeenCalled();
            expect(logInteraction.mock.calls[0][0]).toBe(`add-node-of-type-Choice`);
            expect(logInteraction.mock.calls[0][2].isAddingResourceViaLeftPanel).toBe(true);
        });
        it('logs on choice creation with correct element type and isResourceQuickCreated is true', () => {
            const element = {
                elementType: 'Choice',
                isAddingResourceViaLeftPanel: false
            };
            logElementCreation(element, true);
            expect(logInteraction).toHaveBeenCalled();
            expect(logInteraction.mock.calls[0][0]).toBe(`add-node-of-type-Choice`);
            expect(logInteraction.mock.calls[0][2].isResourceQuickCreated).toBe(true);
        });
    });
    describe('childElementLabelToNameConverter function', () => {
        it('Generates the correct api name', () => {
            expect(childElementLabelToNameConverter('test label', 'test name')('test of test label')).toEqual(
                'test_of_test_name'
            );
        });

        it('Works with max length labels', () => {
            const parentLabel = new Array(MAX_LABEL_LENGTH + 1).join('0');
            const label = ('Step 1 of ' + parentLabel).substring(0, MAX_LABEL_LENGTH);
            expect(childElementLabelToNameConverter(parentLabel, 'parent name')(label)).toEqual(
                'Step_1_of_parent_name'
            );
        });
    });
    describe('generateDefaultLabel function', () => {
        it('Generates the correct label for the first of a particular element type for regular canvas elements', () => {
            generateDefaultLabel(mockElementType.RECORD_CREATE, sanitizeDevName, undefined);
            expect(commonUtils.format).toHaveBeenCalledWith(
                'FlowBuilderElementConfig.defaultFlowElementName',
                'Create Records',
                1
            );
        });
        it('Generates the correct next label and avoids generating a duplicate label for a regular canvas element', () => {
            const label = generateDefaultLabel(mockElementType.ORCHESTRATED_STAGE, sanitizeDevName, undefined);
            expect(label).toEqual('FlowBuilderElementConfig.defaultFlowElementName(Stage,27)');
        });

        it('Generates the correct label for a child canvas element', () => {
            generateDefaultLabel(
                mockElementType.STAGE_STEP,
                (label) => label,
                {
                    // return empty object to stand in for created but unlabelled element to be auto labeled
                    childReferences: [{}],
                    label: 'Stage 1'
                },
                CHILD_REFERENCES
            );
            expect(commonUtils.format).toHaveBeenCalledWith(
                'FlowBuilderElementConfig.defaultChildFlowElementName',
                'Step',
                1,
                'Stage 1'
            );
        });

        it('Generates the correct label for a non child canvas element with a parent guid', () => {
            const label = generateDefaultLabel(mockElementType.ORCHESTRATED_STAGE, sanitizeDevName, {});
            expect(label).toEqual('FlowBuilderElementConfig.defaultFlowElementName(Stage,27)');
        });

        it('Generates the correct label for a child canvas with other sibling elements', () => {
            generateDefaultLabel(
                mockElementType.STAGE_STEP,
                (label) => label,
                {
                    label: 'Stage 2',
                    childReferences: [
                        {
                            label: 'Step 1 of Stage 2'
                        },
                        {
                            label: 'Step 2 of Stage 2'
                        },
                        {}
                    ]
                },
                CHILD_REFERENCES
            );
            expect(commonUtils.format).toHaveBeenCalledWith(
                'FlowBuilderElementConfig.defaultChildFlowElementName',
                'Step',
                3,
                'Stage 2'
            );
        });

        it('Truncates labels to have a max length of 255 characters', () => {
            const label = generateDefaultLabel(
                mockElementType.STAGE_STEP,
                (label) => label,
                {
                    label: new Array(MAX_LABEL_LENGTH + 1).join('0'),
                    childReferences: [{}]
                },
                CHILD_REFERENCES
            );
            expect(label.length).toEqual(MAX_LABEL_LENGTH);
        });

        it('Avoids making a duplciate api name and goes to the next open spot', () => {
            generateDefaultLabel(mockElementType.DECISION, sanitizeDevName, undefined);
            expect(commonUtils.format).toHaveBeenCalledWith(
                'FlowBuilderElementConfig.defaultFlowElementName',
                'Decision',
                4
            );
        });
    });

    describe('dedupeLabel function', () => {
        it('Avoids an infinite loop when the same api name is generated every time', () => {
            const label = dedupeLabel(
                new Set(['test label 0', 'test label 1']),
                new Set(['truncated api name']),
                (counter) => 'test label ' + counter,
                () => 'truncated api name'
            );
            expect(label).toEqual('test label 2');
        });

        it('Avoids an infinite loop when the same label is generated every time', () => {
            const label = dedupeLabel(
                new Set(['truncated label']),
                new Set(['test']),
                () => 'truncated label',
                (label) => 'api name ' + label
            );
            expect(label).toEqual('truncated label');
        });
    });

    describe('decorateLabelsAndApiNames function', () => {
        it('Returns an unchanged element if the api name and label are both present', () => {
            const node = {
                label: { value: 'test' },
                name: { value: 'test' }
            };
            const updatedNode = decorateLabelsAndApiNames(node);
            expect(node).toEqual(updatedNode);
        });

        it('Only updates label when api name is filled out', () => {
            const node = {
                elementType: mockElementType.ORCHESTRATED_STAGE,
                label: { value: '', error: null },
                name: { value: 'test_api_name', error: null }
            };
            const updatedNode = decorateLabelsAndApiNames(node);
            expect(updatedNode.name.value === 'test_api_name' && updatedNode.label.value).toBeTruthy();
        });

        it('Only updates api name when label is filled out', () => {
            const node = {
                elementType: mockElementType.ORCHESTRATED_STAGE,
                label: { value: 'test label', error: null },
                name: { value: '', error: null }
            };
            const updatedNode = decorateLabelsAndApiNames(node);
            expect(updatedNode.label.value === 'test label' && updatedNode.name.value).toBeTruthy();
        });

        it('truncates api name to max length', () => {
            const node = {
                elementType: mockElementType.ORCHESTRATED_STAGE,
                label: { value: new Array(MAX_LABEL_LENGTH + 1).join('0'), error: null },
                name: { value: '', error: null }
            };
            const updatedNode = decorateLabelsAndApiNames(node);
            expect(updatedNode.name.value.length).toEqual(MAX_API_NAME_LENGTH);
        });
    });
});
