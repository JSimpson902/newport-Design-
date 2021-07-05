// @ts-nocheck
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { UNDO, REDO, CLEAR_UNDO_REDO } from 'builder_platform_interaction/undoRedoLib';

export const UPDATE_ENTITIES = 'UPDATE_ENTITIES';
export const UPDATE_FLOW = 'UPDATE_FLOW';

export const UPDATE_PROPERTIES = 'UPDATE_PROPERTIES';
export const UPDATE_PROPERTIES_AFTER_SAVE_FAILED = 'UPDATE_PROPERTIES_AFTER_SAVE_FAILED';
export const UPDATE_PROPERTIES_AFTER_SAVING = 'UPDATE_PROPERTIES_AFTER_SAVING';
export const UPDATE_PROPERTIES_AFTER_ACTIVATING = 'UPDATE_PROPERTIES_AFTER_ACTIVATING';
export const UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_TEMPLATE =
    'UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_TEMPLATE';
export const UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_PROCESS_TYPE_AND_TRIGGER_TYPE =
    'UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_PROCESS_TYPE_AND_TRIGGER_TYPE';

export const DO_DUPLICATE = 'DO_DUPLICATE';

export const ADD_CANVAS_ELEMENT = 'ADD_CANVAS_ELEMENT';
export const UPDATE_CANVAS_ELEMENT = 'UPDATE_CANVAS_ELEMENT';
export const UPDATE_CANVAS_ELEMENT_LOCATION = 'UPDATE_CANVAS_ELEMENT_LOCATION';

export const DELETE_ELEMENT = 'DELETE_ELEMENT';

export const ADD_RESOURCE = 'ADD_RESOURCE';
export const UPDATE_VARIABLE_CONSTANT = 'UPDATE_VARIABLE_CONSTANT';
export const UPDATE_RESOURCE = 'UPDATE_RESOURCE';
export const DELETE_RESOURCE = 'DELETE_RESOURCE';

export const ADD_CONNECTOR = 'ADD_CONNECTOR';

export const SELECT_ON_CANVAS = 'SELECT_ON_CANVAS';
export const TOGGLE_ON_CANVAS = 'TOGGLE_ON_CANVAS';
export const DESELECT_ON_CANVAS = 'DESELECT_ON_CANVAS';

export const MARQUEE_SELECT_ON_CANVAS = 'MARQUEE_SELECT_ON_CANVAS';

export const ALC_CREATE_CONNECTION = 'ALC_CREATE_CONNECTION';
export const CREATE_GOTO_CONNECTION = 'CREATE_GOTO_CONNECTION';
export const DELETE_GOTO_CONNECTION = 'DELETE_GOTO_CONNECTION';
export const ADD_FAULT = 'ADD_FAULT';
export const DELETE_FAULT = 'DELETE_FAULT';
export const SELECTION_ON_FIXED_CANVAS = 'SELECTION_ON_FIXED_CANVAS';
export const PASTE_ON_FIXED_CANVAS = 'PASTE_ON_FIXED_CANVAS';

export const HIGHLIGHT_ON_CANVAS = 'HIGHLIGHT_ON_CANVAS';

export const ADD_DECISION_WITH_OUTCOMES = 'ADD_DECISION_WITH_OUTCOMES';
export const MODIFY_DECISION_WITH_OUTCOMES = 'MODIFY_DECISION_WITH_OUTCOMES';

export const ADD_WAIT_WITH_WAIT_EVENTS = 'ADD_WAIT_WITH_WAIT_EVENTS';
export const MODIFY_WAIT_WITH_WAIT_EVENTS = 'MODIFY_WAIT_WITH_WAIT_EVENTS';

export const ADD_START_WITH_SCHEDULED_PATHS = 'ADD_START_WITH_SCHEDULED_PATHS';
export const MODIFY_START_WITH_SCHEDULED_PATHS = 'MODIFY_START_WITH_SCHEDULED_PATHS';

export const UPDATE_RECORD_LOOKUP = 'UPDATE_RECORD_LOOKUP';

export const ADD_SCREEN_WITH_FIELDS = 'ADD_SCREEN_WITH_FIELDS';
export const MODIFY_SCREEN_WITH_FIELDS = 'MODIFY_SCREEN_WITH_FIELDS';

