import { FlowModel, Guid, HighlightInfo } from './model';
import {
    addElement,
    deleteElement,
    deleteFault,
    connectToElement,
    ElementService,
    initFlowModel,
    addFault,
    updateChildren,
    InsertAt,
    createGoToConnection,
    deleteGoToConnection,
    decorateElements,
    clearCanvasDecoration,
    updateChildrenOnAddingOrUpdatingScheduledPaths
} from './modelUtils';

import NodeType from './NodeType';

enum ActionType {
    Init,
    AddElement,
    DeleteElement,
    AddFault,
    DeleteFault,
    ConnectToElement,
    UpdateChildren,
    CreateGoToConnection,
    DeleteGoToConnection,
    DecorateCanvas,
    ClearCanvasDecoration,
    UpdateChildrenOnAddingOrUpdatingScheduledPaths
}

/*
 * Auto Layout Canvas reducer, and its actions
 */

/**
 * Creates an action with a payload
 *
 * @param type - The action type
 * @param payload - The action payload
 */
function createPayloadAction<T, P>(type: T, payload: P) {
    return { type, payload };
}

/**
 * Creates an Init action for the auto layout canvas
 *
 * @param startElementGuid - The guid of the start element
 * @param endElementGuid = The guid of the end element
 * @return An Init action
 */
export function initAction(startElementGuid: Guid, endElementGuid: Guid) {
    return createPayloadAction(<const>ActionType.Init, { startElementGuid, endElementGuid });
}

/**
 * Creates an AddElement action
 *
 * @param elementGuid - The guid of the element to add
 * @param nodeType  - The node type for the element
 * @return An AddElement action
 */
export function addElementAction(elementGuid: Guid, nodeType: NodeType, insertAt: InsertAt) {
    return createPayloadAction(<const>ActionType.AddElement, { elementGuid, nodeType, insertAt });
}

/**
 * Creates an DeleteElement action
 *
 * @param elementGuid - The guid of the element to delete
 * @param childIndexToKeep - The index of the child to keep, if any (used when deleting a branching element)
 * @return A DeleteElement Action
 */
export function deleteElementAction(elementGuid: Guid, childIndexToKeep?: number) {
    return createPayloadAction(<const>ActionType.DeleteElement, { elementGuid, childIndexToKeep });
}

/**
 * Creates an DeleteFault action
 *
 * @param elementGuid - The guid of an element that has a fault
 * @return A DeleteFault action
 */
export function deleteFaultAction(elementGuid: Guid) {
    return createPayloadAction(<const>ActionType.DeleteFault, { elementGuid });
}

/**
 * Creates a ConnectToElement action.
 * To break a connection, use addElement with an End element.
 *
 * @param fromInsertAt - The guid of the end element to delete
 * @param toElementGuid - The guid of the element to reconnect
 * @return A ConnectToElement action
 */
export function connectToElementAction(fromInsertAt: InsertAt, toElementGuid: Guid) {
    return createPayloadAction(<const>ActionType.ConnectToElement, { fromInsertAt, toElementGuid });
}

/**
 * Created the CreateGoToConnection action
 * @param sourceGuid - Guid of the source element
 * @param sourceBranchIndex - Index of branch on which GoTo is being added
 * @param targetGuid - Guid of the target element
 * @param isReroute - Whether this is a reroute of an existing Goto connection
 * @return CreateGoToConnection action
 */
export function createGoToConnectionAction(
    sourceGuid: Guid,
    sourceBranchIndex: number,
    targetGuid: Guid,
    isReroute?: boolean
) {
    return createPayloadAction(<const>ActionType.CreateGoToConnection, {
        sourceGuid,
        sourceBranchIndex,
        targetGuid,
        isReroute
    });
}

/**
 * Create the DeleteGoToConnection action
 * @param sourceGuid - Guid of the source element
 * @param sourceBranchIndex - Index of branch on which GoTo is being deleted
 * @return DeleteGoToConnection action
 */
export function deleteGoToConnectionAction(sourceGuid: Guid, sourceBranchIndex: number) {
    return createPayloadAction(<const>ActionType.DeleteGoToConnection, { sourceGuid, sourceBranchIndex });
}

/**
 * Creates an AddFault action
 *
 * @param elementGuid - The guid of an element to add a fault to
 * @return An AddFault action
 */
export function addFaultAction(elementGuid: Guid) {
    return createPayloadAction(<const>ActionType.AddFault, { elementGuid });
}

/**
 * Creates an UpdateChildren action
 *
 * @param parentElementGuid - The guid of the parent element
 * @param updatedChildReferences - Updated childReferences array
 * @return An UpdateChildren action
 */
