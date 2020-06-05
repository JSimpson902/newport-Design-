import { classSet } from 'lightning/utils';

import {
    ElementType,
    getElementMetadata,
    FlowModel,
    ElementsMetadata,
    ParentNodeModel,
    NodeModel,
    Guid,
    NodeRef,
    BranchHeadNodeModel,
    ConnectorRenderInfo,
    NodeRenderInfo,
    FlowRenderInfo
} from 'builder_platform_interaction/autoLayoutCanvas';

interface CanvasElementSelectionData {
    canvasElementGuidsToSelect: Guid[];
    canvasElementGuidsToDeselect: Guid[];
    selectableCanvasElementGuids: Guid[];
    topSelectedGuid: NodeRef;
}

enum ICON_SHAPE {
    DIAMOND = 'diamond', // Example, Decision
    CIRCLE = 'circle', // Example, Start Element
    SQUARE = 'square'
}

function isSystemElement(elementsMetadata: ElementsMetadata, elementType: string) {
    const type = getElementMetadata(elementsMetadata, elementType).type;

    switch (type) {
        case ElementType.ROOT:
        case ElementType.START:
        case ElementType.END:
            return true;
        default:
            return false;
    }
}

const ELEMENT_SELECTED_ACTION = 'element_selected_action';
const ELEMENT_DESELECTED_ACTION = 'element_deselected_action';

/**
 * Return true iff an element can have children
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param element - Element being checked for supporting children
 * @return true if an element can have children
 */
function supportsChildren(elementsMetadata: ElementsMetadata, { elementType }: NodeModel) {
    const type = getElementMetadata(elementsMetadata, elementType).type;
    return supportsChildrenForType(type);
}

/**
 * Function to check if a given element type supports children
 *
 * @param type - Type of a given element
 * @returns true if the element is of type Branch
 */
function supportsChildrenForType(type: ElementType): boolean {
    return type === ElementType.BRANCH;
}

/**
 * Checks whether to traverse down the chain or not depending on the action the user performed
 *
 * @param action - Selection or Deselection action
 * @param currentBranchElement - Branch Element we are going to traverse
 */
function _shouldTraverseDown(action: string, currentBranchElement: NodeModel): boolean {
    // In case of deselection, we should traverse down only if canvas element is selected
    const shouldTraverseDown =
        action === ELEMENT_SELECTED_ACTION
            ? !!currentBranchElement
            : currentBranchElement && currentBranchElement.config && currentBranchElement.config.isSelected;
    return shouldTraverseDown;
}

/**
 * Gets the branch elements present child branches of a Decision or Pause
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param action - Selection or Deselection action
 * @param parentElement - Parent Element of a given tree in the flow
 * @param flowModel - Representation of the flow as presented in the Canvas
 */
function _getChildBranchElements(
    elementsMetadata: ElementsMetadata,
    action: string,
    parentElement: ParentNodeModel,
    flowModel: FlowModel
): Guid[] {
    let branchElementGuidsToSelectOrDeselect: Guid[] = [];
    if (parentElement && parentElement.children && parentElement.children.length > 0) {
        const branchRootsToVisitStack = parentElement.children;

        // Iterating over different branches of a given parent element
        for (let i = 0; i < branchRootsToVisitStack.length; i++) {
            let currentBranchElement = flowModel[branchRootsToVisitStack[i]!];

            // Traversing down a given branch
            while (currentBranchElement != null && _shouldTraverseDown(action, currentBranchElement)) {
                branchElementGuidsToSelectOrDeselect.push(currentBranchElement.guid);
                // Grabs all the elements in the child and fault branches as needed
                branchElementGuidsToSelectOrDeselect = branchElementGuidsToSelectOrDeselect.concat(
                    _getSubtreeElements(elementsMetadata, action, currentBranchElement as ParentNodeModel, flowModel)
                );
                currentBranchElement = flowModel[currentBranchElement.next!];
            }
        }
    }

    return branchElementGuidsToSelectOrDeselect;
}