export const ADD_PARENT_WITH_CHILDREN = 'ADD_PARENT_WITH_CHILDREN';
export const MODIFY_PARENT_WITH_CHILDREN = 'MODIFY_PARENT_WITH_CHILDREN';
export const ADD_CHILD = 'ADD_CHILD';
export const DELETE_CHILDREN = 'DELETE_CHILDREN';

export const ADD_START_ELEMENT = 'ADD_START_ELEMENT';

export const UPDATE_INLINE_RESOURCE_PROPERTIES = 'UPDATE_INLINE_RESOURCE_PROPERTIES';

export const REMOVE_LAST_CREATED_INLINE_RESOURCE = 'REMOVE_LAST_CREATED_INLINE_RESOURCE';

export enum PROPERTY_EDITOR_ACTION {
    ADD_ASSIGNMENT_ITEM = 'ADD_ASSIGNMENT_ITEM',
    ADD_DECISION_OUTCOME = 'ADD_DECISION_OUTCOME',
    ADD_EMPTY_OUTPUT_ASSIGNMENT = 'addemptyoutputassignment',
    ADD_FILTER_ITEM = 'addrecordfilter',
    ADD_SCREEN_FIELD = 'ADD_SCREEN_FIELD',
    ADD_START_ELEMENT_SCHEDULED_PATH = 'addstartelementscheduledpath',
    ADD_WAIT_EVENT = 'ADD_WAIT_EVENT',
    CHANGE_ACTION_TYPE = 'CHANGE_ACTION_TYPE',
    CHANGE_DATA_TYPE = 'CHANGE_DATA_TYPE',
    DELETE_ASSIGNMENT_ITEM = 'DELETE_ASSIGNMENT_ITEM',
    DELETE_FILTER_ITEM = 'deleterecordfilter',
    UPDATE_ASSIGNMENT_ITEM = 'UPDATE_ASSIGNMENT_ITEM',
    UPDATE_ELEMENT_PROPERTY = 'UPDATE_ELEMENT_PROPERTY',
    UPDATE_ELEMENT_VALUE = 'UPDATE_ELEMENT_VALUE',
    UPDATE_FILTER_ITEM = 'updaterecordfilter',
    UPDATE_OUTPUT_ASSIGNMENTS_BEFORE_CLOSE = 'updateoutputassignmentbeforeclose',
    UPDATE_START_ELEMENT_SCHEDULED_PATH = 'updatestartelementscheduledpath'
}

export const ADD_END_ELEMENT = 'ADD_END_ELEMENT';

export const UPDATE_APEX_CLASSES = 'UPDATE_APEX_CLASSES';

export const DECORATE_CANVAS = 'DECORATE_CANVAS';

export const CLEAR_CANVAS_DECORATION = 'CLEAR_CANVAS_DECORATION';

export const UPDATE_FLOW_ON_CANVAS_MODE_TOGGLE = 'UPDATE_FLOW_ON_CANVAS_MODE_TOGGLE';

export const UPDATE_IS_AUTO_LAYOUT_CANVAS_PROPERTY = 'UPDATE_IS_AUTO_LAYOUT_CANVAS_PROPERTY';

export const RESET_GOTOS = 'RESET_GOTOS';

/**
 * Helper function to create actions.
 *
 * @param {string} type - action type
 * @param {Object} payload - data
 * @returns {Object} action new action based on type and payload
 */
export const createAction = (type, payload = {}) => ({ type, payload });

/**
 * Action for updating flow information in the store.
 * To be used when we get flow metadata from backend or when we create a new flow.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updateFlow = (payload) => createAction(UPDATE_FLOW, payload);

/**
 * @returns {Object} Undo Action without any payload.
 */
export const undo = createAction(UNDO);

/**
 * @returns {Object} Redo Action without any payload.
 */
export const redo = createAction(REDO);

/**
 * @returns {Object} Clear Undo Redo Action
 * To be used for clear undo redo stack. Please talk to the Process UI Design time team before using this.
 */
export const clearUndoRedo = createAction(CLEAR_UNDO_REDO);

/**
 * Action for updating flow properties in the store.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updateProperties = (payload) => createAction(UPDATE_PROPERTIES, payload);

/**
 * Action for updating flow properties in the store, when the save flow call is failed.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */

export const updatePropertiesAfterSaveFailed = (payload) => createAction(UPDATE_PROPERTIES_AFTER_SAVE_FAILED, payload);
/**
 * Action for updating flow properties in the store after saving a flow.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updatePropertiesAfterSaving = (payload) => createAction(UPDATE_PROPERTIES_AFTER_SAVING, payload);
/**
 * Action for updating flow properties in the store after activating a flow.
 *
 * @param {Object} payload - contains new flow status
 * @returns {Object} action new action based on type and payload
 */
export const updatePropertiesAfterActivateButtonPress = (payload) =>
    createAction(UPDATE_PROPERTIES_AFTER_ACTIVATING, payload);

/**
 * Action for updating flow properties in the store after creating a flow from template.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updatePropertiesAfterCreatingFlowFromTemplate = (payload) =>
    createAction(UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_TEMPLATE, payload);

/**
 * Action for updating flow properties in the store after creating a flow.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updatePropertiesAfterCreatingFlowFromProcessTypeAndTriggerType = (payload) =>
    createAction(UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_PROCESS_TYPE_AND_TRIGGER_TYPE, payload);

/**
 * Action for duplicating canvas elements and connectors.
 *
 * @param {Object} payload - contains canvasElementGuidMap, childElementGuidMap, connectorsToDuplicate
 * @returns {Object} action - new action based on type and payload
 */
export const doDuplicate = (payload) => createAction(DO_DUPLICATE, payload);

/**
 * Action for adding a new element in the store.
 *
 * @param {Object} payload - contains new element value to be added
 * @returns {Object} action new action based on type and payload
 */
export const addElement = (payload) => {
    if (payload) {
        switch (payload.elementType) {
            case ELEMENT_TYPE.VARIABLE:
            case ELEMENT_TYPE.CONSTANT:
            case ELEMENT_TYPE.FORMULA:
            case ELEMENT_TYPE.TEXT_TEMPLATE:
            case ELEMENT_TYPE.STAGE:
            case ELEMENT_TYPE.CHOICE:
            case ELEMENT_TYPE.PICKLIST_CHOICE_SET:
            case ELEMENT_TYPE.RECORD_CHOICE_SET:
                return createAction(ADD_RESOURCE, payload);
            case ELEMENT_TYPE.DECISION_WITH_MODIFIED_AND_DELETED_OUTCOMES:
                return createAction(ADD_DECISION_WITH_OUTCOMES, payload);
            case ELEMENT_TYPE.WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS:
                return createAction(ADD_WAIT_WITH_WAIT_EVENTS, payload);
            case ELEMENT_TYPE.SCREEN_WITH_MODIFIED_AND_DELETED_SCREEN_FIELDS:
                return createAction(ADD_SCREEN_WITH_FIELDS, payload);
            case ELEMENT_TYPE.ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS:
                return createAction(ADD_PARENT_WITH_CHILDREN, payload);
            case ELEMENT_TYPE.STAGE_STEP:
                return createAction(ADD_CHILD, payload);
            case ELEMENT_TYPE.START_ELEMENT:
                return createAction(ADD_START_ELEMENT, payload);
            case ELEMENT_TYPE.END_ELEMENT:
                return createAction(ADD_END_ELEMENT, payload);
            default:
                if (payload.isCanvasElement) {
                    return createAction(ADD_CANVAS_ELEMENT, payload);
                }
                // Added to support strategy builder non-canvas elements
                return createAction(ADD_RESOURCE, payload);
        }
    }
    return {};
};

/**
 * Action for updating an element in the store.
 *
 * For variables & constants, all existing data for the element in the store will be overwritten
 *
 * @param {Object} payload - contains GUID of the element to be updated and new values
 * @returns {Object} action new action based on type and payload
 */
