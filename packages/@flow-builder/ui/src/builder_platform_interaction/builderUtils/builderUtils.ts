// @ts-nocheck
// eslint-disable-next-line lwc-core/no-interop-create, lwc-core/no-interop-dispatch, lwc-core/no-interop-render
import { createComponent, dispatchGlobalEvent, renderComponent } from 'aura';
import {
    getConfigForElement,
    getConfigForElementType,
    MODAL_SIZE,
    EDIT_START_RECORD_CHANGE_CONTEXT,
    EDIT_START_SCHEDULE_CONTEXT,
    EDIT_START_JOURNEY_CONTEXT,
    EDIT_START_SCHEDULED_PATHS
} from 'builder_platform_interaction/elementConfig';
import {
    AddElementEvent,
    AddNonCanvasElementEvent,
    EditElementEvent,
    NewResourceEvent,
    AddConnectionEvent,
    SaveFlowEvent
} from 'builder_platform_interaction/events';
import { FLOW_TRIGGER_TYPE } from 'builder_platform_interaction/flowMetadata';
import { LABELS } from './builderUtilsLabels';
import { format, isObject } from 'builder_platform_interaction/commonUtils';
import { clearExpressions } from 'builder_platform_interaction/expressionValidator';
import { getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import { isAutoLayoutCanvasEnabled } from 'builder_platform_interaction/contextLib';

/**
 * @constant state of callback result
 * @type {Object}
 */
const STATE = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
};

/**
 * @constant Panel type  used for modals.
 * @type {string}
 */
const MODAL = 'modal';
const PANEL = 'panel';

export enum modalBodyVariant {
    WARNING_ON_CANVAS_MODE_TOGGLE
}

export enum modalFooterVariant {
    PROMPT
}

/**
 * @constant Panel type used for popovers.
 * @type {string}
 */
const HOVER_PANEL = 'hoverPanel';

/**
 * @constant
 * @type {string}
 */
const UI_CREATE_PANEL = 'ui:createPanel';

/**
 * @constant Tracks instances of created hover panels to help with management.
 * @type {object}
 */
const hoverPanels = {};

/**
 * @constant tracks the popover singleton's state
 * @type {object}
 */
let popoverState = null;

// component name used when calling invokePropertyEditor
export const PROPERTY_EDITOR = 'builder_platform_interaction:propertyEditor';
const RESOURCE_EDITOR = 'builder_platform_interaction:resourceEditor';

/**
 * @param {string} cmpName component name descriptor
 * @param {object} attr attributes for the component
 * @returns {Promise} which resolves with a successful component creation or rejects with an errorMessage
 */
const createComponentPromise = (cmpName, attr) => {
    return new Promise((resolve, reject) => {
        createComponent(cmpName, attr, (newCmp, status, errorMessage) => {
            if (status === STATE.SUCCESS) {
                resolve(newCmp);
            } else if (status === STATE.ERROR) {
                reject(errorMessage);
            }
        });
    });
};

/**
 * @param {string} mode based on the event type
 * @param {string} elementType eg: Assignment, Decision, etc
 * @param element
 * @returns {string} title for the modal
 */