/**
 * Gets all the elements present in the Fault branch of a given element
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param action - Selection or Deselection action
 * @param parentElement - Parent Element of a given tree in the flow
 * @param flowModel - Representation of the flow as presented in the Canvas
 */
function _getFaultBranchElements(
    elementsMetadata: ElementsMetadata,
    action: string,
    parentElement: ParentNodeModel,
    flowModel: FlowModel
): Guid[] {
    let branchElementGuidsToSelectOrDeselect: Guid[] = [];
    let currentBranchElement = flowModel[parentElement.fault!];

    // Iterate only up till the End Element of the Fault Branch
    while (currentBranchElement != null && !isSystemElement(elementsMetadata, currentBranchElement.elementType)) {
        branchElementGuidsToSelectOrDeselect.push(currentBranchElement.guid);
        // Grabs all the elements in the child and fault branches as needed
        branchElementGuidsToSelectOrDeselect = branchElementGuidsToSelectOrDeselect.concat(
            _getSubtreeElements(elementsMetadata, action, currentBranchElement as ParentNodeModel, flowModel)
        );
        currentBranchElement = flowModel[currentBranchElement.next!];
    }

    return branchElementGuidsToSelectOrDeselect;
}

/**
 * Gets all the elements present in the child and/or fault branches of a given parent element
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param action - Selection or Deselection action
 * @param parentElement - Parent Element of a given tree in the flow
 * @param flowModel - Representation of the flow as presented in the Canvas
 */
function _getSubtreeElements(
    elementsMetadata: ElementsMetadata,
    action: string,
    parentElement: ParentNodeModel,
    flowModel: FlowModel
): Guid[] {
    let canvasElementGuidsArray: Guid[] = [];
    // Getting all the elements present in the child branches based on the selection/deselection action
    if (supportsChildren(elementsMetadata, parentElement)) {
        canvasElementGuidsArray = canvasElementGuidsArray.concat(
            _getChildBranchElements(elementsMetadata, action, parentElement, flowModel)
        );
    }
    // Getting all the elements present in the fault branch based on the selection/deselection action
    if (parentElement.fault) {
        canvasElementGuidsArray = canvasElementGuidsArray.concat(
            _getFaultBranchElements(elementsMetadata, action, parentElement, flowModel)
        );
    }

    return canvasElementGuidsArray;
}

/**
 * Helper function to get all the possible elements that can be selected/deselected next
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param topSelectedGuid - Guid of the top-most selected element
 * @param flowModel - Representation of the flow as presented in the Canvas
 * @returns selectableCanvasElementGuids - An array containing all the selectable Canvas Element Guids
 */
function _getSelectableCanvasElementGuids(
    elementsMetadata: ElementsMetadata,
    topSelectedGuid: Guid,
    flowModel: FlowModel
): Guid[] {
    let selectableCanvasElementGuids: Guid[] = [];
    if (topSelectedGuid) {
        const topSelectedElement = flowModel[topSelectedGuid];
        let currentCanvasElement = topSelectedElement;

        // All the elements in the chain above (excluding the Start Element) should be selectable
        while (currentCanvasElement && !isSystemElement(elementsMetadata, currentCanvasElement.elementType)) {
            selectableCanvasElementGuids.push(currentCanvasElement.guid);
            currentCanvasElement =
                flowModel[currentCanvasElement.prev || (currentCanvasElement as BranchHeadNodeModel).parent];
        }

        // Resetting the currentElement to the topSelectedElement to start going down the chain
        currentCanvasElement = topSelectedElement;

        // All the elements in the vertical chain below (such as element.next is not null) should be selectable
        while (currentCanvasElement && !isSystemElement(elementsMetadata, currentCanvasElement.elementType)) {
            if (currentCanvasElement.guid !== topSelectedElement.guid) {
                selectableCanvasElementGuids.push(currentCanvasElement.guid);
            }
            // Getting all the selectable elements present in the child and fault branches
            selectableCanvasElementGuids = selectableCanvasElementGuids.concat(
                _getSubtreeElements(
                    elementsMetadata,
                    ELEMENT_SELECTED_ACTION,
                    currentCanvasElement as ParentNodeModel,
                    flowModel
                )
            );

            currentCanvasElement = flowModel[currentCanvasElement.next!];
        }
    }

    return selectableCanvasElementGuids;
}

