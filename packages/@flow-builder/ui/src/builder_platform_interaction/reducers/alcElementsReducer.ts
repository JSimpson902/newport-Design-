import pastedElementName from '@salesforce/label/FlowBuilderElementConfig.pastedElementName';
import {
    ADD_CANVAS_ELEMENT,
    ADD_DECISION_WITH_OUTCOMES,
    ADD_END_ELEMENT,
    ADD_FAULT,
    ADD_PARENT_WITH_CHILDREN,
    ADD_SCREEN_WITH_FIELDS,
    ADD_START_ELEMENT,
    ADD_WAIT_WITH_WAIT_EVENTS,
    CLEAR_CANVAS_DECORATION,
    CREATE_GOTO_CONNECTION,
    DECORATE_CANVAS,
    DELETE_ELEMENT,
    DELETE_FAULT,
    DELETE_GOTO_CONNECTION,
    MODIFY_DECISION_WITH_OUTCOMES,
    MODIFY_START_WITH_SCHEDULED_PATHS,
    MODIFY_WAIT_WITH_WAIT_EVENTS,
    PASTE_CUT_ELEMENT_ON_FIXED_CANVAS,
    PASTE_ON_FIXED_CANVAS,
    SELECTION_ON_FIXED_CANVAS
} from 'builder_platform_interaction/actions';
import {
    createPastedCanvasElement,
    getAlcElementType,
    getChildCount,
    getElementsMetadata
} from 'builder_platform_interaction/alcCanvasUtils';
import {
    actions,
    assertAutoLayoutState,
    assertInDev,
    createGoToConnection,
    deleteBranchHeadProperties,
    deleteGoToConnection,
    FAULT_INDEX,
    findFirstElement,
    findLastElement,
    findParentElement,
    FlowModel,
    FOR_EACH_INDEX,
    fulfillsBranchingCriteria,
    getConnectionTarget,
    getValuesFromConnectionSource,
    Guid,
    hasGoTo,
    HighlightInfo,
    NodeType,
    ParentNodeModel,
    reducer,
    removeGoTosFromElement,
    setChild,
    START_IMMEDIATE_INDEX
} from 'builder_platform_interaction/autoLayoutCanvas';
import { sanitizeDevName } from 'builder_platform_interaction/commonUtils';
import { updateProperties } from 'builder_platform_interaction/dataMutationLib';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import { createEndElement, MAX_LABEL_LENGTH } from 'builder_platform_interaction/elementFactory';
import { CONNECTOR_TYPE } from 'builder_platform_interaction/flowMetadata';
import { deepCopy } from 'builder_platform_interaction/storeLib';
import { isDevNameInStore, isLabelInStore } from 'builder_platform_interaction/storeUtils';
import elementsReducer from './elementsReducer';
import { getSubElementGuids } from './reducersUtils';

const getElementService = (flowModel: UI.Elements) => {
    return {
        deleteElement(elementGuid: Guid) {
            const element = flowModel[elementGuid];
            getSubElementGuids(element, flowModel).forEach((subElementGuid) => {
                delete flowModel[subElementGuid];
            });
            delete flowModel[elementGuid];
        },

        createEndElement() {
            const endElement = createEndElement();
            flowModel[endElement.guid] = endElement;
            return endElement.guid;
        }
    };
};

/* eslint-disable-next-line complexity */
/**
 * ALC Reducer for elements
 *
 * @param state - elements in the store
 * @param action - with type and payload
 * @returns new state after reduction
 */