const getTitleForModalHeader = (mode, element) => {
    const elementConfig = getConfigForElement(element);
    if (!elementConfig || !elementConfig.labels) {
        throw new Error('label is not defined in the element config for the element type: ' + element.elementType);
    }

    let titlePrefix = '',
        label;

    switch (mode) {
        case SaveFlowEvent.Type.SAVE:
            label = LABELS.createFlowTitle;
            break;
        case SaveFlowEvent.Type.SAVE_AS:
            label = LABELS.saveFlowAsTitle;
            break;
        case EditElementEvent.EVENT_NAME:
            label = elementConfig.labels.editModal;
            break;
        case AddElementEvent.EVENT_NAME:
            label = elementConfig.labels.newModal;
            break;
        case AddNonCanvasElementEvent.EVENT_NAME:
            titlePrefix = LABELS.newElementHeaderPrefix;
            label = elementConfig.labels.singular;
            break;
        case AddConnectionEvent.EVENT_NAME:
            label = elementConfig.labels.connectorPickerHeader;
            break;
        case FLOW_TRIGGER_TYPE.BEFORE_SAVE:
        case FLOW_TRIGGER_TYPE.AFTER_SAVE:
            label = elementConfig.labels.editTrigger;
            break;
        case FLOW_TRIGGER_TYPE.SCHEDULED:
        case FLOW_TRIGGER_TYPE.SCHEDULED_JOURNEY:
            label = elementConfig.labels.editSchedule;
            break;
        case FLOW_TRIGGER_TYPE.PLATFORM_EVENT:
            label = elementConfig.labels.editPlatform;
            break;
        case EDIT_START_RECORD_CHANGE_CONTEXT:
            label = elementConfig.labels.editTriggerObjectLabel;
            break;
        case EDIT_START_SCHEDULE_CONTEXT:
            label = elementConfig.labels.editObjectAndFiltersLabel;
            break;
        case EDIT_START_JOURNEY_CONTEXT:
            label = elementConfig.labels.editObject;
            break;
        case EDIT_START_SCHEDULED_PATHS:
            label = elementConfig.labels.editScheduledPath;
            break;
        default:
            label = elementConfig.labels.singular;
            break;
    }

    // TODO: There may be languages where the concatenation of titlePrefix and label actually
    // doesn't make sense. We should revisit the way we are constructing the title.
    return titlePrefix ? titlePrefix + ' ' + label : label;
};

const getLabelForOkButton = (mode) => {
    let label;
    if (mode === SaveFlowEvent.Type.SAVE || mode === SaveFlowEvent.Type.SAVE_AS) {
        label = LABELS.saveButtonLabel;
    }
    return label;
};

const getNewResourceConfig = (attributes) => {
    const nodeUpdate = attributes.nodeUpdate;
    const desc = 'builder_platform_interaction:resourceEditor';
    const newResourceInfo = attributes.newResourceInfo;
    const titleForModal = format(
        LABELS.newResourceEditorTitle,
        newResourceInfo && newResourceInfo.newResourceTypeLabel
            ? newResourceInfo.newResourceTypeLabel
            : LABELS.resourceLabel
    );

    const attr = {
        nodeUpdate,
        bodyComponent: {
            desc,
            attr: {
                node: {},
                newResourceInfo
            }
        }
    };

    const panelConfig = {
        titleForModal,
        flavor: MODAL_SIZE.MEDIUM,
        bodyClass: 'slds-p-around_none'
    };

    newResourceConfig = {
        attr,
        panelConfig
    };
    return newResourceConfig;
};

const clearExpressionValidator = (panel) => {
    const panelBody = panel.get('v.body')[0];
    if (panelBody && panelBody.get('v.bodyComponent') && panelBody.get('v.bodyComponent').desc !== RESOURCE_EDITOR) {
        clearExpressions();
    }
};

/**
 * Callback that executes just before closing any property editor modal
 *
 * @param {Object} panel : panel Instance of status icon
 */
const closeActionCallback = (panel) => {
    hidePopover();
    clearExpressionValidator(panel);
    panel.close();
};

/**
 * Gets the connector picker config
 *
 * @param {string} mode based on the event type
 * @param {object} attributes - contains a callback and actual data
 * @returns {object} - contains the attr for the editor and panel config
 */
const getConnectorPickerConfig = (mode, attributes) => {
    if (
        !attributes.nodeUpdate ||
        !attributes.comboboxOptions ||
        !attributes.sourceElementType ||
        !attributes.targetElementLabel
    ) {
        throw new Error(
            'Attributes passed to invoke connector selection panel method are incorrect. Must contain nodeUpdate, comboboxOptions, sourceElementType and targetElementLabel'
        );
    }
    const nodeUpdate = attributes.nodeUpdate,
        comboboxOptions = attributes.comboboxOptions,
        elementType = attributes.sourceElementType,
        elementConfig = getConfigForElementType(elementType),
        bodyText = elementConfig.labels.connectorPickerBodyText,
        comboBoxLabel = elementConfig.labels.comboBoxLabel,
        titleForModal = getTitleForModalHeader(mode, { elementType }),
        targetElementLabel = attributes.targetElementLabel;

    const attr = {
        nodeUpdate,
        bodyComponent: {
            desc: 'builder_platform_interaction:connectorPicker',
            attr: {
                comboboxOptions,
                bodyText,
                comboBoxLabel,
                targetElementLabel
            }
        }
    };

    const panelConfig = {
        titleForModal,
        flavor: MODAL_SIZE.SMALL,
        bodyClass: 'slds-p-around_medium'
    };

    return {
        attr,
        panelConfig
    };
};

