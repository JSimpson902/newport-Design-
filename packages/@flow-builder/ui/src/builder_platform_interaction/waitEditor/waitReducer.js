import {
    addItem,
    deleteItem,
    replaceItem,
    hydrateWithErrors,
    updateProperties} from 'builder_platform_interaction/dataMutationLib';
import {
    createWaitEvent,
    createCondition,
} from 'builder_platform_interaction/elementFactory';
import { VALIDATE_ALL } from "builder_platform_interaction/validationRules";
import { PROPERTY_EDITOR_ACTION } from 'builder_platform_interaction/actions';
import {
    PropertyChangedEvent,
    AddConditionEvent,
    DeleteConditionEvent,
    UpdateConditionEvent,
    ReorderListEvent
} from 'builder_platform_interaction/events';
import {waitValidation, additionalRules} from './waitValidation';

const waitPropertyChanged = (state, event) => {
    event.detail.error = event.detail.error === null ?
        waitValidation.validateProperty(event.detail.propertyName, event.detail.value) : event.detail.error;
    return updateProperties(state, {
        [event.detail.propertyName]: {
            value: event.detail.value,
            error: event.detail.error
        }
    });
};

const addWaitEvent = (state) => {
    let newWaitEvent = createWaitEvent();
    newWaitEvent = hydrateWithErrors(newWaitEvent);

    const waitEvents = addItem(state.waitEvents, newWaitEvent);

    return updateProperties(state, {waitEvents});
};

const reorderWaitEvents = (state, event) => {
    let waitEvents = state.waitEvents;
    const destinationIndex = state.waitEvents.findIndex((element) => {
        return element.guid === event.detail.destinationGuid;
    });
    const movedWaitEvent = state.waitEvents.find((waitEvent) => {
        return waitEvent.guid === event.detail.sourceGuid;
    });
    if (destinationIndex >= 0 && movedWaitEvent) {
        waitEvents = state.waitEvents.filter((waitEvent) => {
            return waitEvent.guid !== event.detail.sourceGuid;
        });
        waitEvents.splice(destinationIndex, 0, movedWaitEvent);
    }
    return updateProperties(state, {waitEvents});
};

/**
 * Reducer for updating wait conditions
 * @param {Object} state the entire wait sate
 * @param {Object} event the event with payload information
 * @param {function} conditionOperation the operation we want to perform on the state's conditions
 * @returns {Object} updated state
 */
const waitConditionReducer = (state, event, conditionOperation) => {
    const mapEvents = waitEvent => {
        if (waitEvent.guid === event.detail.parentGUID) {
            const conditions = conditionOperation(waitEvent.conditions, event);
            return Object.assign({}, waitEvent, { conditions });
        }
        return Object.assign({}, waitEvent);
    };
    const waitEvents = state.waitEvents.map(mapEvents);
    return Object.assign({}, state, { waitEvents });
};


const addWaitCondition = function (conditions) {
    const newCondition = createCondition();
    return addItem(conditions, newCondition);
};

const deleteWaitCondition = function (conditions, event) {
    return deleteItem(conditions, event.detail.index);
};

const updateWaitCondition = function (conditions, event) {
    const conditionToUpdate = conditions[event.detail.index];
    return replaceItem(conditions, Object.assign({}, conditionToUpdate, event.detail.value), event.detail.index);
};

/**
 * Wait reducer function runs validation rules and returns back the updated Wait element
 * @param {Object} state - element / Wait node
 * @param {Event} event - object containing type and payload
 * @returns {Object} Wait - updated Wait
 */
export const waitReducer = (state, event) => {
    switch (event.type) {
        case AddConditionEvent.EVENT_NAME:
            return waitConditionReducer(state, event, addWaitCondition);
        case DeleteConditionEvent.EVENT_NAME:
            return waitConditionReducer(state, event, deleteWaitCondition);
        case UpdateConditionEvent.EVENT_NAME:
            return waitConditionReducer(state, event, updateWaitCondition);
        case PropertyChangedEvent.EVENT_NAME:
            return waitPropertyChanged(state, event);
        case VALIDATE_ALL:
            return waitValidation.validateAll(state, additionalRules);
        case PROPERTY_EDITOR_ACTION.ADD_WAIT_EVENT:
            return addWaitEvent(state);
        case ReorderListEvent.EVENT_NAME:
            return reorderWaitEvents(state, event);
        default: return state;
    }
};