export default function alcElementsReducer(state: Readonly<UI.Elements>, action: any): Readonly<UI.Elements> {
    const metadata = getElementsMetadata();

    const statePostElementReducer = elementsReducer(state, action);
    let nextState = deepCopy(statePostElementReducer);
    const elementService = getElementService(nextState);
    const autoLayoutCanvasReducer = reducer(elementService);

    switch (action.type) {
        case ADD_START_ELEMENT: {
            const startElement = action.payload;
            nextState[startElement.guid] = startElement;
            startElement.nodeType = NodeType.START;

            const endElementGuid = elementService.createEndElement();
            const initAction = actions.initAction(action.payload.guid, endElementGuid);
            nextState = autoLayoutCanvasReducer(nextState, initAction);
            break;
        }

        case CREATE_GOTO_CONNECTION: {
            const { source, target, isReroute } = action.payload;
            const createGoToConnectionAction = actions.createGoToConnectionAction(source, target, isReroute);
            nextState = autoLayoutCanvasReducer(nextState, createGoToConnectionAction);
            break;
        }
        case DELETE_GOTO_CONNECTION: {
            const { source } = action.payload;
            const deleteGoToConnectionAction = actions.deleteGoToConnectionAction(source.guid, source.childIndex);
            nextState = autoLayoutCanvasReducer(nextState, deleteGoToConnectionAction);
            break;
        }
        case ADD_FAULT: {
            const addFaultAction = actions.addFaultAction(action.payload);
            nextState = autoLayoutCanvasReducer(nextState, addFaultAction);
            break;
        }
        case DELETE_FAULT: {
            const deleteFaultAction = actions.deleteFaultAction(action.payload);
            nextState = autoLayoutCanvasReducer(nextState, deleteFaultAction);
            break;
        }
        case ADD_CANVAS_ELEMENT:
        case ADD_SCREEN_WITH_FIELDS:
        case ADD_DECISION_WITH_OUTCOMES:
        case ADD_END_ELEMENT:
        case ADD_WAIT_WITH_WAIT_EVENTS:
        case ADD_PARENT_WITH_CHILDREN: {
            const element = _getElementFromActionPayload(action.payload);
            element.nodeType = getAlcElementType(element);

            if (!nextState[element.guid]) {
                nextState[element.guid] = element;
            }

            const source = action.payload.alcConnectionSource;
            const children = getChildren(element);

            if (children) {
                nextState[element.guid].children = children;
            }
            const nodeType = metadata[element.elementType].type;
            const alcAction = actions.addElementAction(element.guid, nodeType, source);
            nextState = autoLayoutCanvasReducer(nextState, alcAction);
            break;
        }
        case MODIFY_WAIT_WITH_WAIT_EVENTS:
        case MODIFY_DECISION_WITH_OUTCOMES: {
            // redo
            const element = _getElementFromActionPayload(action.payload);
            const originalChildReferences = deepCopy((state[element.guid] as ParentNodeModel).childReferences);
            const updatedChildReferences = deepCopy(nextState[element.guid].childReferences);
            nextState[element.guid].childReferences = originalChildReferences;
            const alcAction = actions.updateChildrenAction(element.guid, updatedChildReferences);
            nextState = autoLayoutCanvasReducer(nextState, alcAction);
            break;
        }
        case MODIFY_START_WITH_SCHEDULED_PATHS: {
            // TODO: refactor this code, almost identical as above
            const element = _getElementFromActionPayload(action.payload);
            const originalChildReferences = deepCopy((state[element.guid] as ParentNodeModel).childReferences);
            const updatedChildReferences = deepCopy(nextState[element.guid].childReferences);
            nextState[element.guid].childReferences = originalChildReferences;
            const alcAction = actions.updateChildrenOnAddingOrUpdatingScheduledPathsAction(
                element.guid,
                updatedChildReferences
            );
            nextState = autoLayoutCanvasReducer(nextState, alcAction);
            break;
        }
        case DELETE_ELEMENT: {
            nextState = _deleteElement(nextState, autoLayoutCanvasReducer, action);
            break;
        }
        case SELECTION_ON_FIXED_CANVAS:
            // TODO: move to autoLayoutCanvasReducer
            nextState = _selectionOnFixedCanvas(
                nextState,
                action.payload.canvasElementGuidsToSelect,
                action.payload.canvasElementGuidsToDeselect,
                action.payload.selectableGuids,
                action.payload.allowAllDisabledElements
            );
            break;
        case PASTE_CUT_ELEMENT_ON_FIXED_CANVAS: {
            nextState = _deleteElement(nextState, autoLayoutCanvasReducer, action);
            nextState = _pasteOnFixedCanvas(nextState, action.payload, true);
            break;
        }
        case PASTE_ON_FIXED_CANVAS:
            // TODO: move to autoLayoutCanvasReducer
            nextState = _pasteOnFixedCanvas(nextState, action.payload);
            break;
        case DECORATE_CANVAS: {
            const decoratedElements = getDecoratedElements(nextState, action.payload.connectorsToHighlight);
            const alcAction = actions.decorateCanvasAction(decoratedElements);
            nextState = autoLayoutCanvasReducer(nextState, alcAction);
            break;
        }
        case CLEAR_CANVAS_DECORATION:
            nextState = autoLayoutCanvasReducer(nextState, actions.clearCanvasDecorationAction());
            break;

        default:
            if (state === statePostElementReducer) {
                nextState = state;
            }
            break;
    }

    assertInDev(() => assertAutoLayoutState(nextState));

    return nextState;
}