/**
 * Gets the property editor descriptor
 *
 * @param {string} mode the event name(addelement, editelement)
 * @param {object} elementConfig - the element config
 * @returns {string|undefined} - the element config descriptor
 */
const getPropertyEditorDescriptor = (mode, elementConfig) => {
    const desc = elementConfig.descriptor;
    if (!isObject(desc)) {
        return desc;
    }
    return desc[mode];
};

/**
 * Convert a property editor descriptor in to a class name for dynamic lwc loading.
 *
 * @param desc
 */
const getPropertyEditorClassName = (desc) => {
    const packageAndClass = desc.split(':');

    return packageAndClass[0] + '/' + packageAndClass[1];
};

const invokeModalWithComponentsOnCreate = (modal, data) => {
    const modalFooter = modal.get('v.footer')[0];
    if (data.closeModalCallback) {
        modalFooter.set('v.closeModalCallback', () => {
            data.closeModalCallback(modal);
        });
    } else {
        modalFooter.set('v.closeModalCallback', modal.close);
    }
    return modalFooter;
};

/**
 * Gets the property editor config
 *
 * @param {string} mode based on the event type
 * @param {object} attributes - contains a callback and actual data
 * @returns {object} - contains the attr for the editor and panel config
 */
export const getPropertyEditorConfig = (mode, attributes) => {
    if (!attributes.node || !attributes.nodeUpdate) {
        throw new Error('Attributes passed to invoke panel method are incorrect. Must contain node and nodeUpdate');
    }

    const nodeUpdate = attributes.nodeUpdate,
        newResourceCallback = attributes.newResourceCallback,
        node = attributes.node,
        elementType = attributes.node.elementType,
        elementConfig = getConfigForElement(attributes.node),
        titleForModal = getTitleForModalHeader(mode, {
            elementType,
            elementSubtype: getValueFromHydratedItem(attributes.node.elementSubtype)
        }),
        labelForOkButton = getLabelForOkButton(mode),
        desc = getPropertyEditorDescriptor(mode, elementConfig),
        className = getPropertyEditorClassName(desc),
        processType = attributes.processType;

    if (!desc) {
        throw new Error('descriptor is not defined in the element config for the element type: ' + elementType);
    }

    const attr = {
        nodeUpdate,
        newResourceCallback,
        bodyComponent: {
            desc,
            className,
            attr: {
                node,
                processType,
                mode
            }
        }
    };

    const panelConfig = {
        titleForModal,
        labelForOkButton,
        flavor: elementConfig.modalSize,
        bodyClass: elementConfig.bodyCssClass || '',
        isLabelCollapsibleToHeader: false,
        isFieldLevelCommitEnabled: false,
        elementType
    };

    return {
        attr,
        panelConfig
    };
};

/**
 * Gets the editor config based on the mode
 *
 * @param {string} mode based on the event type
 * @param {object} attributes - contains a callback and actual data
 * @returns {object} - contains the attr for the editor and panel config
 */
const getEditorConfig = (mode, attributes) => {
    if (mode === AddConnectionEvent.EVENT_NAME) {
        return getConnectorPickerConfig(mode, attributes);
    }
    if (mode === NewResourceEvent.EVENT_NAME) {
        return getNewResourceConfig(attributes);
    }
    return getPropertyEditorConfig(mode, attributes);
};

/**
 * Invokes the ui-panel
 *
 * @param {string} cmpName - Name of the component to be created
 * @param {object} attr - contains a callback and actual data
 * @param {object} panelConfig - contains the modal title, flavor and css for the editor
 */
