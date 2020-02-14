import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';

const ELEMENT_SELECTED_ACTION = 'element_selected_action';
const ELEMENT_DESELECTED_ACTION = 'element_deselected_action';

/**
 * Checks whether to traverse down the chain or not depending on the action the user performed
 *
 * @param {String} action - Selection or Deselection action
 * @param {Object} currentBranchElement - Branch Element we are going to traverse
 */
const _shouldTraverseDown = (action, currentBranchElement) => {
    // In case of deselection, we should traverse down only canvas element is selected
    const shoudlTraverseDown =
        action === ELEMENT_SELECTED_ACTION
            ? !!currentBranchElement
            : currentBranchElement && currentBranchElement.config && currentBranchElement.config.isSelected;
    return shoudlTraverseDown;
};

/**
 * Gets the subtree elements present branches of a Decision, Pause or Fault Paths
 *
 * @param {String} action - Selection or Deselection action
 * @param {Object} parentElement - Parent Element of a given tree in the flow
 * @param {Object} flowModel - Representation of the flow as presented in the Canvas
 */
const _getSubtreeElements = (action, parentElement, flowModel) => {
    let branchElementGuidsToSelectOrDeselect = [];
    if (parentElement && parentElement.children && parentElement.children.length > 0) {
        const branchRootsToVisitStack = parentElement.children;

        // Iterating over different branches of a given parent element
        for (let i = 0; i < branchRootsToVisitStack.length; i++) {
            let currentBranchElement = flowModel[branchRootsToVisitStack[i]];

            // Traversing down a given branch
            while (_shouldTraverseDown(action, currentBranchElement)) {
                branchElementGuidsToSelectOrDeselect.push(currentBranchElement.guid);

                // In case of Decision, grab the elements from it's branches as well
                if (currentBranchElement.elementType === ELEMENT_TYPE.DECISION) {
                    branchElementGuidsToSelectOrDeselect = branchElementGuidsToSelectOrDeselect.concat(
                        _getSubtreeElements(action, currentBranchElement, flowModel)
                    );
                }

                currentBranchElement = flowModel[currentBranchElement.next];
            }
        }
    }

    return branchElementGuidsToSelectOrDeselect;
};

/**
 * Helper function to get all the possible elements that can be selected/deselected next
 *
 * @param {String} topSelectedGuid - Guid of the top-most selected element
 * @param {Object} flowModel - Representation of the flow as presented in the Canvas
 * @returns {String[]} selectableCanvasElementGuids - An array containing all the selectable Canvas Element Guids
 */
const _getSelectableCanvasElementGuids = (topSelectedGuid, flowModel) => {
    let selectableCanvasElementGuids = [];
    if (topSelectedGuid) {
        const topSelectedElement = flowModel[topSelectedGuid];
        let currentElement = topSelectedElement;

        // All the elements in the chain above (excluding the Start Element) should be selectable
        while (
            currentElement &&
            currentElement.elementType !== ELEMENT_TYPE.START_ELEMENT &&
            currentElement.elementType !== ELEMENT_TYPE.END_ELEMENT
        ) {
            selectableCanvasElementGuids.push(currentElement.guid);
            currentElement = flowModel[currentElement.prev || currentElement.parent];
        }

        // Resetting the currentElement to the topSelectedElement to start going down the chain
        currentElement = topSelectedElement;

        // All the elements in the vertical chain below (such as element.next is not null) should be selectable
        while (currentElement) {
            if (currentElement.guid !== topSelectedElement.guid) {
                selectableCanvasElementGuids.push(currentElement.guid);
            }

            // In case of a Decision, all it's branches should also be selectable
            if (currentElement.elementType === ELEMENT_TYPE.DECISION) {
                selectableCanvasElementGuids = selectableCanvasElementGuids.concat(
                    _getSubtreeElements(ELEMENT_SELECTED_ACTION, currentElement, flowModel)
                );
            }
            currentElement = flowModel[currentElement.next];
        }
    }

    return selectableCanvasElementGuids;
};

/**
 * Funnction to get all the selection data which includes canvasElementGuidsToSelect, canvasElementGuidsToDeselect,
 * selectableCanvasElementGuids and the updated topSelectedGuid
 *
 * @param {Object} flowModel - Representation of the flow as presented in the Canvas
 * @param {String} selectedCanvasElementGuid - Guid of the Canvas Element that just got selected
 * @param {String} topSelectedGuid - Guid of the top-most selected element
 * @returns {canvasElementGuidsToSelect: String[], canvasElementGuidsToDeselect: String[], selectableCanvasElementGuids: String[], topSelectedGuid: String} - Selection Data as needed by the store
 */
