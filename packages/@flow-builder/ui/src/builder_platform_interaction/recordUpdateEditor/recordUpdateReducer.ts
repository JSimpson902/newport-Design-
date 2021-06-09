// @ts-nocheck
import { recordUpdateValidation, getRules } from './recordUpdateValidation';
import { updateProperties, set, deleteItem } from 'builder_platform_interaction/dataMutationLib';
import { VALIDATE_ALL } from 'builder_platform_interaction/validationRules';
import { EXPRESSION_PROPERTY_TYPE } from 'builder_platform_interaction/expressionUtils';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import {
    PropertyChangedEvent,
    AddRecordFieldAssignmentEvent,
    DeleteRecordFieldAssignmentEvent,
    UpdateRecordFieldAssignmentEvent,
    AddRecordFilterEvent,
    UpdateRecordFilterEvent,
    DeleteRecordFilterEvent
} from 'builder_platform_interaction/events';

import { CONDITION_LOGIC, RECORD_UPDATE_WAY_TO_FIND_RECORDS } from 'builder_platform_interaction/flowMetadata';

const LHS = EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE;

const OPERATOR = EXPRESSION_PROPERTY_TYPE.OPERATOR;

const RHS = EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE;

const INPUTASSIGNMENTS_PROP = 'inputAssignments';
const FILTERS_PROP = 'filters';

const emptyFilterItem = () => {
    return {
        [LHS]: { value: '', error: null },
        [OPERATOR]: { value: '', error: null },
        [RHS]: { value: '', error: null },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
            value: '',
            error: null
        },
        rowIndex: generateGuid()
    };
};

const emptyAssignmentItem = () => {
    return {
        [EXPRESSION_PROPERTY_TYPE.LEFT_HAND_SIDE]: { value: '', error: null },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE]: { value: '', error: null },
        [EXPRESSION_PROPERTY_TYPE.RIGHT_HAND_SIDE_DATA_TYPE]: {
            value: '',
            error: null
        },
        rowIndex: generateGuid()
    };
};

const resetFilter = (state) => {
    // reset filters: create one empty filter item
    return set(state, FILTERS_PROP, [emptyFilterItem()]);
};

const resetFilterErrors = (state) => {
    const oldFilters = state.filters;
    state = set(
        state,
        FILTERS_PROP,
        oldFilters.map((filter) => {
            filter[LHS].error = null;
            filter[OPERATOR].error = null;
            filter[RHS].error = null;
            return filter;
        })
    );
    return state;
};

const resetAssignmentErrors = (state) => {
    const oldInputAssignments = state.inputAssignments;
    state = set(
        state,
        INPUTASSIGNMENTS_PROP,
        oldInputAssignments.map((inputAssignment) => {
            inputAssignment[LHS].error = null;
            inputAssignment[RHS].error = null;
            return inputAssignment;
        })
    );
    return state;
};

const addRecordFilter = (state) => {
    const path = [FILTERS_PROP, state.filters.length];
    return set(state, path, emptyFilterItem());
};

const deleteRecordFilter = (state, event) => {
    const updatedItems = deleteItem(state.filters, event.detail.index);
    return set(state, FILTERS_PROP, updatedItems);
};

const updateRecordFilter = (state, event) => {
    const path = [FILTERS_PROP, event.detail.index];
    const item = updateProperties(state.filters[event.detail.index], event.detail.value);
    return set(state, path, item);
};

const addRecordRecordFieldAssignment = (state) => {
    const path = [INPUTASSIGNMENTS_PROP, state.inputAssignments.length];
    return set(state, path, emptyAssignmentItem());
};

const deleteRecordRecordFieldAssignment = (state, event) => {
    const updatedItems = deleteItem(state.inputAssignments, event.detail.index);
    return set(state, INPUTASSIGNMENTS_PROP, updatedItems);
};

const updateRecordRecordFieldAssignment = (state, event) => {
    const path = [INPUTASSIGNMENTS_PROP, event.detail.index];
    const item = updateProperties(state.inputAssignments[event.detail.index], event.detail.value);
    return set(state, path, item);
};

const resetRecordUpdate = (state, resetObject) => {
    state = resetFilter(state);

    // reset FilterLogic
    if (state.wayToFindRecords.value === RECORD_UPDATE_WAY_TO_FIND_RECORDS.TRIGGERING_RECORD) {
        state = set(state, 'filterLogic', { value: CONDITION_LOGIC.NO_CONDITIONS, error: null });
    } else {
        state = set(state, 'filterLogic', { value: CONDITION_LOGIC.AND, error: null });
    }

    // reset inputAssignments : create one empty assignment item
    state = set(state, INPUTASSIGNMENTS_PROP, [emptyAssignmentItem()]);
    if (resetObject) {
        state = updateProperties(state, { object: { value: '', error: null } });
    }

    // reset inputReference
    return updateProperties(state, {
        inputReference: { value: '', error: null }
    });
};

const managePropertyChanged = (state, event) => {
    const propName = event.detail.propertyName;
    if (!event.detail.ignoreValidate) {
        event.detail.error =
            event.detail.error === null
                ? recordUpdateValidation.validateProperty(propName, event.detail.value)
                : event.detail.error;
    }
    state = updateProperties(state, {
        [propName]: { value: event.detail.value, error: event.detail.error }
    });
    if (!event.detail.error) {
        if (propName === 'object' && event.detail.value !== event.detail.oldValue) {
            // reset all filterItems, outputReference, queriedFields
            state = resetRecordUpdate(state);
        } else if (propName === 'filterLogic' && event.detail.value === CONDITION_LOGIC.NO_CONDITIONS) {
            state = resetFilter(state);
        } else if (propName === FILTERS_PROP) {
            // reset errors in filters if any, and preserve values
            state = resetFilterErrors(state);
        } else if (propName === INPUTASSIGNMENTS_PROP) {
            state = resetAssignmentErrors(state);
        } else if (propName === 'wayToFindRecords' && event.detail.value !== event.detail.oldValue) {
            state = resetRecordUpdate(state, true);
        }
    }
    return state;
};

/**
 * Record update reducer function runs validation rules and returns back the updated element state
 * or update a property based on action type from second argument
 *
 * @param {object} state - element / node state
 * @param {object} event - The event to be handled
 * @returns {object} state - updated state
 */
export const recordUpdateReducer = (state, event) => {
    switch (event.type) {
        case AddRecordFilterEvent.EVENT_NAME:
            return addRecordFilter(state, event);
        case UpdateRecordFilterEvent.EVENT_NAME:
            return updateRecordFilter(state, event);
        case DeleteRecordFilterEvent.EVENT_NAME:
            return deleteRecordFilter(state, event);
        case AddRecordFieldAssignmentEvent.EVENT_NAME:
            return addRecordRecordFieldAssignment(state);
        case DeleteRecordFieldAssignmentEvent.EVENT_NAME:
            return deleteRecordRecordFieldAssignment(state, event);
        case UpdateRecordFieldAssignmentEvent.EVENT_NAME:
            return updateRecordRecordFieldAssignment(state, event);
        case PropertyChangedEvent.EVENT_NAME:
            return managePropertyChanged(state, event);
        case VALIDATE_ALL:
            return recordUpdateValidation.validateAll(state, getRules(state));
        default:
            return state;
    }
};