const doInvoke = (cmpName, attr, panelConfig) => {
    const propertyEditorBodyPromise = createComponentPromise(cmpName, attr);
    const propertyEditorHeaderPromise = createComponentPromise('builder_platform_interaction:propertyEditorHeader', {
        titleForModal: panelConfig.titleForModal
    });
    let propertyEditorFooterPromise;
    if (panelConfig.labelForOkButton) {
        propertyEditorFooterPromise = createComponentPromise('builder_platform_interaction:propertyEditorFooter', {
            labelForOkButton: panelConfig.labelForOkButton
        });
    } else {
        propertyEditorFooterPromise = createComponentPromise('builder_platform_interaction:propertyEditorFooter');
    }
    Promise.all([propertyEditorBodyPromise, propertyEditorHeaderPromise, propertyEditorFooterPromise])
        .then((newComponents) => {
            const createPanelEventAttributes = {
                panelType: MODAL,
                visible: true,
                panelConfig: {
                    body: newComponents[0],
                    flavor: panelConfig.flavor,
                    bodyClass: panelConfig.bodyClass,
                    header: newComponents[1],
                    footer: newComponents[2],
                    closeAction: (panel) => {
                        closeActionCallback(panel);
                    }
                },
                onCreate: (panel) => {
                    const panelFooter = panel.get('v.footer')[0];
                    panelFooter.set('v.panelInstance', panel);
                    panelFooter.set('v.closeActionCallback', closeActionCallback);
                    const panelBody = panel.get('v.body')[0];
                    panelBody.set('v.panelInstance', panel);
                    panelBody.set('v.closeActionCallback', closeActionCallback);
                }
            };
            dispatchGlobalEvent(UI_CREATE_PANEL, createPanelEventAttributes);
        })
        .catch((errorMessage) => {
            throw new Error('UI panel creation failed: ' + errorMessage);
        });
};

/**
 * Callback invoked when the popover is created
 *
 * @param {Object} panelInstance - the panel instance
 */
function onCreatePopover(panelInstance) {
    popoverState.panelInstance = panelInstance;
}

/**
 * Callback invoked when the popover is destroyed
 *
 * @param panel
 */
function onDestroyPopover(panel) {
    if (popoverState) {
        const { onClose } = popoverState;

        if (onClose) {
            onClose(panel);
        }

        panel.close(null, false); // set shouldReturnFocus param to false to prevent focus from leaving modal on closing the popover
        popoverState = null;
    }
}

/**
 * Invokes the panel and creates property editor inside it
 *
 * @param {string} cmpName - Name of the component to be created
 * @param {object} attributes - contains a callback and actual data
 */
export function invokePropertyEditor(cmpName, attributes) {
    if (!attributes || !attributes.mode) {
        throw new Error(
            'Attributes passed to invoke connector selection panel method are incorrect. Must contain a mode'
        );
    }

    const mode = attributes.mode;

    const { attr, panelConfig } = getEditorConfig(mode, attributes);

    doInvoke(cmpName, attr, panelConfig);
}

/**
 * Invokes the debug modal.
 *
 * @param {object} attributes - contains a callback and actual data
 */
export function invokeDebugEditor(attributes) {
    if (!attributes || !attributes.flowId) {
        throw new Error('Attributes passed to invoke debug editor is not correct. Must contain flow Id');
    }

    const flowName = attributes.flowDevName;
    const flowId = attributes.flowId;
    const processType = attributes.processType;
    const triggerType = attributes.triggerType;
    const rerun = attributes.rerun;
    const isCreateOrUpdate = attributes.isCreateOrUpdate;
    const recordTriggerType = attributes.recordTriggerType;
    const dollarRecordName = attributes.dollarRecordName;
    const scheduledPathsList = attributes.scheduledPathsList;
    const showScheduledPathComboBox = attributes.showScheduledPathComboBox;
    const defaultPath = attributes.defaultPath;

    showDebugEditorPopover(
        'builder_platform_interaction:modalHeader',
        'builder_platform_interaction:debugEditor',
        'builder_platform_interaction:modalFooter',
        {
            flowName,
            flowId,
            processType,
            triggerType,
            rerun,
            isCreateOrUpdate,
            recordTriggerType,
            dollarRecordName,
            scheduledPathsList,
            showScheduledPathComboBox,
            defaultPath
        },
        {
            flavor: 'small slds-modal_medium'
        },
        attributes.runDebugInterviewCallback
    );
}

