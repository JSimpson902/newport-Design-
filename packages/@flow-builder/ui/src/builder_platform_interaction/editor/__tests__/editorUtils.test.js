import {
    getElementsToBeDeleted,
    getSaveType,
    updateStoreAfterSaveFlowIsSuccessful,
    updateStoreAfterSaveAsNewFlowIsFailed,
    updateStoreAfterSaveAsNewVersionIsFailed,
    updateUrl,
    setFlowErrorsAndWarnings,
    flowPropertiesCallback,
    saveAsFlowCallback,
    getCopiedChildElements,
    getCopiedData,
    getPasteElementGuidMaps,
    getDuplicateElementGuidMaps,
    getConnectorToDuplicate,
    highlightCanvasElement
} from '../editorUtils';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { SaveType } from 'builder_platform_interaction/saveType';
import { SaveFlowEvent } from 'builder_platform_interaction/events';

jest.mock('builder_platform_interaction/selectors', () => {
    return {
        canvasSelector: jest.fn().mockImplementation(() => {
            return [
                {
                    guid: 'canvasElement1',
                    elementType: 'ASSIGNMENT',
                    config: {
                        isSelected: true,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement2',
                    elementType: 'DECISION',
                    config: {
                        isSelected: false,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement3',
                    elementType: 'ASSIGNMENT',
                    config: {
                        isSelected: true,
                        isHighlighted: false
                    }
                },
                {
                    guid: 'canvasElement4',
                    elementType: 'ASSIGNMENT',
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
        deleteElements: jest.fn().mockImplementation(payload => {
            return {
                type: 'deleteElement',
                payload
            };
        }),
        updatePropertiesAfterSaving: jest.fn().mockImplementation(payload => {
            return {
                type: 'updatePropertiesAfterSaving',
                payload
            };
        }),
        updatePropertiesAfterSaveFailed: jest.fn().mockImplementation(payload => {
            return {
                type: 'updatePropertiesAfterSaveFailed',
                payload
            };
        }),
        updateProperties: jest.fn().mockImplementation(payload => {
            return {
                type: 'updateProperties',
                payload
            };
        }),
        highlightOnCanvas: jest.fn().mockImplementation(payload => {
            return {
                type: 'highlightOnCanvas',
                payload
            };
        })
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
    return {
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
    return {
        isConfigurableStartSupported: jest.fn().mockImplementation(() => {
            return true;
        })
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
        getConfigForElementType: jest.fn().mockImplementation(elementType => {
            if (elementType === 'START_ELEMENT') {
                return {
                    canBeDuplicated: false,
                    isDeletable: false,
                    nodeConfig: { isSelectable: false }
                };
            } else if (elementType === 'Decision') {
                return {
                    childReferenceKey: {
                        singular: 'outcomeReference',
                        plural: 'outcomeReferences'
                    }
                };
            } else if (elementType === 'Screen') {
                return {
                    childReferenceKey: {
                        singular: 'fieldReference',
                        plural: 'fieldReferences'
                    }
                };
            }
            return {};
        })
    };
});

const canvasElement1 = {
    guid: 'canvasElement1',
    elementType: ELEMENT_TYPE.ASSIGNMENT,
    config: {
        isSelected: true,
        isHighlighted: false
    }
};

const canvasElement2 = {
    guid: 'canvasElement2',
    elementType: ELEMENT_TYPE.DECISION,
    config: {
        isSelected: false,
        isHighlighted: false
    }
};
const canvasElement3 = {
    guid: 'canvasElement3',
    elementType: ELEMENT_TYPE.ASSIGNMENT,
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
                            elementType: ELEMENT_TYPE.START_ELEMENT,
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
                            elementType: ELEMENT_TYPE.ASSIGNMENT,
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
            const selectedElementType = ELEMENT_TYPE.ASSIGNMENT;

            const payload = {
                selectedElements: [canvasElement1],
                connectorsToDelete: [],
                elementType: ELEMENT_TYPE.ASSIGNMENT
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

        it('dispatch deleteElement action when isMultiElementDelete is false and all connectors are involved', () => {
            const selectedElementGUID = ['canvasElement2'];
            const selectedElementType = ELEMENT_TYPE.ASSIGNMENT;

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
                elementType: ELEMENT_TYPE.ASSIGNMENT
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
    });

    describe('getSaveType function', () => {
        it('throw an error if event type not defined', () => {
            expect(() => {
                getSaveType();
            }).toThrow();
        });

        it('return "UPDATE" save type if flow event type is "save" and flowid is defined', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE, 'flowid', false)).toBe(SaveType.UPDATE);
        });

        it('return "CREATE" save type if flow event type is "save" and flow id is not defined', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE, undefined, false)).toBe(SaveType.CREATE);
        });

        it('return "NEW_DEFINITION" save type if flow event type is "save_as", "flowId" is undefined and "canOnlySaveAsNewDefinition" is true', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE_AS, undefined, true)).toBe(SaveType.NEW_DEFINITION);
        });

        it('return "NEW_DEFINITION" save type if flow event type is "save_as", "flowId" is defined and "canOnlySaveAsNewDefinition" is true', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE_AS, 'flowid', true)).toBe(SaveType.NEW_DEFINITION);
        });

        it('return "NEW_VERSION" save type if flow event type is "save_as", "flowId" is undefined and "canOnlySaveAsNewDefinition" is false', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE_AS, undefined, false)).toBe(SaveType.NEW_VERSION);
        });

        it('return "NEW_VERSION" save type if flow event type is "save_as", "flowId" is defined and "canOnlySaveAsNewDefinition" is false', () => {
            expect(getSaveType(SaveFlowEvent.Type.SAVE_AS, 'flowid', false)).toBe(SaveType.NEW_VERSION);
        });
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
                lastModifiedBy: 'user1'
            });

            const payload = {
                versionNumber: '1',
                status: 'Active',
                lastModifiedDate: '',
                isLightningFlowBuilder: true,
                lastModifiedBy: 'user1',
                canOnlySaveAsNewDefinition: false
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
                            elementType: ELEMENT_TYPE.START_ELEMENT,
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
            const mocksaveFlowFn = jest.fn(saveType => saveType);
            saveAsFlowCallback(storeInstance, mocksaveFlowFn)(flowProperties);
            expect(mocksaveFlowFn.mock.results[0].value).toBe(SaveType.CREATE);
        });
    });

    describe('getCopiedChildElements', () => {
        it('Returns an empty object when the copied element does not have any child elements', () => {
            const elementsInStore = {
                assignment1: {
                    guid: 'assignment1',
                    next: 'end',
                    config: { isSelected: true },
                    elementType: ELEMENT_TYPE.ASSIGNMENT
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
                    outcomeReferences: [
                        {
                            outcomeReference: 'outcome1'
                        },
                        {
                            outcomeReference: 'outcome2'
                        }
                    ],
                    elementType: ELEMENT_TYPE.DECISION
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
                    elementType: ELEMENT_TYPE.SCREEN,
                    fieldReferences: [
                        {
                            fieldReference: 'section1'
                        },
                        {
                            fieldReference: 'textField1'
                        }
                    ]
                },
                section1: {
                    guid: 'section1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [
                        {
                            fieldReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD
                }
            };

            const result = getCopiedChildElements(elementsInStore, elementsInStore.screen1);
            expect(result).toMatchObject({
                section1: {
                    guid: 'section1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [
                        {
                            fieldReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD
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
                    elementType: ELEMENT_TYPE.ASSIGNMENT
                },
                decision1: {
                    guid: 'decision1',
                    config: { isSelected: true },
                    children: ['assignment2', 'assignment3'],
                    outcomeReferences: [
                        {
                            outcomeReference: 'outcome1'
                        }
                    ],
                    elementType: ELEMENT_TYPE.DECISION
                },
                outcome1: {
                    guid: 'outcome1'
                },
                assignment2: {
                    guid: 'assignment2',
                    config: { isSelected: true },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: ELEMENT_TYPE.ASSIGNMENT
                },
                assignment3: {
                    guid: 'assignment3',
                    config: { isSelected: false },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: ELEMENT_TYPE.ASSIGNMENT
                }
            };

            const expectedCopiedElements = {
                assignment1: {
                    guid: 'assignment1',
                    next: 'decision1',
                    config: { isSelected: true },
                    elementType: ELEMENT_TYPE.ASSIGNMENT
                },
                decision1: {
                    guid: 'decision1',
                    config: { isSelected: true },
                    children: ['assignment2', 'assignment3'],
                    outcomeReferences: [
                        {
                            outcomeReference: 'outcome1'
                        }
                    ],
                    elementType: ELEMENT_TYPE.DECISION
                },
                assignment2: {
                    guid: 'assignment2',
                    config: { isSelected: true },
                    parent: 'decision1',
                    childIndex: 0,
                    elementType: ELEMENT_TYPE.ASSIGNMENT
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
                    elementType: ELEMENT_TYPE.SCREEN,
                    fieldReferences: [
                        {
                            fieldReference: 'section1'
                        },
                        {
                            fieldReference: 'textField1'
                        }
                    ]
                },
                section1: {
                    guid: 'section1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [
                        {
                            fieldReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD
                }
            };

            const expectedCopiedElements = {
                screen1: {
                    guid: 'screen1',
                    config: { isSelected: true },
                    elementType: ELEMENT_TYPE.SCREEN,
                    fieldReferences: [
                        {
                            fieldReference: 'section1'
                        },
                        {
                            fieldReference: 'textField1'
                        }
                    ]
                }
            };

            const expectedCopiedChildElements = {
                section1: {
                    guid: 'section1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [
                        {
                            fieldReference: 'column1'
                        }
                    ]
                },
                column1: {
                    guid: 'column1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: []
                },
                textField1: {
                    guid: 'textField1',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD
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
                    elementType: ELEMENT_TYPE.DECISION,
                    guid: 'guid1',
                    isCanvasElement: true,
                    outcomeReferences: [{ outcomeReference: 'guid3' }]
                },
                guid2: {
                    config: { isSelected: true, isHighlighted: false },
                    connectorCount: 0,
                    elementType: ELEMENT_TYPE.SCREEN,
                    guid: 'guid2',
                    isCanvasElement: true,
                    fieldReferences: [{ fieldReference: 'guid4' }, { fieldReference: 'guid5' }]
                },
                guid3: {
                    guid: 'guid3'
                },
                guid4: {
                    guid: 'guid4',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [{ fieldReference: 'guid6' }]
                },
                guid5: {
                    guid: 'guid5'
                },
                guid6: {
                    guid: 'guid6',
                    elementType: ELEMENT_TYPE.SCREEN_FIELD,
                    fieldReferences: [{ fieldReference: 'guid7' }]
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
});