export const updateElement = (payload) => {
    if (payload) {
        switch (payload.elementType) {
            case ELEMENT_TYPE.VARIABLE:
            case ELEMENT_TYPE.CONSTANT:
                return createAction(UPDATE_VARIABLE_CONSTANT, payload);
            case ELEMENT_TYPE.TEXT_TEMPLATE:
            case ELEMENT_TYPE.FORMULA:
            case ELEMENT_TYPE.STAGE:
            case ELEMENT_TYPE.CHOICE:
            case ELEMENT_TYPE.PICKLIST_CHOICE_SET:
            case ELEMENT_TYPE.RECORD_CHOICE_SET:
                return createAction(UPDATE_RESOURCE, payload);
            case ELEMENT_TYPE.DECISION_WITH_MODIFIED_AND_DELETED_OUTCOMES:
                return createAction(MODIFY_DECISION_WITH_OUTCOMES, payload);
            case ELEMENT_TYPE.WAIT_WITH_MODIFIED_AND_DELETED_WAIT_EVENTS:
                return createAction(MODIFY_WAIT_WITH_WAIT_EVENTS, payload);
            case ELEMENT_TYPE.START_WITH_MODIFIED_AND_DELETED_SCHEDULED_PATHS:
                return createAction(MODIFY_START_WITH_SCHEDULED_PATHS, payload);
            case ELEMENT_TYPE.RECORD_LOOKUP:
                return createAction(UPDATE_RECORD_LOOKUP, payload);
            case ELEMENT_TYPE.SCREEN_WITH_MODIFIED_AND_DELETED_SCREEN_FIELDS:
                return createAction(MODIFY_SCREEN_WITH_FIELDS, payload);
            case ELEMENT_TYPE.ORCHESTRATED_STAGE_WITH_MODIFIED_AND_DELETED_STEPS:
                return createAction(MODIFY_PARENT_WITH_CHILDREN, payload);
            default:
                if (payload.isCanvasElement) {
                    return createAction(UPDATE_CANVAS_ELEMENT, payload);
                }

                // Added to support strategy builder non-canvas elements
                return createAction(UPDATE_RESOURCE, payload);
        }
    }
    return {};
};

/**
 * Action for deleting an element or multiple elements from the store.
 *
 * @param {Object} payload - contains the elements to be deleted
 * @returns {Object} action new action based on type and payload
 */
export const deleteElements = (payload) => {
    if (!payload) {
        return {};
    }

    let action;
    switch (payload.elementType) {
        case ELEMENT_TYPE.VARIABLE:
        case ELEMENT_TYPE.CONSTANT:
        case ELEMENT_TYPE.TEXT_TEMPLATE:
        case ELEMENT_TYPE.STAGE:
        case ELEMENT_TYPE.CHOICE:
        case ELEMENT_TYPE.PICKLIST_CHOICE_SET:
        case ELEMENT_TYPE.RECORD_CHOICE_SET:
        case ELEMENT_TYPE.FORMULA:
            action = createAction(DELETE_RESOURCE, payload);
            break;
        default:
            // Check if element is a canvas element or multiple elements are being deleted
            if (
                (payload.selectedElements &&
                    payload.selectedElements.length &&
                    payload.selectedElements[0].isCanvasElement) ||
                !payload.elementType
            ) {
                action = createAction(DELETE_ELEMENT, payload);
            } else if (payload.parentGUID) {
                action = createAction(DELETE_CHILDREN, payload);
            } else {
                // Added to support strategy builder non-canvas elements
                action = createAction(DELETE_RESOURCE, payload);
            }
    }

    return action;
};

/**
 * Action for adding a new connector to the store.
 *
 * @param {Object} payload - contains connectorGUID, source, target, connector label and config
 * @returns {Object} action new action based on type and payload
 */
export const addConnector = (payload) => createAction(ADD_CONNECTOR, payload);

/**
 * Action for selecting a canvas element or connector.
 *
 * @param {Object} payload - contains GUID of the element to be selected
 * @returns {Object} action new action based on type and payload
 */
export const selectOnCanvas = (payload) => createAction(SELECT_ON_CANVAS, payload);

/**
 * Action for toggling the isSelected property of a canvas element or connector.
 *
 * @param {Object} payload - contains GUID of the element to be toggled
 * @returns {Object} action new action based on type and payload
 */
export const toggleOnCanvas = (payload) => createAction(TOGGLE_ON_CANVAS, payload);

/**
 * Action for deselecting all the selected canvas elements and connectors.
 *
 * @returns {Object} action new action based on type and payload
 */
export const deselectOnCanvas = createAction(DESELECT_ON_CANVAS);

/**
 * Action for marquee select the canvas elements and connectors.
 *
 * @param {Object} payload - contains arrays with the canvas elements and connectors to be selected/deselected
 * @returns {Object} action new action based on type and payload
 */
export const marqueeSelectOnCanvas = (payload) => createAction(MARQUEE_SELECT_ON_CANVAS, payload);