export function updateChildrenAction(parentElementGuid: Guid, updatedChildReferences: { childReference: string }[]) {
    return createPayloadAction(<const>ActionType.UpdateChildren, { parentElementGuid, updatedChildReferences });
}

export function decorateCanvasAction(decoratedElements: Map<Guid, HighlightInfo>) {
    return createPayloadAction(<const>ActionType.DecorateCanvas, { decoratedElements });
}

export function clearCanvasDecorationAction() {
    return createPayloadAction(<const>ActionType.ClearCanvasDecoration, null);
}

/**
 * Creates the UpdateChildrenOnAddingOrUpdatingScheduledPaths action
 * @param parentElementGuid - The guid of the parent element (i.e. Start Element)
 * @param updatedChildReferences - Updated childReferences array
 * @return UpdateChildrenOnAddingOrUpdatingScheduledPaths action
 */
export function updateChildrenOnAddingOrUpdatingScheduledPathsAction(
    parentElementGuid: Guid,
    updatedChildReferences: { childReference: string }[]
) {
    return createPayloadAction(<const>ActionType.UpdateChildrenOnAddingOrUpdatingScheduledPaths, {
        parentElementGuid,
        updatedChildReferences
    });
}

type Action = ReturnType<
    | typeof addElementAction
    | typeof deleteElementAction
    | typeof deleteFaultAction
    | typeof connectToElementAction
    | typeof initAction
    | typeof addFaultAction
    | typeof updateChildrenAction
    | typeof createGoToConnectionAction
    | typeof deleteGoToConnectionAction
    | typeof decorateCanvasAction
    | typeof clearCanvasDecorationAction
    | typeof updateChildrenOnAddingOrUpdatingScheduledPathsAction
>;

function reducer(config: ElementService, flowModel: Readonly<FlowModel>, action: Action): Readonly<FlowModel> {
    const nextFlowModel = flowModel;

    switch (action.type) {
        case ActionType.Init: {
            const { startElementGuid, endElementGuid } = action.payload;
            return initFlowModel(nextFlowModel, startElementGuid, endElementGuid);
        }
        case ActionType.AddElement: {
            const { elementGuid, nodeType, insertAt } = action.payload;
            return addElement(nextFlowModel, elementGuid, nodeType, insertAt);
        }
        case ActionType.DeleteElement: {
            const { elementGuid, childIndexToKeep } = action.payload;
            const deleteOptions = { childIndexToKeep };

            return deleteElement(config, nextFlowModel, elementGuid, deleteOptions);
        }
        case ActionType.DeleteFault: {
            const { elementGuid } = action.payload;
            return deleteFault(config, nextFlowModel, elementGuid);
        }
        case ActionType.ConnectToElement: {
            const { fromInsertAt, toElementGuid } = action.payload;
            return connectToElement(config, nextFlowModel, fromInsertAt, toElementGuid);
        }
        case ActionType.CreateGoToConnection: {
            const { sourceGuid: guid, sourceBranchIndex: childIndex, targetGuid, isReroute } = action.payload;
            return createGoToConnection(nextFlowModel, { guid, childIndex }, targetGuid, isReroute);
        }
        case ActionType.DeleteGoToConnection: {
            const { sourceGuid: guid, sourceBranchIndex: childIndex } = action.payload;
            return deleteGoToConnection(config, nextFlowModel, { guid, childIndex });
        }
        case ActionType.AddFault: {
            const { elementGuid } = action.payload;
            return addFault(config, nextFlowModel, elementGuid);
        }
        case ActionType.UpdateChildren: {
            const { parentElementGuid, updatedChildReferences } = action.payload;
            return updateChildren(config, nextFlowModel, parentElementGuid, updatedChildReferences);
        }
        case ActionType.DecorateCanvas: {
            const { decoratedElements } = action.payload;
            return decorateElements(clearCanvasDecoration(nextFlowModel), decoratedElements);
        }
        case ActionType.ClearCanvasDecoration: {
            return clearCanvasDecoration(nextFlowModel);
        }
        case ActionType.UpdateChildrenOnAddingOrUpdatingScheduledPaths: {
            const { parentElementGuid, updatedChildReferences } = action.payload;
            return updateChildrenOnAddingOrUpdatingScheduledPaths(
                config,
                nextFlowModel,
                parentElementGuid,
                updatedChildReferences
            );
        }
        default:
            return nextFlowModel;
    }
}

/**
 * Creates a configured Auto Layout Canvas reducer
 *
 * @param config - The reducer config
 * @return A configured reducer
 */
export default function createReducer(config: ElementService) {
    return (flowModel: FlowModel, action: Action) => reducer(config, flowModel, action);
}