/**
 * Helper function to delete an element and returns modified state
 *
 * @param state - elements in the store
 * @param autoLayoutCanvasReducer - the canvas reducer
 * @param action - with type and payload
 * @returns the next state
 */
function _deleteElement(state: any, autoLayoutCanvasReducer: any, action: any) {
    const { selectedElements, childIndexToKeep } = action.payload;
    const deletedElement = deepCopy(selectedElements[0]);
    const alcAction = actions.deleteElementAction(deletedElement.guid, childIndexToKeep);
    state[deletedElement.guid] = deletedElement;
    state = autoLayoutCanvasReducer(state, alcAction);
    delete state[deletedElement.guid];
    return state;
}

/**
 * Returns a nulled' children array for a new element that supports children
 *
 * @param element - An element that can have a children
 * @returns An nulled array of n children, where n is the number of children the element can have
 */
function getChildren(element: ParentNodeModel): (Guid | null)[] | null {
    const childCount = getChildCount(element);
    return childCount != null ? Array(childCount).fill(null) : null;
}

/**
 * Computes which branch index to highlight on a given element based on connector type or child reference
 *
 * @param element store element
 * @param connectorType connector type to highlight
 * @param childReference child guid associated with the connector to highlight (eg. outcome guid)
 * @returns - The branch index to highlight
 */
function getBranchIndexToHighlight(
    element: ParentNodeModel,
    connectorType: string,
    childReference?: Guid
): number | null {
    let branchIndexToHighlight: number | null = null;

    const { childReferences, children } = element;

    if (connectorType === CONNECTOR_TYPE.FAULT && element.fault) {
        branchIndexToHighlight = FAULT_INDEX;
    } else if (connectorType === CONNECTOR_TYPE.DEFAULT) {
        branchIndexToHighlight = childReferences.length;
    } else if (connectorType === CONNECTOR_TYPE.LOOP_NEXT) {
        branchIndexToHighlight = FOR_EACH_INDEX;
    } else if (connectorType === CONNECTOR_TYPE.IMMEDIATE && children) {
        branchIndexToHighlight = START_IMMEDIATE_INDEX;
    } else if (childReferences != null && childReference) {
        branchIndexToHighlight = childReferences.findIndex((ref) => {
            return ref.childReference === childReference;
        });
        if (element.nodeType === NodeType.START) {
            branchIndexToHighlight! += 1; // To account for the immediate path at index 0
        }
    }

    return branchIndexToHighlight;
}

/**
 * Helper function to update highlight info on a parent element and include a merge branch index to highlight
 *
 * @param parentHighlightInfo HighlightInfo object on parent element
 * @param mergeBranchIndexToHighlight index of the merge branch to be highlighted on parent element
 */
