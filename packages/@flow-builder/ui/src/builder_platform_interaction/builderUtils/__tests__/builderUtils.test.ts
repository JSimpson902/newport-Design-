// @ts-nocheck
import {
    getPropertyEditorConfig,
    showPopover,
    isPopoverOpen,
    createConfigurationEditor,
    showHover,
    invokePropertyEditor,
    invokeNewFlowModal,
    invokeModal
} from '../builderUtils';
import { ticks } from 'builder_platform_interaction/builderTestUtils';

// eslint-disable-next-line lwc-core/no-interop-dispatch
import { createComponent, dispatchGlobalEvent } from 'aura';

import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { SaveFlowEvent } from 'builder_platform_interaction/events';
import { isAutoLayoutCanvasEnabled } from 'builder_platform_interaction/contextLib';
import { LABELS } from '../builderUtilsLabels';

const mockPackage = 'foo';
const mockComponent = 'bar';
const UI_CREATE_PANEL = 'ui:createPanel';

let mockCreateComponentCallbackStatus = 'SUCCESS';
let mockPanelValidity = true;

jest.mock('builder_platform_interaction/elementConfig', () => {
    const actual = jest.requireActual('builder_platform_interaction/elementConfig');
    return Object.assign({}, actual, {
        getConfigForElementType: jest.fn((type) => {
            const config = actual.getConfigForElementType(type);
            config.descriptor = `${mockPackage}:${mockComponent}`;
            return config;
        }),
        getConfigForElement: jest.fn((element) => {
            const config = actual.getConfigForElement(element);
            config.descriptor = `${mockPackage}:${mockComponent}`;
            return config;
        })
    });
});

jest.mock('aura', () => {
    return {
        dispatchGlobalEvent: jest.fn().mockImplementation((name, attributes) => {
            attributes.onCreate({
                close: () => {},
                isValid: () => {
                    return mockPanelValidity;
                },
                get: () => {
                    return [
                        {
                            get: () => {},
                            set: () => {}
                        }
                    ];
                },
                set: () => {}
            });
        }),
        createComponent: jest.fn().mockImplementation(async (cmpName, attr, callback) => {
            const newComponent = {
                getElement: () => {}
            };
            callback([newComponent], mockCreateComponentCallbackStatus, null);
        }),
        renderComponent: jest.fn().mockImplementation(() => {})
    };
});

const EDIT_MODE = 'editelement',
    ADD_MODE = 'addelement';

const getAttributes = (mode) => ({
    mode,
    node: {
        guid: 'd9e45a91-1dae-4acc-a0a8-69e0b316abe2',
        name: {
            value: 'record delete',
            error: null
        },
        description: {
            value: 'not a very good description I know',
            error: null
        },
        label: {
            value: 'record_delete',
            error: null
        },
        locationX: 356,
        locationY: 130,
        isCanvasElement: true,
        connectorCount: 1,
        config: {
            isSelected: true
        },
        inputReference: {
            value: '',
            error: null
        },
        object: {
            value: 'Account',
            error: null
        },
        filters: [
            {
                rowIndex: '81effde1-9e6f-4ff7-b879-bfd65538c509',
                leftHandSide: {
                    value: 'Account.BillingCity',
                    error: null
                },
                rightHandSide: {
                    value: 'CA',
                    error: null
                },
                rightHandSideDataType: {
                    value: 'String',
                    error: null
                },
                operator: {
                    value: 'EqualTo',
                    error: null
                }
            }
        ],
        maxConnections: 2,
        availableConnections: [
            {
                type: 'FAULT'
            }
        ],
        elementType: ELEMENT_TYPE.RECORD_DELETE,
        dataType: {
            value: 'Boolean',
            error: null
        }
    },
    nodeUpdate: jest.fn()
});

