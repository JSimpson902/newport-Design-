import { ELEMENT_TYPE } from 'builder_platform_interaction-constant';
import { isCanvasElement } from 'builder_platform_interaction-element-config';

export const UPDATE_FLOW = 'UPDATE_FLOW';

export const UPDATE_PROPERTIES = 'UPDATE_PROPERTIES';

export const ADD_CANVAS_ELEMENT = 'ADD_CANVAS_ELEMENT';
export const UPDATE_CANVAS_ELEMENT = 'UPDATE_CANVAS_ELEMENT';
export const DELETE_CANVAS_ELEMENT = 'DELETE_CANVAS_ELEMENT';

export const ADD_VARIABLE = 'ADD_VARIABLE';
export const UPDATE_VARIABLE = 'UPDATE_VARIABLE';
export const DELETE_VARIABLE = 'DELETE_VARIABLE';

export const ADD_CONNECTOR = 'ADD_CONNECTOR';

export const SELECT_ON_CANVAS = 'SELECT_ON_CANVAS';
export const TOGGLE_ON_CANVAS = 'TOGGLE_ON_CANVAS';
export const DESELECT_ON_CANVAS = 'DESELECT_ON_CANVAS';

export const MODIFIED_AND_DELETED_ELEMENTS = 'MODIFIED_AND_DELETED_ELEMENTS';

/**
 * Helper function to create actions.
 *
 * @param {String} type - action type
 * @param {Object} payload - data
 * @returns {Object} action new action based on type and payload
 */
export const createAction = (type, payload = {}) => ({type, payload});

/**
 * Action for updating flow information in the store.
 * To be used when we get flow metadata from backend or when we create a new flow.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updateFlow = (payload) => createAction(UPDATE_FLOW, payload);

/**
 * Action for updating flow properties in the store.
 *
 * @param {Object} payload - contains new flow information
 * @returns {Object} action new action based on type and payload
 */
export const updateProperties = (payload) => createAction(UPDATE_PROPERTIES, payload);

/**
 * Action for adding a new element in the store.
 *
 * @param {Object} payload - contains new element value to be added
 * @returns {Object} action new action based on type and payload
 */
export const addElement = (payload) => {
    if (payload) {
        switch (payload.elementType) {
            // For variables
            case ELEMENT_TYPE.VARIABLE: return createAction(ADD_VARIABLE, payload);
            default:
                if (isCanvasElement(payload.elementType)) {
                    return createAction(ADD_CANVAS_ELEMENT, payload);
                }
        }
    }
    return {};
};

/**
 * Action for updating an element in the store.
 *
 * @param {Object} payload - contains GUID of the element to be updated and new values
 * @returns {Object} action new action based on type and payload
 */
export const updateElement = (payload) => {
    if (payload) {
        switch (payload.elementType) {
            // For variables
            case ELEMENT_TYPE.VARIABLE: return createAction(UPDATE_VARIABLE, payload);
            default:
                if (isCanvasElement(payload.elementType)) {
                    return createAction(UPDATE_CANVAS_ELEMENT, payload);
                } else if (typeof payload.elementType === 'undefined' && (payload.modified || payload.deleted)) {
                    return createAction(MODIFIED_AND_DELETED_ELEMENTS, payload);
                }
        }
    }
    return {};
};

/**
 * Action for deleting an element from the store.
 *
 * @param {Object} payload - contains GUID of the element to be deleted
 * @returns {Object} action new action based on type and payload
 */
export const deleteElement = (payload) => {
    if (payload) {
        switch (payload.elementType) {
            // For variables
            case ELEMENT_TYPE.VARIABLE: return createAction(DELETE_VARIABLE, payload);
            default:
                if (isCanvasElement(payload.elementType)) {
                    return createAction(DELETE_CANVAS_ELEMENT, payload);
                }
        }
    }
    return {};
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
export const deselectOnCanvas = () => createAction(DESELECT_ON_CANVAS);
