import { deepCopy, generateGuid } from 'builder_platform_interaction-store-lib';
import { ACTION_TYPE, CONDITION_LOGIC, METADATA_KEY, ELEMENT_TYPE } from 'builder_platform_interaction-flow-metadata';
import { LABELS } from './element-config-labels';

/**
 * @constant
 * @type {string} MODAL_SIZE large or medium (default)
 */
const MODAL_SIZE = {
    LARGE: 'large', // To be used by screen and decision elementType
    MEDIUM: 'medium'
};

/**
 * @constant elementTypeToComponentMap - Map of different element types to their
 *                                       respective components
 * @type {object}
 */
export const elementTypeToConfigMap = {
    [ELEMENT_TYPE.START_ELEMENT]: {
        nodeConfig: {
            iconName: 'standard:flow',
            maxConnections: 1
        },
        canvasElement: true
    },
    [ELEMENT_TYPE.SUBFLOW]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:flow',
            maxConnections: 2
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.SUBFLOWS,
        labels: {
            singular: LABELS.subflowSingularLabel,
            plural: LABELS.subflowPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.SUBFLOW,
            flowName: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.ACTION_CALL]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:investment_account',
            maxConnections: 2
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.ACTION_CALLS,
        // action call : standard actions and quickactions
        metadataFilter : element => element.actionType !== ACTION_TYPE.EMAIL_ALERT &&
                                    element.actionType !== ACTION_TYPE.APEX &&
                                    element.actionType !== ACTION_TYPE.FLOW &&
                                    element.actionType !== ACTION_TYPE.LOCAL_ACTION,
        labels: {
            singular: LABELS.actionSingularLabel,
            plural: LABELS.actionPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.ACTION_CALL,
            actionName: '',
            actionType: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.APEX_PLUGIN_CALL]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:product_item_transaction',
            maxConnections: 2
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.APEX_PLUGIN_CALLS,
        labels: {
            singular: LABELS.apexPluginSingularLabel,
            plural: LABELS.apexPluginPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.APEX_PLUGIN_CALL,
            apexClass: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.APEX_CALL]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:macros',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.ACTION_CALLS,
        metadataFilter : element => element.actionType === ACTION_TYPE.APEX,
        labels: {
            singular: LABELS.apexSingularLabel,
            plural: LABELS.apexPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.APEX_CALL,
            actionName: '',
            actionType: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.LOCAL_ACTION_CALL]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:marketing_actions',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.ACTION_CALLS,
        metadataFilter : element => element.actionType === ACTION_TYPE.COMPONENT,
        labels: {
            singular: LABELS.localActionSingularLabel,
            plural: LABELS.localActionPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.LOCAL_ACTION_CALL,
            actionName: '',
            actionType: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.EMAIL_ALERT]: {
        descriptor: 'builder_platform_interaction:actioncallEditor',
        nodeConfig: {
            iconName: 'standard:email',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.ACTION_CALLS,
        metadataFilter : element => element.actionType === ACTION_TYPE.EMAIL_ALERT,
        labels: {
            singular: LABELS.emailAlertSingularLabel,
            plural: LABELS.emailAlertPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.EMAIL_ALERT,
            actionName: '',
            actionType: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.ASSIGNMENT]: {
        descriptor: 'builder_platform_interaction:assignmentEditor',
        nodeConfig: {
            iconName: 'standard:lead_list',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.ASSIGNMENTS,
        labels: {
            singular: LABELS.assignmentSingularLabel,
            plural: LABELS.assignmentPluralLabel
        },
        canvasElement: true,
        bodyCssClass: 'slds-p-around_none',
        template: {
            assignmentItems: [
                {
                    assignToReference: '',
                    operator: '',
                    value: {
                        stringValue: ''
                    }
                }
            ],
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.ASSIGNMENT,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },

    [ELEMENT_TYPE.SCREEN]: {
        descriptor: 'builder_platform_interaction:screenEditor',
        nodeConfig: {
            iconName: 'standard:template',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.LARGE,
        metadataKey: METADATA_KEY.SCREENS,
        labels: {
            singular: LABELS.screenSingularLabel,
            plural: LABELS.screenPluralLabel
        },
        canvasElement: true,
        nonHydratableProperties: ['fieldType', 'dataType', 'elementReference', 'numberValue', 'dateValue', 'booleanValue', 'stringValue', 'type'],
        bodyCssClass: 'slds-scrollable_none',
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.SCREEN,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },

    [ELEMENT_TYPE.DECISION]: {
        descriptor: 'builder_platform_interaction:decisionEditor',
        nodeConfig: {
            iconName: 'standard:feed',
            // TODO: This should be set dynamically  based on connector-utils.getMaxConnections
            // https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07B0000004uM1nIAE/view
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.LARGE,
        metadataKey: METADATA_KEY.DECISIONS,
        labels: {
            singular: LABELS.decisionSingularLabel,
            plural: LABELS.decisionPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            defaultConnectorLabel: '[Default Outcome]',
            elementType: ELEMENT_TYPE.DECISION,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: '',
            outcomeReferences: []
        }
    },
    [ELEMENT_TYPE.LOOP]: {
        descriptor: 'builder_platform_interaction:loopEditor',
        nodeConfig: {
            iconName: 'standard:channel_program_history',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.LOOPS,
        labels: {
            singular: LABELS.loopSingularLabel,
            plural: LABELS.loopPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            defaultConnectorLabel: 'Next element',
            elementType: ELEMENT_TYPE.LOOP,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.RECORD_CREATE]: {
        // TODO: recordEditor is only a place holder now.
        descriptor: 'builder_platform_interaction:recordEditor',
        nodeConfig: {
            iconName: 'standard:record',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.RECORD_CREATE,
        labels: {
            singular: LABELS.recordCreateSingularLabel,
            plural: LABELS.recordCreatePluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.RECORD_CREATE,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.RECORD_LOOKUP]: {
        // TODO: recordLookupEditor is only a place holder now.
        descriptor: 'builder_platform_interaction:recordLookupEditor',
        nodeConfig: {
            iconName: 'standard:search',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.RECORD_LOOKUP,
        labels: {
            singular: LABELS.recordLookupSingularLabel,
            plural: LABELS.recordLookupPluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.RECORD_LOOKUP,
            filters: [
                {
                    field: '',
                    operator: '',
                    value: {
                        stringValue: ''
                    }
                }
            ],
            object: '',
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: '',
            sortField : '',
            sortOrder : 'NotSorted',
        }
    },
    [ELEMENT_TYPE.RECORD_DELETE]: {
        // TODO: recordEditor is only a place holder now.
        descriptor: 'builder_platform_interaction:recordEditor',
        nodeConfig: {
            iconName: 'standard:unmatched',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.RECORD_DELETE,
        labels: {
            singular: LABELS.recordDeleteSingularLabel,
            plural: LABELS.recordDeletePluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.RECORD_DELETE,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.RECORD_UPDATE]: {
        // TODO: recordEditor is only a place holder now.
        descriptor: 'builder_platform_interaction:recordEditor',
        nodeConfig: {
            iconName: 'standard:recent',
            maxConnections: 1
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.RECORD_UPDATE,
        labels: {
            singular: LABELS.recordUpdateSingularLabel,
            plural: LABELS.recordUpdatePluralLabel
        },
        canvasElement: true,
        template: {
            config: { isSelected: false },
            connectorCount: 0,
            elementType: ELEMENT_TYPE.RECORD_UPDATE,
            guid: '',
            isCanvasElement: true,
            label: '',
            locationX: 0,
            locationY: 0,
            name: ''
        }
    },
    [ELEMENT_TYPE.OUTCOME]: {
        // OUTCOME is not a canvas element, but is a first class element
        template: {
            name: '',
            label: '',
            guid: '',
            conditionLogic: CONDITION_LOGIC.AND,
            conditions: [
                {
                    leftValueReference: '',
                    operator: '',
                    rightValue: {
                        stringValue: ''
                    },
                }
            ]
        }
    },
    [ELEMENT_TYPE.VARIABLE]: {
        descriptor: 'builder_platform_interaction:variableEditor',
        nodeConfig: {
            iconName: 'utility:type_tool'
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.VARIABLES,
        labels: {
            singular: LABELS.variableSingularLabel,
            plural: LABELS.variablePluralLabel
        },
        canvasElement: false
    },
    [ELEMENT_TYPE.FORMULA]: {
        descriptor: 'builder_platform_interaction:formulaEditor',
        nodeConfig: {
            iconName: 'utility:topic2'
        },
        modalSize: MODAL_SIZE.MEDIUM,
        metadataKey: METADATA_KEY.FORMULAS,
        labels: {
            singular: LABELS.formulaSingularLabel,
            plural: LABELS.formulaPluralLabel
        },
        canvasElement: false
    },
    [ELEMENT_TYPE.DEFAULT]: {
        // defaultEditor doesn't exist but should lead here making it easier to debug the issue
        descriptor: 'builder_platform_interaction:defaultEditor',
        nodeConfig: {
            iconName: 'standard:custom',
            maxConnections: 1
        },
        bodyCssClass: '',
    }
};


/**
 * @param {string}
 *            elementType - String value to choose the actual component from the
 *            map, if empty, default element is chosen
 * @returns {object} Object containing component config
 */
export function getConfigForElementType(elementType) {
    if (
        elementType === null ||
        elementType === undefined ||
        !elementTypeToConfigMap[elementType]
    ) {
        elementType = ELEMENT_TYPE.DEFAULT;
    }
    return elementTypeToConfigMap[elementType];
}

/**
 * Checks if the given element type is an element that is visible on the canvas.
 *
 * @param {String}
 *            elementType one of the values defined in ELEMENT_TYPE
 * @returns {boolean} true if the given element type is a canvas element
 */
export function isCanvasElement(elementType) {
    return !!getConfigForElementType(elementType).canvasElement;
}

/**
 * Gets an empty instance of the given element type.
 *
 * @param {String}
 *            elementType an element type such as 'ASSIGNMENT'
 * @param {Boolean}
 *            hasConnections defaults to true and indicates
 * @returns {Object} an empty element of the given elementType
 */
export function createFlowElement(elementType, hasConnections = true) {
    const config = elementTypeToConfigMap[elementType];
    if (!config) {
        throw new TypeError();
    } else if (!config.template) {
        throw new Error('Template not defined for ' + elementType);
    }
    const template = deepCopy(config.template);
    template.guid = generateGuid(elementType);
    // TODO: is an explicit param necessary or can we just go off the presence of nodeConfig.maxConnections?
    // Would that work for elements with dynamic maxConnection count (like Decisions)?
    if (hasConnections) {
        template.maxConnections = config.nodeConfig.maxConnections;
    }

    return template;
}