function setMergeBranchIndexesToHighlight(parentHighlightInfo: HighlightInfo, mergeBranchIndexToHighlight: number) {
    parentHighlightInfo.mergeBranchIndexesToHighlight = parentHighlightInfo.mergeBranchIndexesToHighlight || [];
    if (!parentHighlightInfo.mergeBranchIndexesToHighlight.includes(mergeBranchIndexToHighlight)) {
        parentHighlightInfo.mergeBranchIndexesToHighlight.push(mergeBranchIndexToHighlight);
    }
}

/**
 * Helper function to get the list of elements to decorate after the decorate canvas action is fired
 *
 * @param state flow state
 * @param connectorsToHighlight array of connectors to highlight from the decorate action payload
 * @returns List of decorated elements
 */
function getDecoratedElements(state: FlowModel, connectorsToHighlight: any[]): Map<Guid, HighlightInfo> {
    const decoratedElements = new Map<Guid, HighlightInfo>();
    connectorsToHighlight.forEach((connector) => {
        const elementGuid = connector.source;
        const element = state[elementGuid];
        const highlightInfo = decoratedElements.get(elementGuid) || {};
        const elementAsParent = element as ParentNodeModel;
        const branchIndexToHighlight = getBranchIndexToHighlight(
            elementAsParent,
            connector.type,
            connector.childSource
        );
        if (branchIndexToHighlight != null) {
            highlightInfo.branchIndexesToHighlight = highlightInfo.branchIndexesToHighlight || [];
            if (!highlightInfo.branchIndexesToHighlight.includes(branchIndexToHighlight)) {
                highlightInfo.branchIndexesToHighlight.push(branchIndexToHighlight);
            }
            // For branching elements that don't have any elements or End in the branch to highlight,
            // set highlightNext to true to indicate that we need to highlight the merge point after the highlighted branch
            if (
                fulfillsBranchingCriteria(element, element.nodeType) &&
                branchIndexToHighlight !== FAULT_INDEX &&
                !elementAsParent.children[branchIndexToHighlight]
            ) {
                highlightInfo.highlightNext = true;
                setMergeBranchIndexesToHighlight(highlightInfo, branchIndexToHighlight);
            }

            // For loop elements that don't have any elements in the loop back branch, directly set highlightLoopBack to true
            if (
                element.nodeType === NodeType.LOOP &&
                branchIndexToHighlight === FOR_EACH_INDEX &&
                !elementAsParent.children[branchIndexToHighlight]
            ) {
                highlightInfo.highlightLoopBack = true;
            }
        } else if (connector.type !== CONNECTOR_TYPE.FAULT && !fulfillsBranchingCriteria(element, element.nodeType)) {
            // If no branch index to highlight was found and the element is not a branching
            // or error-ed element, just set highlightNext to true
            highlightInfo.highlightNext = true;
        }

        // Once we get to an element that does not have a next (i.e. it is within a merged branch or loop),
        // go up it's branch chain to it's parent element to highlight merge points correctly
        if (!element.next && highlightInfo.highlightNext) {
            let parentElement = findParentElement(element, state);
            let branchHeadElement = findFirstElement(element, state);
            let mergeBranchIndexToHighlight = branchHeadElement.childIndex;

            // If the parent is a not a loop and not a branch with a next element,
            // set highlightNext so that we highlight the merge point after it's branches
            // Also, set the index for which of it's merge branches need to be highlighted
            // Finally, keep going up it's branch chain to do the same for all it's parents that meet the same criteria
            while (parentElement.nodeType !== NodeType.LOOP && !parentElement.next) {
                const parentHighlightInfo = decoratedElements.get(parentElement.guid) || {};
                parentHighlightInfo.highlightNext = true;
                setMergeBranchIndexesToHighlight(parentHighlightInfo, mergeBranchIndexToHighlight);
                decoratedElements.set(parentElement.guid, parentHighlightInfo);

                branchHeadElement = findFirstElement(parentElement, state);
                mergeBranchIndexToHighlight = branchHeadElement && branchHeadElement.childIndex;
                parentElement = findParentElement(parentElement, state);
            }

            // If the final parent is a loop element, highlight the end of the loop back connector,
            // else it is a branch element whose next and merge branch also need to be highlighted
            const parentHighlightInfo = decoratedElements.get(parentElement.guid) || {};
            if (parentElement.nodeType === NodeType.LOOP) {
                parentHighlightInfo.highlightLoopBack = true;
            } else {
                parentHighlightInfo.highlightNext = true;
                setMergeBranchIndexesToHighlight(parentHighlightInfo, mergeBranchIndexToHighlight);
            }
            decoratedElements.set(parentElement.guid, parentHighlightInfo);
        }

        decoratedElements.set(elementGuid, highlightInfo);
    });

    return decoratedElements;
}