/**
 * Invokes modals with the specified header, body, and footer promises.
 *
 * @param data - contains data for modal header/body/footer
 * @param modalHeaderPromise - the promise for the header.
 * @param modalBodyPromise - the promise for the body.
 * @param modalFooterPromise - the promise for footer.
 * @param onCreate - function to apply specific behavior on create
 */
export const invokeModalWithComponents = (
    data,
    modalHeaderPromise,
    modalBodyPromise,
    modalFooterPromise,
    onCreate = invokeModalWithComponentsOnCreate
) => {
    Promise.all([modalHeaderPromise, modalBodyPromise, modalFooterPromise])
        .then((newComponents) => {
            const createPanelEventAttributes = {
                panelType: MODAL,
                visible: true,
                panelConfig: {
                    header: newComponents[0],
                    body: newComponents[1],
                    footer: newComponents[2],
                    modalClass: data.modalClass || '',
                    headerClass: data.headerClass || '',
                    bodyClass: data.bodyClass || '',
                    footerClass: data.footerClass || '',
                    flavor: data.flavor || '',
                    closeAction: (modal) => {
                        let skipCloseAction = false;
                        if (data.closeCallback) {
                            skipCloseAction = data.closeCallback();
                        }
                        if (!skipCloseAction) {
                            modal.close();
                        }
                    }
                },
                onCreate: (modal) => {
                    onCreate(modal, data);
                }
            };
            dispatchGlobalEvent(UI_CREATE_PANEL, createPanelEventAttributes);
        })
        .catch((errorMessage) => {
            throw new Error('Modal creation failed : ' + errorMessage);
        });
};

const invokeWelcomeMatWithComponents = (data, modalBodyPromise, onCreate) => {
    modalBodyPromise.then((newComponent) => {
        const createPanelEventAttributes = {
            panelType: MODAL,
            visible: true,
            panelConfig: {
                modalClass: data.modalClass || '',
                body: newComponent,
                bodyClass: data.bodyClass || '',
                closeAction: (modal) => {
                    let skipCloseAction = false;
                    if (data.closeCallback) {
                        skipCloseAction = data.closeCallback();
                    }
                    if (!skipCloseAction) {
                        modal.close();
                    }
                }
            },
            onCreate: (modal) => {
                onCreate(modal);
            }
        };
        dispatchGlobalEvent(UI_CREATE_PANEL, createPanelEventAttributes);
    });
};

/**
 * Open Debug Editor Popover.
 *
 * @param {string} cmpHeader - Name of the header component to be created.
 * @param {string} cmpBody - Name of the body component to be created.
 * @param {string} cmpFooter - Name of the footer component to be created.
 * @param {object} cmpAttributes - Contains components' attributes.
 * @param {object} popoverProps - Contains popover properties
 * @param {Function} runDebugInterviewCallback - callback after Run button is clicked
 */
function showDebugEditorPopover(
    cmpHeader,
    cmpBody,
    cmpFooter,
    cmpAttributes = {},
    popoverProps,
    runDebugInterviewCallback
) {
    if (isPopoverOpen()) {
        return;
    }

    popoverState = {
        panelInstance: null,
        referenceElement: popoverProps.referenceElement,
        onClose: popoverProps.onClose
    };

    const headerPromise = createComponentPromise(cmpHeader, {
        headerTitle: LABELS.newDebugEditorTitle
    });
    const footerPromise = createComponentPromise(cmpFooter, {
        buttons: {
            buttonOneClass: '.test-debug-modal-footer-run-button',
            buttonTwoClass: '.test-debug-modal-footer-cancel-button',
            buttonOne: {
                buttonLabel: LABELS.runTitle,
                buttonVariant: 'brand'
            },
            buttonTwo: {
                buttonLabel: LABELS.cancelButton,
                buttonVariant: 'neutral',
                buttonCallback: hidePopover,
                closeCallback: false
            }
        }
    });
    const bodyPromise = createComponentPromise(cmpBody, {
        flowName: cmpAttributes.flowName,
        flowId: cmpAttributes.flowId,
        processType: cmpAttributes.processType,
        triggerType: cmpAttributes.triggerType,
        rerun: cmpAttributes.rerun,
        isCreateOrUpdate: cmpAttributes.isCreateOrUpdate,
        recordTriggerType: cmpAttributes.recordTriggerType,
        dollarRecordName: cmpAttributes.dollarRecordName,
        scheduledPathsList: cmpAttributes.scheduledPathsList,
        showScheduledPathComboBox: cmpAttributes.showScheduledPathComboBox,
        defaultPath: cmpAttributes.defaultPath
    });
    const invokeModalWithComponentsOnCreateOverride = (modal, data) => {
        onCreatePopover(modal);
        invokeModalWithComponentsOnCreate(modal, data);
    };

    invokeModalWithComponents(
        {
            flavor: popoverProps.flavor,
            closeCallback: hidePopover,
            closeModalCallback: runDebugInterviewCallback
        },
        headerPromise,
        bodyPromise,
        footerPromise,
        invokeModalWithComponentsOnCreateOverride
    );
}