export const getCanvasElementSelectionData = (flowModel, selectedCanvasElementGuid, topSelectedGuid) => {
    let canvasElementGuidsToSelect = [];

    const selectedCanvasElement = flowModel[selectedCanvasElementGuid];
    if (!topSelectedGuid) {
        // If there's no topSelectedGuid, it means that this is the first element being selected
        topSelectedGuid = selectedCanvasElement.guid;
        canvasElementGuidsToSelect.push(selectedCanvasElement.guid);
    } else {
        let currentCanvasElement = selectedCanvasElement;

        // Going up the chain to find the first selected element and pushing all the elements in between into
        // canvasElementGuidsToSelect
        while (currentCanvasElement && currentCanvasElement.config && !currentCanvasElement.config.isSelected) {
            canvasElementGuidsToSelect.push(currentCanvasElement.guid);
            if (currentCanvasElement.prev) {
                currentCanvasElement = flowModel[currentCanvasElement.prev];

                // In case of a Decision Element, all it's branches need to be marked as selected as well
                if (currentCanvasElement.elementType === ELEMENT_TYPE.DECISION) {
                    canvasElementGuidsToSelect = canvasElementGuidsToSelect.concat(
                        _getSubtreeElements(ELEMENT_SELECTED_ACTION, currentCanvasElement, flowModel)
                    );
                }
            } else if (currentCanvasElement.parent) {
                currentCanvasElement = flowModel[currentCanvasElement.parent];
            }

            // In case we reach the start element without having found any selected element, then that means that our
            // topSelectedGuid is somewhere in the chain below. Hence emptying the canvasElementGuidsToSelect array
            // and breaking out of the loop
            if (currentCanvasElement.elementType === ELEMENT_TYPE.START_ELEMENT) {
                canvasElementGuidsToSelect = [];
                break;
            }
        }

        // If canvasElementGuidsToSelect's length is 0 then that means that no selected element was found in the
        // chain above
        if (canvasElementGuidsToSelect.length === 0) {
            currentCanvasElement = flowModel[topSelectedGuid];

            // Going up the chain from topSelctedElement's previous/parent canvas element to find the selected
            // canvas element and pushing all the elements in between into canvasElementGuidsToSelect
            while (currentCanvasElement && currentCanvasElement.guid !== selectedCanvasElementGuid) {
                if (currentCanvasElement.guid !== topSelectedGuid) {
                    canvasElementGuidsToSelect.push(currentCanvasElement.guid);
                }

                if (currentCanvasElement.prev) {
                    currentCanvasElement = flowModel[currentCanvasElement.prev];

                    // In case of a Decision Element, all it's branches need to be marked as selected as well
                    if (currentCanvasElement.elementType === ELEMENT_TYPE.DECISION) {
                        canvasElementGuidsToSelect = canvasElementGuidsToSelect.concat(
                            _getSubtreeElements(ELEMENT_SELECTED_ACTION, currentCanvasElement, flowModel)
                        );
                    }
                } else if (currentCanvasElement.parent) {
                    currentCanvasElement = flowModel[currentCanvasElement.parent];
                }
            }

            // Pushing the newly selected Canvas Element into the canvasElementGuidsToSelect array
            canvasElementGuidsToSelect.push(selectedCanvasElementGuid);

            // Resetting topSelectedGuid to selectedCanvasElementGuid
            topSelectedGuid = selectedCanvasElementGuid;
        }
    }

    return {
        canvasElementGuidsToSelect,
        canvasElementGuidsToDeselect: [],
        selectableCanvasElementGuids: _getSelectableCanvasElementGuids(topSelectedGuid, flowModel),
        topSelectedGuid
    };
};

/**
 * Funnction to get all the deselection data which includes canvasElementGuidsToSelect, canvasElementGuidsToDeselect,
 * selectableCanvasElementGuids and the updated topSelectedGuid
 *
 * @param {Object} flowModel - Representation of the flow as presented in the Canvas
 * @param {String} deselectedCanvasElementGuid - Guid of the Canvas Element that just got deselected
 * @param {String} topSelectedGuid - Guid of the top-most selected element
 * @returns {canvasElementGuidsToSelect: String[], canvasElementGuidsToDeselect: String[], selectableCanvasElementGuids: String[], topSelectedGuid: String} - Deselection Data as needed by the store
 */
export const getCanvasElementDeselectionData = (flowModel, deselectedCanvasElementGuid, topSelectedGuid) => {
    const deselectedElement = flowModel[deselectedCanvasElementGuid];
    let canvasElementGuidsToDeselect = [];

    if (deselectedCanvasElementGuid === topSelectedGuid) {
        // Top-most element is being deselected, we don't need to deselect anything else. Just have to reset the
        // topSelectedGuid to the next selected element (if any). In case the next element is not selected, reset
        // topSelectedGuid to null
        const nextCanvasElement = flowModel[deselectedElement.next];
        if (nextCanvasElement && nextCanvasElement.config && nextCanvasElement.config.isSelected) {
            topSelectedGuid = nextCanvasElement.guid;
        } else {
            topSelectedGuid = null;
        }

        // Pushing the deselected element to the canvasElementGuidsToDeselect array
        canvasElementGuidsToDeselect.push(deselectedCanvasElementGuid);

        // In case of a Decision Element, all it's branches need to be marked as deselected as well
        if (deselectedElement.elementType === ELEMENT_TYPE.DECISION) {
            canvasElementGuidsToDeselect = canvasElementGuidsToDeselect.concat(
                _getSubtreeElements(ELEMENT_DESELECTED_ACTION, deselectedElement, flowModel)
            );
        }
    } else {
        let currentCanvasElement = deselectedElement;
        // Deselecting one of the middle elements, should deselect everything else in the vertical chain
        // (i.e. till the the point element.next is not null) below as well
        while (currentCanvasElement && currentCanvasElement.config && currentCanvasElement.config.isSelected) {
            canvasElementGuidsToDeselect.push(currentCanvasElement.guid);

            // In case of a Decision Element, all it's branches need to be marked as deselected as well
            if (currentCanvasElement.elementType === ELEMENT_TYPE.DECISION) {
                canvasElementGuidsToDeselect = canvasElementGuidsToDeselect.concat(
                    _getSubtreeElements(ELEMENT_DESELECTED_ACTION, currentCanvasElement, flowModel)
                );
            }
            currentCanvasElement = flowModel[currentCanvasElement.next];
        }
    }

    // In the case where topSelectedGuid doesn't exist, everything is selectable. Just passing an empty array
    // in that scenario
    return {
        canvasElementGuidsToSelect: [],
        canvasElementGuidsToDeselect,
        selectableCanvasElementGuids: topSelectedGuid
            ? _getSelectableCanvasElementGuids(topSelectedGuid, flowModel)
            : [],
        topSelectedGuid
    };
};