/**
 * Action for selecting/desecting multiple canvas elements on the Fixed Canvas.
 *
 * @param {Object} payload - contains arrays with the canvas elements to be selected/deselected and those that
 * can be selected next
 * @returns {Object} action new action based on type and payload
 */
export const selectionOnFixedCanvas = (payload) => createAction(SELECTION_ON_FIXED_CANVAS, payload);

export const alcCreateConnection = (payload) => createAction(ALC_CREATE_CONNECTION, payload);
export const createGoToConnection = (payload) => createAction(CREATE_GOTO_CONNECTION, payload);
export const deleteGoToConnection = (payload) => createAction(DELETE_GOTO_CONNECTION, payload);
export const addElementFault = (payload) => createAction(ADD_FAULT, payload);

export const deleteElementFault = (payload) => createAction(DELETE_FAULT, payload);

/**
 * Action for pasting elements on the fixed canvas
 *
 * @param {Object} payload - Contains the data for pasting elements on the fixed canvas
 */
export const pasteOnFixedCanvas = (payload) => createAction(PASTE_ON_FIXED_CANVAS, payload);

/**
 * Action for setting the isHighlighted property of a canvas element to true
 *
 * @param {Object} payload - contains GUID of the element to be toggled
 * @returns {Object} action new action based on type and payload
 */
export const highlightOnCanvas = (payload) => createAction(HIGHLIGHT_ON_CANVAS, payload);

/**
 * Action for updating the location of canvas element. This is needed in additon to updateElement
 * because we are grouping this action in undoRedo lib to achieve multi move into one undo state.
 *
 * @param {Object} payload - contains guid & position coordinates for the canvas element.
 * @returns {Object} action - updateCanvasElementLocation action
 */
export const updateCanvasElementLocation = (payload) => createAction(UPDATE_CANVAS_ELEMENT_LOCATION, payload);

/**
 * Action for resetting the inline resource to null.
 *
 * @returns {Object} action new action based on type
 */
export const removeLastCreatedInlineResource = createAction(REMOVE_LAST_CREATED_INLINE_RESOURCE);

/**
 * Action for setting the newly created inline resource properties. This is used so that the expressionBuilder knows:
 * 1. we are creating an inline resource for the left or right combobox
 * 2. which expressionBuilder to add the resource to when there are multiple conditions
 *
 * @param {Object} payload - contains a string `left` or `right` or null & the row index of the condition
 * @returns {Object} action - updateInlineResourceProperties action
 */
export const updateInlineResourceProperties = (payload) => createAction(UPDATE_INLINE_RESOURCE_PROPERTIES, payload);

/**
 * Action for updating a list of all apex classes.
 *
 * @param payload
 */
export const updateApexClasses = (payload) => createAction(UPDATE_APEX_CLASSES, payload);

export const updateEntities = (payload) => createAction(UPDATE_ENTITIES, payload);

/**
 * Action for decorating a flow on the canvas (example, highlighting connectors and elements)
 *
 * @param {Object} payload - canvas decorator object
 * @returns {Object} action - decorateCanvas action
 */
export const decorateCanvas = (payload) => createAction(DECORATE_CANVAS, payload);

/**
 * Action for clearing any current canvas decorations (example, highlighted connectors)
 *
 * @returns {Object} action - clearCanvasDecoration action
 */
export const clearCanvasDecoration = createAction(CLEAR_CANVAS_DECORATION);

/**
 * Action for updating flow information in the store when switching between Canvas Modes
 *
 * @param payload - contains new flow information with updated element properties
 * @returns action new action based on type and payload
 */
export const updateFlowOnCanvasModeToggle = (payload: object): object =>
    createAction(UPDATE_FLOW_ON_CANVAS_MODE_TOGGLE, payload);

/**
 * Action for updating the isAutoLayoutCanvas property
 *
 * @param payload - Contains boolean value determining the new value of isAutoLayoutCanvas
 * @returns action new action based on type and payload
 */
export const updateIsAutoLayoutCanvasProperty = (payload: boolean): object =>
    createAction(UPDATE_IS_AUTO_LAYOUT_CANVAS_PROPERTY, payload);

/**
 * Action for resetting go to information on all connectors
 *
 * @returns {Object} action - resetGoTos action
 */
export const resetGoTos = createAction(RESET_GOTOS);