/**
 * Invokes the modal and creates the alert/confirmation modal inside it
 *
 * @param {object} data - contains data for modal header/body/footer
 */
export const invokeModal = (data) => {
    const modalHeaderPromise = createComponentPromise('builder_platform_interaction:modalHeader', {
        headerTitle: data.headerData.headerTitle,
        headerVariant: data.headerData.headerVariant
    });
    const modalBodyPromise = createComponentPromise('builder_platform_interaction:modalBody', {
        bodyTextOne: data.bodyData.bodyTextOne,
        bodyTextTwo: data.bodyData.bodyTextTwo,
        listSectionHeader: data.bodyData.listSectionHeader,
        listSectionItems: data.bodyData.listSectionItems,
        listWarningItems: data.bodyData.listWarningItems,
        bodyVariant: data.bodyData.bodyVariant,
        showBodyTwoVariant: data.bodyData.showBodyTwoVariant
    });
    const modalFooterPromise = createComponentPromise('builder_platform_interaction:modalFooter', {
        buttons: data.footerData,
        footerVariant: data.footerData.footerVariant
    });

    invokeModalWithComponents(
        data,
        modalHeaderPromise,
        modalBodyPromise,
        modalFooterPromise,
        invokeModalWithComponentsOnCreate
    );
};

/**
 * Invokes the internal data modal and creates the alert/confirmation modal inside it.
 * This should only be used when displaying internal only data.
 *
 * @param data
 */
export const invokeModalInternalData = (data) => {
    const modalHeaderPromise = createComponentPromise('builder_platform_interaction:modalHeader', {
        headerTitle: data.headerData.headerTitle
    });
    const modalBodyPromise = createComponentPromise('builder_platform_interaction:modalBodyInternalData', {
        bodyTextOne: data.bodyData.bodyTextOne,
        bodyTextTwo: data.bodyData.bodyTextTwo,
        listSectionHeader: data.bodyData.listSectionHeader,
        listSectionItems: data.bodyData.listSectionItems
    });
    const modalFooterPromise = createComponentPromise('builder_platform_interaction:modalFooter', {
        buttons: data.footerData
    });

    invokeModalWithComponents(
        data,
        modalHeaderPromise,
        modalBodyPromise,
        modalFooterPromise,
        invokeModalWithComponentsOnCreate
    );
};

export const invokeAutoLayoutWelcomeMat = (processType, triggerType, createCallback, closeFlowModalCallback) => {
    const modalBodyPromise = createComponentPromise('builder_platform_interaction:welcomeMatBody', {
        processType,
        triggerType,
        createCallback
    });

    const invokeModalWithComponentsOnCreateOverride = (modal) => {
        const panelBody = modal.get('v.body')[0];
        panelBody.set('v.closeCallback', modal.close);
    };

    invokeWelcomeMatWithComponents(
        {
            modalClass: 'slds-modal_small',
            closeCallback: closeFlowModalCallback
        },
        modalBodyPromise,
        invokeModalWithComponentsOnCreateOverride
    );
};

/**
 * @typedef {Object} NewFlowModalProperties
 * @property {string} bodyClass
 * @property {string} flavor
 */
