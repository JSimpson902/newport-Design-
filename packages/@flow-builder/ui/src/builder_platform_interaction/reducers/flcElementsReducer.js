import {
    ADD_DECISION_WITH_OUTCOMES,
    ADD_SCREEN_WITH_FIELDS,
    ADD_END_ELEMENT,
    SELECTION_ON_FIXED_CANVAS,
    ADD_WAIT_WITH_WAIT_EVENTS,
    MODIFY_WAIT_WITH_WAIT_EVENTS
} from 'builder_platform_interaction/actions';
import { updateProperties } from 'builder_platform_interaction/dataMutationLib';
import { deepCopy } from 'builder_platform_interaction/storeLib';
import ffcElementsReducer from './elementsReducer';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    findLastElement,
    findFirstElement,
    getElementFromActionPayload,
    supportsChildren,
    linkElement,
    linkBranch,
    addElementToState,
    initializeChildren
} from 'builder_platform_interaction/flcConversionUtils';

/**
 * FLC Reducer for elements
 *
 * @param {Object} state - elements in the store
 * @param {Object} action - with type and payload
 * @return {Object} new state after reduction
 */

/**
 * Helper function to handle select mode in the Fixed Layout Canvas. Iterates over all the elements
 * and marks them as selected, deselected or disables the checkbox based on the data received
 *
 * @param {Object} elements - current state of elements in the store
 * @param {String[]} canvasElementGuidsToSelect - Array of canvas elements to be selected
 * @param {String[]} canvasElementGuidsToDeselect - Array of canvas elements to be deselected
 * @param {String[]} selectableGuids - Array of canvas element guids that are selectable next
 */
function _selectionOnFixedCanvas(elements, canvasElementGuidsToSelect, canvasElementGuidsToDeselect, selectableGuids) {
    const newState = updateProperties(elements);
    let hasStateChanged = false;

    Object.keys(elements).map(guid => {
        if (newState[guid].config) {
            let updatedIsSelected = newState[guid].config.isSelected;
            let updatedCanSelect = newState[guid].config.canSelect;

            // Set isSelected to true for the elements associated with the guids present canvasElementGuidsToSelect
            if (canvasElementGuidsToSelect.includes(guid) && !newState[guid].config.isSelected) {
                updatedIsSelected = true;
            }

            // Set isSelected to false for the elements associated with the guids present canvasElementGuidsToDeselect
            if (canvasElementGuidsToDeselect.includes(guid) && newState[guid].config.isSelected) {
                updatedIsSelected = false;
            }

            // When selectableGuids is an empty array, it means that everything is selectable
            if (selectableGuids.length === 0) {
                // Setting canSelect as true only if it was originally set to false
                if (newState[guid].config && !newState[guid].config.canSelect) {
                    updatedCanSelect = true;
                }
            } else if (selectableGuids.includes(guid)) {
                // Setting canSelect as true only if it was originally set to false
                if (newState[guid].config && !newState[guid].config.canSelect) {
                    updatedCanSelect = true;
                }
            } else if (newState[guid].config && newState[guid].config.canSelect) {
                // Setting canSelect as false only if it was originally set to true
                updatedCanSelect = false;
            }

            if (
                updatedIsSelected !== newState[guid].config.isSelected ||
                updatedCanSelect !== newState[guid].config.canSelect
            ) {
                newState[guid] = updateProperties(newState[guid], {
                    config: {
                        isSelected: updatedIsSelected,
                        isHighlighted: newState[guid].config.isHighlighted,
                        canSelect: updatedCanSelect
                    }
                });

                hasStateChanged = true;
            }
        }

        return guid;
    });

    return hasStateChanged ? newState : elements;
}

function addCanvasElement(state, action) {
    const element = getElementFromActionPayload(action.payload);
    const { parent, childIndex } = element;

    addElementToState(element, state);

    if (supportsChildren(element)) {
        initializeChildren(element);
    }

    if (parent) {
        // if the element has a parent, make it the new branch head
        const parentElement = state[parent];
        linkBranch(state, parentElement, childIndex, element);
    } else {
        linkElement(state, element);
    }

    // when adding an end element, we might need to restructure things
    if (action.type === ADD_END_ELEMENT) {
        restructureFlow(element, state);
    }

    return state;
}

/**
 * When adding an end element we might need to restructure the flow
 * @param {Object} element - end element
 * @param {Object} state - current state of elements in the store
 */
function restructureFlow(element, state) {
    const branchFirstElement = findFirstElement(element, state);
    if (branchFirstElement.elementType === ELEMENT_TYPE.START_ELEMENT) {
        // nothing to restructure
        return;
    }

    // mark the branch as a terminal branch
    branchFirstElement.isTerminal = true;

    const parent = state[branchFirstElement.parent];
    const children = parent.children;

    // find the indexes of the non-terminal branches
    // (there will always be at least one when adding an end element)
    const nonTerminalBranchIndexes = children
        .map((child, index) => (child == null || !state[child].isTerminal ? index : -1))
        .filter(index => index !== -1);

    if (nonTerminalBranchIndexes.length === 1) {
        // we have one non-terminal branch, so we need to restructure
        const [branchIndex] = nonTerminalBranchIndexes;
        const branchHead = children[branchIndex];
        const parentNext = state[parent.next];

        const branchTail = branchHead && findLastElement(state[branchHead], state);

        if (branchTail != null) {
            //  reconnect the elements that follow the parent element to the tail of the branch
            branchTail.next = parent.next;
            linkElement(state, branchTail);
        } else {
            // its an empty branch, so make the elements that follow the parent element be the branch itself
            parentNext.prev = null;
            linkBranch(state, parent, branchIndex, parentNext);
        }
        parent.next = null;
    }
}

export default function elementsReducer(state = {}, action) {
    state = deepCopy(ffcElementsReducer(state, action));

    switch (action.type) {
        case ADD_SCREEN_WITH_FIELDS:
        case ADD_DECISION_WITH_OUTCOMES:
        case ADD_END_ELEMENT:
        case ADD_WAIT_WITH_WAIT_EVENTS:
        case MODIFY_WAIT_WITH_WAIT_EVENTS:
            state = addCanvasElement(state, action);
            break;
        case SELECTION_ON_FIXED_CANVAS:
            state = _selectionOnFixedCanvas(
                state,
                action.payload.canvasElementGuidsToSelect,
                action.payload.canvasElementGuidsToDeselect,
                action.payload.selectableGuids
            );
            break;
        default:
    }

    return state;
}