/**
 * @param payload - The action payload
 * @returns The element
 */
function _getElementFromActionPayload(payload) {
    return payload.screen || payload.canvasElement || payload;
}

/**
 * Helper function to handle select mode in the Fixed Layout Canvas. Iterates over all the elements
 * and marks them as selected, deselected or disables the checkbox based on the data received
 *
 * @param elements - current state of elements in the store
 * @param canvasElementGuidsToSelect - Array of canvas elements to be selected
 * @param canvasElementGuidsToDeselect - Array of canvas elements to be deselected
 * @param selectableGuids - Array of canvas element guids that are selectable next
 * @param allowAllDisabledElements - True if disabled elements are allowed
 * @returns The new state
 */
function _selectionOnFixedCanvas(
    elements: Readonly<UI.StoreState>,
    canvasElementGuidsToSelect: Guid[],
    canvasElementGuidsToDeselect: Guid[],
    selectableGuids: Guid[],
    allowAllDisabledElements: boolean
) {
    const newState = updateProperties(elements);
    let hasStateChanged = false;

    Object.keys(elements).map((guid) => {
        if (newState[guid].config) {
            let updatedIsSelected = newState[guid].config.isSelected;
            let updatedIsSelectable = newState[guid].config.isSelectable;

            // Set isSelected to true for the elements associated with the guids present canvasElementGuidsToSelect
            if (canvasElementGuidsToSelect.includes(guid) && !newState[guid].config.isSelected) {
                updatedIsSelected = true;
            }

            // Set isSelected to false for the elements associated with the guids present canvasElementGuidsToDeselect
            if (canvasElementGuidsToDeselect.includes(guid) && newState[guid].config.isSelected) {
                updatedIsSelected = false;
            }

            // When selectableGuids is an empty array and allowAllDisabledElements is false, we mark everything as selectable
            if (selectableGuids.length === 0 && !allowAllDisabledElements) {
                // Setting isSelectable as true only if it was originally set to false
                if (newState[guid].config && !newState[guid].config.isSelectable) {
                    updatedIsSelectable = true;
                }
            } else if (selectableGuids.includes(guid)) {
                // Setting isSelectable as true only if it was originally set to false
                if (newState[guid].config && !newState[guid].config.isSelectable) {
                    updatedIsSelectable = true;
                }
            } else if (newState[guid].config && newState[guid].config.isSelectable) {
                // Setting isSelectable as false only if it was originally set to true
                updatedIsSelectable = false;
            }

            if (
                updatedIsSelected !== newState[guid].config.isSelected ||
                updatedIsSelectable !== newState[guid].config.isSelectable
            ) {
                newState[guid] = updateProperties(newState[guid], {
                    config: {
                        isSelected: updatedIsSelected,
                        isHighlighted: newState[guid].config.isHighlighted,
                        hasError: newState[guid].config.hasError,
                        isSelectable: updatedIsSelectable
                    }
                });

                hasStateChanged = true;
            }
        }

        return guid;
    });

    return hasStateChanged ? newState : elements;
}

/**
 * Function to generate a unique label and devName for a pasted element. The passed in label is used first but if it is
 * falsey then the name field is used.
 *
 * @param label - Existing label
 * @param name - Existing name
 * @param blacklistLabels - blacklist of labels to check against in addition to the store
 * @param blacklistNames - blacklist of devnames to check against in addition to the store
 * @param isCut - boolean that is true if we are pasting cut elements
 * @returns Tuple of generated unique label and name respectively
 */