/**
 * Invokes the new flow modal.
 *
 * @param {NewFlowModalProperties} modalProperties
 * @param builderType
 * @param configuration
 * @param {Function} closeFlowModalAction the callback to execute when clicking the exit icon
 * @param {Function} createFlowFromTemplateCallback the callback to execute when clicking the create button
 */
export const invokeNewFlowModal = (
    builderType,
    configuration = {
        showRecommended: true,
        showAll: true
    },
    closeFlowModalAction,
    createFlowFromTemplateCallback
) => {
    const modalHeaderPromise = createComponentPromise('builder_platform_interaction:modalHeader', {
        headerTitle: LABELS.headerTitle
    });

    const modalBodyPromise = createComponentPromise('builder_platform_interaction:newFlowModalBody', {
        ...configuration,
        builderType
    });
    const modalFooterPromise = createComponentPromise('builder_platform_interaction:modalFooter', {
        buttons: {
            buttonOne: {
                buttonLabel: isAutoLayoutCanvasEnabled() ? LABELS.nextButtonLabel : LABELS.createButtonLabel,
                buttonVariant: 'brand'
            }
        }
    });

    const invokeModalWithComponentsOnCreateOverride = (modal, data) => {
        const modalFooter = invokeModalWithComponentsOnCreate(modal, data);
        const panelBody = modal.get('v.body')[0];
        panelBody.set('v.footer', modalFooter);
    };

    invokeModalWithComponents(
        {
            bodyClass: 'slds-p-around_none slds-is-relative',
            flavor: MODAL_SIZE.LARGE,
            closeCallback: closeFlowModalAction,
            closeModalCallback: createFlowFromTemplateCallback
        },
        modalHeaderPromise,
        modalBodyPromise,
        modalFooterPromise,
        invokeModalWithComponentsOnCreateOverride
    );
};

/**
 * NOTE: Please do not use this without contacting Process UI DesignTime first!
 *
 * Shows a popover/hoverPanel.
 *
 * Sample panelConfig for the left-panel hover:
 * {
 *     flavor: 'default',
 *     'class': 'slds-popover_medium',
 *     referenceElement: event.target,
 *     enableAutoPlacement: false,
 *     direction: 'east',
 *     showCloseButton: false,
 *     showPointer: true,
 *     autoFocus: false,
 *     closeOnClickOut: true,
 *     enableFocusHoverPanelEventHandler: false
 * }
 *
 * @param {string} cmpName Name of the component to be created for the popover body
 * @param {object} attr Attributes values to use when creating an instance of cmpName
 * @param {string} hoverId Identifier to use for the popover
 * @param {object} panelConfig Attributes to use for the ui:createPanel event
 */
export function showHover(cmpName, attr, hoverId, panelConfig) {
    createComponent(cmpName, attr, (newCmp, status) => {
        if (status === STATE.SUCCESS) {
            panelConfig.body = newCmp;

            const config = {
                panelType: HOVER_PANEL,
                visible: true,
                panelConfig,
                onCreate: (hoverPanel) => {
                    if (hoverPanel.isValid()) {
                        hoverPanels[hoverId] = hoverPanel;
                    }
                },
                onDestroy: () => {
                    delete hoverPanels[hoverId];
                }
            };
            dispatchGlobalEvent(UI_CREATE_PANEL, config);
        }
    });
}

/**
 *
 */
export function invokeKeyboardHelpDialog() {
    const modalHeaderPromise = createComponentPromise('builder_platform_interaction:modalHeader', {
        headerTitle: LABELS.keyboardShortcutListTitle
    });
    const modalBodyPromise = createComponentPromise('builder_platform_interaction:keyboardShortcutsListBody', {});
    const modalFooterPromise = createComponentPromise('builder_platform_interaction:modalFooter', {
        buttons: {
            buttonOne: {
                buttonLabel: LABELS.okayButtonLabel,
                buttonVariant: 'brand'
            }
        }
    });
    invokeModalWithComponents(
        {
            bodyClass: 'slds-p-around_none slds-is-relative',
            flavor: MODAL_SIZE.SMALL
        },
        modalHeaderPromise,
        modalBodyPromise,
        modalFooterPromise
    );
}