describe('builderUtils', () => {
    describe('Property Editor Config', () => {
        describe('Editor mode (edit, add) correctly returned', () => {
            const modePropertyNestedPath = 'attr.bodyComponent.attr.mode';
            test('Edit mode', () => {
                const actualResult = getPropertyEditorConfig(EDIT_MODE, getAttributes(EDIT_MODE));
                expect(actualResult).toHaveProperty(modePropertyNestedPath, EDIT_MODE);
            });
            test('Add mode', () => {
                const actualResult = getPropertyEditorConfig(ADD_MODE, getAttributes(ADD_MODE));
                expect(actualResult).toHaveProperty(modePropertyNestedPath, ADD_MODE);
            });
            it('sets className based on descriptor', () => {
                const params = getAttributes(ADD_MODE);
                const actualResult = getPropertyEditorConfig(ADD_MODE, params);
                expect(actualResult.attr.bodyComponent.className).toEqual(`${mockPackage}/${mockComponent}`);
            });
        });
    });

    describe('Popover', () => {
        it('showPopover', () => {
            expect(isPopoverOpen()).toBe(false);
            showPopover(
                'builder_platform_interaction:statusIconSummary',
                {},
                {
                    referenceElement: null,
                    onClose: () => {}
                }
            );
            expect(isPopoverOpen()).toBe(true);
        });
    });

    describe('createConfigurationEditor', () => {
        it('throws error if cmp name is not passed', () => {
            expect(() => {
                createConfigurationEditor();
            }).toThrow();
        });
        it('throws error if container is not passed', () => {
            expect(() => {
                createConfigurationEditor({
                    cmpName: 'abc'
                });
            }).toThrow();
        });
    });

    describe('invokePropertyEditor', () => {
        const sampleAttributes = getAttributes(SaveFlowEvent.Type.SAVE);
        it('throws error if attributes is not passed to the function', () => {
            expect(() => {
                invokePropertyEditor('cmpNameOnly');
            }).toThrow();
        });
        it('throws error if attributes does not contain mode', () => {
            expect(() => {
                const missingModeAttributes = Object.assign({}, sampleAttributes);
                delete missingModeAttributes.mode;
                invokePropertyEditor('cmpNameOnly', missingModeAttributes);
            }).toThrow();
        });
        it('throws error if attributes does not contain node', () => {
            expect(() => {
                const missingModeAttributes = Object.assign({}, sampleAttributes);
                delete missingModeAttributes.node;
                invokePropertyEditor('cmpNameOnly', missingModeAttributes);
            }).toThrow();
        });
        it('throws error if attributes does not contain nodeUpdate', () => {
            expect(() => {
                const missingModeAttributes = Object.assign({}, sampleAttributes);
                delete missingModeAttributes.nodeUpdate;
                invokePropertyEditor('cmpNameOnly', missingModeAttributes);
            }).toThrow();
        });
        it('does not throw an error if attributes is complete', () => {
            expect(() => {
                const missingModeAttributes = Object.assign({}, sampleAttributes);
                invokePropertyEditor('cmpNameOnly', missingModeAttributes);
            }).not.toThrow();
        });
    });

    describe('invokeModal', () => {
        it('calls dispatchGlobalEvent w/ expected parameters when given standard parameters', async () => {
            const data = {
                modalClass: 'modalClass',
                bodyClass: 'bodyClass',
                footerClass: 'footerClass',
                flavor: 'flavor',
                headerData: {
                    headerTitle: 'headerTitleStr',
                    headerVariant: 'headerVariantStr'
                },
                bodyData: {
                    bodyTextOne: 'bodyTextOneStr',
                    bodyTextTwo: 'bodyTextTwoStr',
                    listSectionHeader: 'listSectionHeaderStr',
                    listSectionItems: 'listSectionItemsStr',
                    listWarningItems: 'listWarningItemsStr',
                    bodyVariant: 'bodyVariantStr',
                    showBodyTwoVariant: 'showBodyTwoVariantStr'
                },
                footerData: {
                    footerVariant: 'footerVariantStr'
                }
            };

            invokeModal(data);

            await ticks(1);

            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:modalHeader',
                {
                    headerTitle: 'headerTitleStr',
                    headerVariant: 'headerVariantStr'
                },
                expect.anything()
            );

            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:modalBody',
                {
                    bodyTextOne: 'bodyTextOneStr',
                    bodyTextTwo: 'bodyTextTwoStr',
                    bodyVariant: 'bodyVariantStr',
                    listSectionHeader: 'listSectionHeaderStr',
                    listSectionItems: 'listSectionItemsStr',
                    listWarningItems: 'listWarningItemsStr',
                    showBodyTwoVariant: 'showBodyTwoVariantStr'
                },
                expect.anything()
            );

            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:modalFooter',
                {
                    buttons: { footerVariant: 'footerVariantStr' },
                    footerVariant: 'footerVariantStr'
                },
                expect.anything()
            );

            expect(dispatchGlobalEvent).toHaveBeenCalledWith(
                'ui:createPanel',
                expect.objectContaining({
                    onCreate: expect.anything(),
                    panelConfig: {
                        body: [{ getElement: expect.anything() }],
                        bodyClass: 'bodyClass',
                        closeAction: expect.anything(),
                        flavor: 'flavor',
                        footer: [{ getElement: expect.anything() }],
                        footerClass: 'footerClass',
                        header: [{ getElement: expect.anything() }],
                        headerClass: '',
                        modalClass: 'modalClass'
                    },
                    panelType: 'modal',
                    visible: true
                })
            );
        });
    });

    describe('invokeNewFlowModal', () => {
        it('calls dispatchGlobalEvent w/ expected parameters when given standard parameters', async () => {
            invokeNewFlowModal(
                ELEMENT_TYPE.SCREEN_FIELD,
                {
                    showRecommended: true,
                    showAll: true
                },
                jest.fn(),
                jest.fn()
            );

            await ticks(1);

            expect(createComponent).toHaveBeenCalled();
            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:modalHeader',
                {
                    headerTitle: 'FlowBuilderNewFlowModal.headerTitle'
                },
                expect.anything()
            );
            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:newFlowModalBody',
                {
                    showRecommended: true,
                    showAll: true,
                    builderType: 'SCREEN_FIELD'
                },
                expect.anything()
            );
            expect(createComponent).toHaveBeenCalledWith(
                'builder_platform_interaction:modalFooter',
                {
                    buttons: {
                        buttonOne: {
                            buttonLabel: isAutoLayoutCanvasEnabled()
                                ? LABELS.nextButtonLabel
                                : LABELS.createButtonLabel,
                            buttonVariant: 'brand'
                        }
                    }
                },
                expect.anything()
            );
            expect(dispatchGlobalEvent).toHaveBeenCalledWith(
                UI_CREATE_PANEL,
                expect.objectContaining({
                    onCreate: expect.anything(),
                    panelConfig: {
                        body: [
                            {
                                getElement: expect.anything()
                            }
                        ],
                        bodyClass: 'slds-p-around_none slds-is-relative',
                        closeAction: expect.anything(),
                        flavor: 'large restrictWidthToSldsMedium',
                        footer: [
                            {
                                getElement: expect.anything()
                            }
                        ],
                        footerClass: '',
                        header: [
                            {
                                getElement: expect.anything()
                            }
                        ],
                        headerClass: '',
                        modalClass: ''
                    },
                    panelType: 'modal',
                    visible: true
                })
            );
        });
    });

    describe('showHover', () => {
        const sampleAttributes = getAttributes(SaveFlowEvent.Type.SAVE);
        const samplePanelConfig = {
            titleForModal: 'FlowBuilderElementConfig.variableSingularLabel',
            flavor: 'small',
            bodyClass: 'slds-p-around_medium',
            isValid: jest.fn()
        };
        it('calls dispatchGlobalEvent w/ expected parameters when given standard parameters', () => {
            showHover('cmpName', sampleAttributes, 'hoverId', samplePanelConfig);

            expect(dispatchGlobalEvent).toHaveBeenCalledWith(
                UI_CREATE_PANEL,
                expect.objectContaining({
                    onCreate: expect.anything(),
                    onDestroy: expect.anything(),
                    panelConfig: {
                        body: expect.anything(),
                        bodyClass: 'slds-p-around_medium',
                        flavor: 'small',
                        isValid: expect.anything(),
                        titleForModal: 'FlowBuilderElementConfig.variableSingularLabel'
                    },
                    panelType: 'hoverPanel',
                    visible: true
                })
            );
        });
        it('calls dispatchGlobalEvent w/ expected parameters when given standard parameters and panel.isValid = false', () => {
            mockPanelValidity = false;
            showHover('cmpName', sampleAttributes, 'hoverId', samplePanelConfig);
            expect(dispatchGlobalEvent).toHaveBeenCalledWith(
                UI_CREATE_PANEL,
                expect.objectContaining({
                    onCreate: expect.anything(),
                    onDestroy: expect.anything(),
                    panelConfig: {
                        body: expect.anything(),
                        bodyClass: 'slds-p-around_medium',
                        flavor: 'small',
                        isValid: expect.anything(),
                        titleForModal: 'FlowBuilderElementConfig.variableSingularLabel'
                    },
                    panelType: 'hoverPanel',
                    visible: true
                })
            );
            mockPanelValidity = true;
        });
        it('dispatchGlobalEvent to NOT called when createComponent callback status is not SUCCESS ', () => {
            mockCreateComponentCallbackStatus = 'NOTCOOL';
            showHover('cmpName', sampleAttributes, 'hoverId', samplePanelConfig);
            expect(dispatchGlobalEvent).not.toHaveBeenCalled();
            mockCreateComponentCallbackStatus = 'SUCCESS';
        });
    });
});