function _getUniquePastedElementNameAndLabel(
    label: string,
    name: string,
    blacklistLabels: string[] = [],
    blacklistNames: string[] = [],
    isCut = false
) {
    let count = 0;
    let pastedElementLabel = label;
    let pastedElementDevName = name;
    // Check label and name for uniqueness
    while (
        !isCut &&
        (isLabelInStore(pastedElementLabel) ||
            blacklistLabels.includes(pastedElementLabel) ||
            isDevNameInStore(pastedElementDevName) ||
            blacklistNames.includes(pastedElementDevName))
    ) {
        // Generate another label if neither are unique
        count++;
        pastedElementLabel = pastedElementName
            .replace('{0}', count)
            .replace('{1}', label ? label : name)
            .slice(0, MAX_LABEL_LENGTH);
        pastedElementDevName = sanitizeDevName(pastedElementLabel);
    }
    return [pastedElementLabel, pastedElementDevName];
}

/**
 * Helper function to get unique name and labels for child elements
 *
 * @param cutOrCopiedChildElements List of child elements to generate name/labels for
 * @param blacklistNames Names are checked for uniqueness against the store and this list
 * @param blacklistLabels Labels are checked for uniqueness against the store and this list
 * @param isCut - boolean that is true if we are pasting cut elements
 * @returns Label/name map keyed by original element name: { [index: string]: { name: string; label: string } }
 */
function _getPastedChildElementNameAndLabelMap(
    cutOrCopiedChildElements: UI.Element[],
    blacklistNames: string[],
    blacklistLabels: string[],
    isCut = false
) {
    const childElementNameAndLabelMap = {};
    const cutOrCopiedChildElementsArray = Object.values(cutOrCopiedChildElements) as any;
    for (let i = 0; i < cutOrCopiedChildElementsArray.length; i++) {
        const [pastedChildElementLabel, pastedChildElementName] = _getUniquePastedElementNameAndLabel(
            cutOrCopiedChildElementsArray[i].label,
            cutOrCopiedChildElementsArray[i].name,
            blacklistNames,
            blacklistLabels,
            isCut
        );
        childElementNameAndLabelMap[cutOrCopiedChildElementsArray[i].name] = {
            name: pastedChildElementName,
            label: pastedChildElementLabel
        };
        blacklistLabels.push(pastedChildElementLabel);
        blacklistNames.push(pastedChildElementName);
    }
    return childElementNameAndLabelMap;
}

/**
 * Function to paste elements on Fixed Canvas
 *
 * @param elements - State of elements in the store
 * @param payload - Contains the data needed for pasting the cut or copied elements
 * @param payload.canvasElementGuidMap - List of Element Guid
 * @param payload.childElementGuidMap - List of child element guid
 * @param payload.cutOrCopiedCanvasElements - the cutOrCopiedCanvasElements
 * @param payload.cutOrCopiedChildElements - the cutOrCopiedChildElements
 * @param payload.topCutOrCopiedGuid - the topCutOrCopiedGuid
 * @param payload.bottomCutOrCopiedGuid - the bottomCutOrCopiedGuid
 * @param payload.source - The connection source
 * @param isCut - boolean that is true if we are pasting cut elements
 * @returns newState - The updated state of elements in the store
 */