/**
 * NOTE: Please do not use this without contacting Process UI DesignTime first!
 *
 * Hides the popover/hoverPanel with the given hoverId.
 *
 * @param {string} hoverId Identifier of the popover to hide
 */
export function hideHover(hoverId) {
    const hoverPanel = hoverPanels[hoverId];
    if (hoverPanel) {
        hoverPanel.requestClose();
    }
}

/**
 * @returns {Object} The DOM element that is used to anchor the popover
 */
export function getPopoverReferenceElement() {
    return isPopoverOpen() ? popoverState.referenceElement : null;
}

/**
 * Checks if the popover singleton is opened
 *
 * @returns {boolean} - whether the popover is open
 */
export function isPopoverOpen() {
    return !!popoverState;
}

/**
 * Hides the popover singleton
 *
 * @param root0
 * @param root0.closedBy
 */
export function hidePopover({ closedBy } = {}) {
    if (isPopoverOpen()) {
        const panelInstance = popoverState.panelInstance;
        if (closedBy) {
            panelInstance.closedBy = closedBy;
        }
        onDestroyPopover(panelInstance);
    }
}

/**
 * Object containing popover properties
 *
 * @typedef {object} popoverProps - Contains popover attributes
 * @property {string} direction - Direction for the popover
 * @property {string} referenceElement - DOM element used to position the popover
 * @property {boolean} closeOnClickOut - Whether to close the popover on click out
 * @property {Function} onClose - Callback invoked when the popover is closed
 */

/**
 * Shows a component in a popover singleton
 *
 * @param {string} cmpName - Name of the component to be created
 * @param {object} cmpAttributes - Contains component attributes
 * @param {object} popoverProps - Contains popover properties
 */
export function showPopover(cmpName, cmpAttributes = {}, popoverProps) {
    if (isPopoverOpen()) {
        return;
    }

    const { direction, onClose, referenceElement, closeOnClickOut, showCloseButton } = popoverProps;

    popoverState = {
        panelInstance: null,
        referenceElement,
        onClose
    };

    const componentPromise = createComponentPromise(cmpName, cmpAttributes);

    Promise.resolve(componentPromise)
        .then((newComponent) => {
            const createPanelEventAttributes = {
                panelType: PANEL,
                visible: true,
                panelConfig: {
                    body: newComponent,
                    flavor: 'popover',
                    direction,
                    showPointer: true,
                    referenceElement,
                    closeAction: onDestroyPopover,
                    closeOnClickOut: !!closeOnClickOut,
                    titleDisplay: false,
                    showCloseButton
                },
                onCreate: onCreatePopover
            };
            dispatchGlobalEvent(UI_CREATE_PANEL, createPanelEventAttributes);
        })
        .catch((errorMessage) => {
            throw new Error('Status Icon Panel creation failed : ' + errorMessage);
        });
}

/**
 * Create LWC component dynamically for custom property editor
 * PLEASE DON'T USE THIS UTIL EXCEPT FOR CUSTOM PROPERTY EDITOR
 *
 * @param root0
 * @param root0.cmpName
 * @param root0.container
 * @param root0.attr
 * @param root0.errorCallback
 * @param root0.successCallback
 */
export function createConfigurationEditor({
    cmpName,
    container,
    attr = {},
    errorCallback = () => {},
    successCallback = () => {}
}) {
    if (!cmpName) {
        throw new Error('Component name is not defined');
    }
    if (!container) {
        throw new Error('Container component is not defined');
    }
    let newCmp;
    createComponentPromise(cmpName, attr)
        .then((cmp) => {
            renderComponent(cmp, container);
            newCmp = cmp;
            successCallback(newCmp);
        })
        .catch(errorCallback);

    const unrender = () => {
        if (newCmp) {
            // eslint-disable-next-line lwc-core/no-aura
            window.$A.unrender(newCmp);
            newCmp.destroy();
        }
    };
    return unrender;
}

/**
 *
 */
export function focusOnDockingPanel() {
    dispatchGlobalEvent('force:shortcutCommand', { command: 'GoToPrompt', args: null });
}