/**
 * Function to get all the selection data which includes canvasElementGuidsToSelect, canvasElementGuidsToDeselect,
 * selectableCanvasElementGuids and the updated topSelectedGuid
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param flowModel - Representation of the flow as presented in the Canvas
 * @param selectedCanvasElementGuid - Guid of the Canvas Element that just got selected
 * @param  topSelectedGuid - Guid of the top-most selected element
 * @returns Selection Data as needed by the store
 */
const getCanvasElementSelectionData = (
    elementsMetadata: ElementsMetadata,
    flowModel: FlowModel,
    selectedCanvasElementGuid: Guid,
    topSelectedGuid: Guid
): CanvasElementSelectionData => {
    let canvasElementGuidsToSelect: Guid[] = [];

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
                // In case the element supports children, all it's branches need to be marked as selected as well
                if (supportsChildren(elementsMetadata, currentCanvasElement)) {
                    canvasElementGuidsToSelect = canvasElementGuidsToSelect.concat(
                        _getChildBranchElements(
                            elementsMetadata,
                            ELEMENT_SELECTED_ACTION,
                            currentCanvasElement as ParentNodeModel,
                            flowModel
                        )
                    );
                }
            } else if ((currentCanvasElement as BranchHeadNodeModel).parent) {
                currentCanvasElement = flowModel[(currentCanvasElement as BranchHeadNodeModel).parent];
            }

            // In case we reach the start element without having found any selected element, then that means that our
            // topSelectedGuid is somewhere in the chain below. Hence emptying the canvasElementGuidsToSelect array
            // and breaking out of the loop
            if (getElementMetadata(elementsMetadata, currentCanvasElement.elementType).type === ElementType.START) {
                canvasElementGuidsToSelect = [];
                break;
            }
        }

        // If canvasElementGuidsToSelect's length is 0 then that means that no selected element was found in the
        // chain above
        if (canvasElementGuidsToSelect.length === 0) {
            currentCanvasElement = flowModel[topSelectedGuid];

            // Going up the chain from topSelectedElement's previous/parent canvas element to find the selected
            // canvas element and pushing all the elements in between into canvasElementGuidsToSelect
            while (currentCanvasElement && currentCanvasElement.guid !== selectedCanvasElementGuid) {
                if (currentCanvasElement.guid !== topSelectedGuid) {
                    canvasElementGuidsToSelect.push(currentCanvasElement.guid);
                }

                if (currentCanvasElement.prev) {
                    currentCanvasElement = flowModel[currentCanvasElement.prev];
                    // In case the element supports children, all it's branches need to be marked as selected as well
                    if (supportsChildren(elementsMetadata, currentCanvasElement)) {
                        canvasElementGuidsToSelect = canvasElementGuidsToSelect.concat(
                            _getChildBranchElements(
                                elementsMetadata,
                                ELEMENT_SELECTED_ACTION,
                                currentCanvasElement as ParentNodeModel,
                                flowModel
                            )
                        );
                    }
                } else if ((currentCanvasElement as BranchHeadNodeModel).parent) {
                    currentCanvasElement = flowModel[(currentCanvasElement as BranchHeadNodeModel).parent];
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
        selectableCanvasElementGuids: _getSelectableCanvasElementGuids(elementsMetadata, topSelectedGuid, flowModel),
        topSelectedGuid
    };
};

/**
 * Function to get all the deselection data which includes canvasElementGuidsToSelect, canvasElementGuidsToDeselect,
 * selectableCanvasElementGuids and the updated topSelectedGuid
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param flowModel - Representation of the flow as presented in the Canvas
 * @param deselectedCanvasElementGuid - Guid of the Canvas Element that just got deselected
 * @param topSelectedGuid - Guid of the top-most selected element
 * @returns Deselection Data as needed by the store
 */
const getCanvasElementDeselectionData = (
    elementsMetadata: ElementsMetadata,
    flowModel: FlowModel,
    deselectedCanvasElementGuid: Guid,
    topSelectedGuid: Guid | null
): CanvasElementSelectionData => {
    const deselectedCanvasElement = flowModel[deselectedCanvasElementGuid];
    let canvasElementGuidsToDeselect: Guid[] = [];

    if (deselectedCanvasElementGuid === topSelectedGuid) {
        // Top-most element is being deselected, we don't need to deselect anything else. Just have to reset the
        // topSelectedGuid to the next selected element (if any). In case the next element is not selected, reset
        // topSelectedGuid to null
        const nextCanvasElement = flowModel[deselectedCanvasElement.next!];
        if (nextCanvasElement && nextCanvasElement.config && nextCanvasElement.config.isSelected) {
            topSelectedGuid = nextCanvasElement.guid;
        } else {
            topSelectedGuid = null;
        }

        // Pushing the deselected element to the canvasElementGuidsToDeselect array
        canvasElementGuidsToDeselect.push(deselectedCanvasElementGuid);

        // Getting all the child and fault branch elements to deselect
        canvasElementGuidsToDeselect = canvasElementGuidsToDeselect.concat(
            _getSubtreeElements(
                elementsMetadata,
                ELEMENT_DESELECTED_ACTION,
                deselectedCanvasElement as ParentNodeModel,
                flowModel
            )
        );
    } else {
        let currentCanvasElement = deselectedCanvasElement;
        // Deselecting one of the middle elements, should deselect everything else in the vertical chain
        // (i.e. till the the point element.next is not null) below as well
        while (currentCanvasElement && currentCanvasElement.config && currentCanvasElement.config.isSelected) {
            canvasElementGuidsToDeselect.push(currentCanvasElement.guid);

            // Getting all the child and fault branch elements to deselect
            canvasElementGuidsToDeselect = canvasElementGuidsToDeselect.concat(
                _getSubtreeElements(
                    elementsMetadata,
                    ELEMENT_DESELECTED_ACTION,
                    currentCanvasElement as ParentNodeModel,
                    flowModel
                )
            );

            currentCanvasElement = flowModel[currentCanvasElement.next!];
        }
    }

    // In the case where topSelectedGuid doesn't exist, everything is selectable. Just passing an empty array
    // in that scenario
    return {
        canvasElementGuidsToSelect: [],
        canvasElementGuidsToDeselect,
        selectableCanvasElementGuids: topSelectedGuid
            ? _getSelectableCanvasElementGuids(elementsMetadata, topSelectedGuid, flowModel)
            : [],
        topSelectedGuid
    };
};

/**
 * Function to get the guids of all the canvas elements that need to be deselected when toggling off the selection mode.
 * Also setting the topSelectedGuid to null.
 *
 * @param elementsMetadata - Contains elementType -> data map
 * @param flowModel - Representation of the flow as presented in the Canvas
 * @param topSelectedGuid - Guid of the top-most selected element
 */
const getCanvasElementDeselectionDataOnToggleOff = (
    elementsMetadata: ElementsMetadata,
    flowModel: FlowModel,
    topSelectedGuid: Guid
): CanvasElementSelectionData => {
    const topSelectedElement = flowModel[topSelectedGuid];
    let canvasElementGuidsToDeselect: Guid[] = [];

    let currentCanvasElement = topSelectedElement;
    // When toggling out of the selection mode, everything needs to be deselected
    while (currentCanvasElement && currentCanvasElement.config && currentCanvasElement.config.isSelected) {
        canvasElementGuidsToDeselect.push(currentCanvasElement.guid);

        // Getting all the child and fault branch elements to deselect
        canvasElementGuidsToDeselect = canvasElementGuidsToDeselect.concat(
            _getSubtreeElements(
                elementsMetadata,
                ELEMENT_DESELECTED_ACTION,
                currentCanvasElement as ParentNodeModel,
                flowModel
            )
        );
        currentCanvasElement = flowModel[currentCanvasElement.next!];
    }

    return {
        canvasElementGuidsToSelect: [],
        canvasElementGuidsToDeselect,
        selectableCanvasElementGuids: [],
        topSelectedGuid: null // TopSelectedGuid needs to be set back to null
    };
};

/**
 * Util functions for flc components
 */

const CLASS_MENU_OPENED = 'menu-opened';
const CLASS_IS_NEW = 'is-new';

function getCssStyle(cssEntries): string {
    return Object.entries(cssEntries)
        .map(entry => `${entry[0]}: ${entry[1]}px`)
        .join(';');
}

/**
 * Returns a css style string for a Geometry object
 *
 * @param A geometry object
 * @returns A css style string for the geometry
 */
function getStyleFromGeometry({ x, y, w, h }: { x?: number; y?: number; w?: number; h?: number }): string {
    return getCssStyle({
        left: x,
        top: y,
        width: w,
        height: h
    });
}

/**
 * Get the data needed to render a flcConnector component
 *
 * @param connectorInfo - Info about a connector
 * @returns The flcConnector component data
 */
function getFlcConnectorData(connectorInfo: ConnectorRenderInfo) {
    return {
        key: connectorKey(connectorInfo),
        connectorInfo,
        style: getStyleFromGeometry(connectorInfo.geometry),
        className: ''
    };
}

/**
 * Get the data needed to render a flcFlow component
 *
 * @param flowInfo - Info about a flow
 * @param parentNodeInfo - The flow's parent node info
 * @param childIndex - The flow's childIndex
 * @returns The flcFlow component data
 */
function getFlcFlowData(flowInfo: FlowRenderInfo, parentNodeInfo: NodeRenderInfo, childIndex: number) {
    return {
        key: `flow-${parentNodeInfo.guid}-${childIndex}`,
        flowInfo,
        style: getStyleFromGeometry(flowInfo.geometry),
        className: ''
    };
}

/**
 * Get the data needed to render a flcCompoundNode component
 *
 * @param nodeInfo - Info about a node
 * @returns The flcCompoundNode component data
 */
function getFlcCompoundNodeData(nodeInfo: NodeRenderInfo): object {
    const { geometry, guid } = nodeInfo;
    const className = classSet({ [CLASS_IS_NEW]: nodeInfo.isNew });

    const faultFlow = nodeInfo.faultFlow ? getFlcFlowData(nodeInfo.faultFlow, nodeInfo, -1) : null;

    return {
        key: guid,
        nodeInfo,
        style: getStyleFromGeometry(geometry),
        className,
        faultFlow
    };
}

/**
 * Get the data needed to render a flcNode component
 *
 * @param nodeInfo - Info about a node
 * @returns The flcNode component data
 */
function getFlcNodeData(nodeInfo: NodeRenderInfo) {
    const { guid, menuOpened } = nodeInfo;

    const className = classSet({
        [CLASS_MENU_OPENED]: menuOpened
    }).toString();

    return {
        key: guid,
        nodeInfo,
        className,
        style: ''
    };
}

/**
 * Creates a unique key for a connector
 *
 * @param connectorInfo- The connector render info
 * @returns a string key
 */
function connectorKey(connectorInfo: ConnectorRenderInfo): string {
    const { connectionInfo, type } = connectorInfo;
    const { prev, next, parent, childIndex } = connectionInfo;
    const suffix = prev ? `${prev}:${next}` : `${parent}:${childIndex}`;
    return `connector-${type}-${suffix}`;
}

export {
    ICON_SHAPE,
    supportsChildrenForType,
    connectorKey,
    getStyleFromGeometry,
    getFlcNodeData,
    getFlcCompoundNodeData,
    getFlcFlowData,
    getFlcConnectorData,
    getCanvasElementSelectionData,
    getCanvasElementDeselectionData,
    getCanvasElementDeselectionDataOnToggleOff
};