function _pasteOnFixedCanvas(
    elements: any,
    {
        canvasElementGuidMap,
        childElementGuidMap,
        cutOrCopiedCanvasElements,
        cutOrCopiedChildElements,
        topCutOrCopiedGuid,
        bottomCutOrCopiedGuid,
        source
    },
    isCut = false
) {
    let newState = { ...elements };

    const { prev, parent, childIndex } = getValuesFromConnectionSource(source);

    let savedGoto;

    if (hasGoTo(newState, source)) {
        savedGoto = getConnectionTarget(newState, source);
        newState = deleteGoToConnection(getElementService(newState), newState, source);
    }

    const next = getConnectionTarget(newState, source);

    const elementGuidsToPaste = Object.keys(canvasElementGuidMap);
    const blacklistNames: string[] = [];
    const blacklistLabels: string[] = [];
    const childElementNameAndLabelMap = _getPastedChildElementNameAndLabelMap(
        cutOrCopiedChildElements,
        blacklistNames,
        blacklistLabels,
        isCut
    );

    for (let i = 0; i < elementGuidsToPaste.length; i++) {
        const pastedElementGuid = canvasElementGuidMap[elementGuidsToPaste[i]];
        const [pastedElementLabel, pastedElementName] = _getUniquePastedElementNameAndLabel(
            cutOrCopiedCanvasElements[elementGuidsToPaste[i]].label,
            cutOrCopiedCanvasElements[elementGuidsToPaste[i]].name,
            blacklistLabels,
            blacklistNames,
            isCut
        );
        blacklistLabels.push(pastedElementLabel);
        blacklistNames.push(pastedElementName);

        const elementConfig = getConfigForElementType(cutOrCopiedCanvasElements[elementGuidsToPaste[i]].elementType);

        const pastedElement = removeGoTosFromElement(
            cutOrCopiedCanvasElements,
            deepCopy(cutOrCopiedCanvasElements[elementGuidsToPaste[i]])
        );

        const duplicateElement = elementConfig?.factory?.duplicateElement;
        if (duplicateElement != null) {
            const { duplicatedElement, duplicatedChildElements: pastedChildElements } = duplicateElement(
                pastedElement,
                pastedElementGuid,
                pastedElementName,
                childElementGuidMap,
                childElementNameAndLabelMap,
                cutOrCopiedChildElements,
                topCutOrCopiedGuid,
                bottomCutOrCopiedGuid
            );
            // apply the generated labels
            duplicatedElement.label = pastedElementLabel;

            const pastedCanvasElement = createPastedCanvasElement(
                duplicatedElement,
                canvasElementGuidMap,
                topCutOrCopiedGuid,
                bottomCutOrCopiedGuid,
                source,
                next
            );
            newState[pastedCanvasElement.guid] = pastedCanvasElement;
            newState = { ...newState, ...pastedChildElements };
        }
    }

    // Updating previous element's next to the guid of the top-most pasted element
    if (prev) {
        newState[prev!].next = canvasElementGuidMap[topCutOrCopiedGuid];
    }

    // Updating next element's prev to the guid of the bottom-most pasted element
    if (next) {
        newState[next!].prev = canvasElementGuidMap[bottomCutOrCopiedGuid];

        // If the next element was a terminal element, then marking the topCutOrCopied element as the terminal element
        if (newState[next].isTerminal) {
            newState[canvasElementGuidMap[topCutOrCopiedGuid]].isTerminal = true;
        }

        // Deleting the next element's parent, childIndex and isTerminal property
        deleteBranchHeadProperties(newState[next]);
    }

    if (parent != null) {
        // Updating the parent's child to to point to the top-most pasted element's guid
        setChild(newState[parent!], childIndex!, newState[canvasElementGuidMap[topCutOrCopiedGuid]], !!savedGoto);
    }

    // Adding end elements to the pasted fault branches
    const pastedElementGuids = Object.values(canvasElementGuidMap) as Guid[];
    for (let i = 0; i < pastedElementGuids.length; i++) {
        const pastedElement = newState[pastedElementGuids[i]];
        if (pastedElement.fault) {
            // Adding an end element and connecting it to the last element in the pasted Fault Branch
            const lastFaultBranchElement = findLastElement(newState[pastedElement.fault], newState);
            const endElement = createEndElement({
                prev: lastFaultBranchElement.guid,
                next: null
            });
            endElement.nodeType = NodeType.END;
            newState[endElement.guid] = endElement;
            lastFaultBranchElement.next = endElement.guid;
        }
    }

    return savedGoto
        ? createGoToConnection(
              getElementService(newState),
              newState,
              { guid: canvasElementGuidMap[bottomCutOrCopiedGuid] },
              savedGoto,
              false
          )
        : newState;
}
