// @ts-nocheck
import {
    ADD_RESOURCE,
    ADD_START_ELEMENT,
    CLEAR_CANVAS_DECORATION,
    DECORATE_CANVAS,
    DESELECT_ON_CANVAS,
    HIGHLIGHT_ON_CANVAS,
    MODIFY_START_WITH_SCHEDULED_PATHS,
    REMOVE_LAST_CREATED_INLINE_RESOURCE,
    SELECTION_ON_FIXED_CANVAS,
    SELECT_ON_CANVAS,
    TOGGLE_ON_CANVAS,
    UPDATE_APEX_CLASSES,
    UPDATE_CANVAS_ELEMENT,
    UPDATE_ENTITIES,
    UPDATE_FLOW,
    UPDATE_FLOW_ON_CANVAS_MODE_TOGGLE,
    UPDATE_INLINE_RESOURCE_PROPERTIES,
    UPDATE_IS_AUTO_LAYOUT_CANVAS_PROPERTY,
    UPDATE_PROPERTIES,
    UPDATE_PROPERTIES_AFTER_ACTIVATING,
    UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_PROCESS_TYPE_AND_TRIGGER_TYPE,
    UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_TEMPLATE,
    UPDATE_PROPERTIES_AFTER_SAVE_FAILED,
    UPDATE_PROPERTIES_AFTER_SAVING,
    UPDATE_RESOURCE
} from 'builder_platform_interaction/actions';
import { createFlowProperties } from 'builder_platform_interaction/elementFactory';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { isRunInModeSupported } from 'builder_platform_interaction/triggerTypeLib';

/**
 * Reducer for properties
 *
 * @param {Object} state properties object in the store
 * @param {Object} action with type and payload
 * @returns {Object} new state after reduction
 */

const INIT = 'INIT';
const flowProperties = createFlowProperties();

/**
 * Case Notes (Moved due to eslint errors)
 * UPDATE_PROPERTIES_AFTER_SAVING: This action is dispatched after flow is saved.
 * After flow is saved, hasUnsavedChanges is set to false.
 * UPDATE_FLOW: Default value of hasUnsavedChanges is false in factory, so in this case it will be set to false.
 * UPDATE_PROPERTIES_AFTER_SAVE_FAILED: This action is dispatched after flow save call is failed.
 * hasUnsavedChanges is set to true, so that the user can press save button again.
 * UPDATE_PROPERTIES: This action is dispatch when after flow properties are updated
 * In first case, hasUnsavedChanges is set to true.
 *
 */
/* eslint-disable-next-line complexity */
/**
 * @param state
 * @param root0
 * @param root0.payload
 * @param root0.type
 */
// eslint-disable-next-line complexity
export default function flowPropertiesReducer(state = flowProperties, { payload, type }) {
    switch (type) {
        case ADD_RESOURCE:
            return {
                ...state,
                lastInlineResourceGuid: payload.isAddingResourceViaLeftPanel
                    ? state.lastInlineResourceGuid
                    : payload.guid,
                hasUnsavedChanges: true
            };
        case UPDATE_RESOURCE:
            return {
                ...state,
                lastInlineResourceGuid: payload.isInlineEditingResource ? payload.guid : state.lastInlineResourceGuid,
                hasUnsavedChanges: true
            };
        case REMOVE_LAST_CREATED_INLINE_RESOURCE:
            return {
                ...state,
                lastInlineResourceGuid: null,
                lastInlineResourcePosition: null
            };
        case UPDATE_INLINE_RESOURCE_PROPERTIES:
            return {
                ...state,
                lastInlineResourcePosition: payload.lastInlineResourcePosition,
                lastInlineResourceRowIndex: payload.lastInlineResourceRowIndex
            };
        case UPDATE_FLOW:
            return {
                ...state,
                ...payload.properties,
                hasUnsavedChanges: false
            };
        case UPDATE_FLOW_ON_CANVAS_MODE_TOGGLE:
            return {
                ...state,
                hasUnsavedChanges: payload.updatedHasUnsavedChangesProperty
            };
        case UPDATE_IS_AUTO_LAYOUT_CANVAS_PROPERTY:
            return {
                ...state,
                isAutoLayoutCanvas: payload
            };
        case UPDATE_PROPERTIES_AFTER_ACTIVATING:
        case UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_PROCESS_TYPE_AND_TRIGGER_TYPE:
        case UPDATE_PROPERTIES_AFTER_SAVING:
            return {
                ...state,
                ...payload,
                hasUnsavedChanges: false
            };
        case UPDATE_PROPERTIES_AFTER_CREATING_FLOW_FROM_TEMPLATE:
        case UPDATE_PROPERTIES_AFTER_SAVE_FAILED:
        case UPDATE_PROPERTIES:
            return {
                ...state,
                ...payload,
                hasUnsavedChanges: true
            };
        case ADD_START_ELEMENT:
        case DESELECT_ON_CANVAS:
        case INIT:
        case SELECT_ON_CANVAS:
        case TOGGLE_ON_CANVAS:
        case SELECTION_ON_FIXED_CANVAS:
        case UPDATE_APEX_CLASSES:
        case UPDATE_ENTITIES:
        case DECORATE_CANVAS:
        case CLEAR_CANVAS_DECORATION:
        case HIGHLIGHT_ON_CANVAS:
            return state;
        case UPDATE_CANVAS_ELEMENT:
            // If the start element is updated with a trigger type that does not support
            // the run-in system mode, then set the run-in mode property to undefined
            return payload.elementType === ELEMENT_TYPE.START_ELEMENT && !isRunInModeSupported(payload.triggerType)
                ? {
                      ...state,
                      runInMode: undefined,
                      hasUnsavedChanges: true
                  }
                : {
                      ...state,
                      hasUnsavedChanges: true
                  };
        case MODIFY_START_WITH_SCHEDULED_PATHS:
            /**
             * NOTE: this action type is dispatched when updating a start element with scheduled information
             * We have this case because as of 240 W-11287604, timeZoneSidKey is updated at the start node level
             * for discoverability but the field exists at the flow properties level. When a user edits the
             * flow level time zone in the start element editor, we must update the flow properties.
             */
            return {
                ...state,
                timeZoneSidKey: payload.canvasElement?.timeZoneSidKey,
                hasUnsavedChanges: true
            };
        default:
            return {
                ...state,
                hasUnsavedChanges: true
            };
    }
}
