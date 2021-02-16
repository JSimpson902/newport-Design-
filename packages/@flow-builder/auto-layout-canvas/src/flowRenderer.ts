import * as connectorLib from './connectorLib';
import { Geometry } from './svgUtils';
import ConnectorType from './ConnectorTypeEnum';

import {
    FlowModel,
    NodeModel,
    ParentNodeModel,
    BranchHeadNodeModel,
    resolveNode,
    getRootNode,
    getElementMetadata,
    Guid,
    FAULT_INDEX,
    LOOP_BACK_INDEX,
    START_IMMEDIATE_INDEX
} from './model';
import { fulfillsBranchingCriteria, resolveBranchHead, shouldSupportTimeTriggers } from './modelUtils';
import { NO_OFFSET, getLayoutChildOrFault } from './layout';

import {
    ConnectorVariant,
    ConnectorRenderInfo,
    LayoutConfig,
    FlowRenderInfo,
    NodeRenderInfo,
    getLayout,
    getBranchLayout,
    Option,
    getMergeOutcomeCount,
    FlowRenderContext,
    LayoutInfo,
    getBranchLayoutKey
} from './flowRendererUtils';

import NodeType from './NodeType';
import MenuType from './MenuType';
import { isMenuOpened } from './interactionUtils';
import ConnectorLabelType from './ConnectorLabelTypeEnum';

const IS_BRANCH = true;

/**
 * Creates a Geometry for a branch or merge connector
 *
 * @param branchLayout - The branch layout info
 * @param layoutConfig - The layout config
 * @param isBranch - True for a branch connector, false for a merge connector
 * @param joinOffsetY - The join offset
 * @returs The Geometry for the branch
 */
function createBranchOrMergeConnectorGeometry(
    branchLayout: LayoutInfo,
    layoutConfig: LayoutConfig,
    isBranch: boolean,
    joinOffsetY: number = 0
): Geometry {
    const width = Math.abs(branchLayout.x);
    const gridHeight = layoutConfig.grid.h;

    const [y, height] = isBranch ? [0, gridHeight] : [joinOffsetY - gridHeight, 2 * gridHeight];

    return {
        x: branchLayout.x < 0 ? branchLayout.x : 0,
        y,
        w: width,
        h: height
    };
}

/**
 * Renders an empty flow for branch
 *
 * @param parentNode - The branch's parent node
 * @param childIndex - The branch's index in the parent
 * @param context - The flow rendering context
 * @returns A FlowRenderInfo for the rendered empty flow
 */
function renderEmptyFlow(parentNode: NodeModel, childIndex: number, context: FlowRenderContext): FlowRenderInfo {
    const { progress, nodeLayoutMap } = context;
    const { x, h, w } = getBranchLayout(parentNode.guid, childIndex, progress, nodeLayoutMap);

    return {
        geometry: { x, y: 0, h, w },
        nodes: [],
        isTerminal: false,
        layoutConfig: context.layoutConfig
    };
}

/**
 * Checks if a node is the flow's root node
 * @param node - The node to check
 * @param context - The flow rendering context
 * @returns true if the node is the root node, otherwise false
 */
function isRootNode(node: NodeModel, context: FlowRenderContext) {
    return node.guid === getRootNode(context.flowModel).guid;
}

/**
 * Checks if the guid of the element being currently traversed is same as that present in deletionPathInfo
 * @param context - The flow rendering context
 * @param currentElementGuid - Guid of the element being currently traversed
 * @return true if the currentElementGuid matches the one present in the deletionPathInfo
 */
function isElementGuidToDelete(context: FlowRenderContext, currentElementGuid: Guid) {
    const { interactionState } = context;
    return (
        interactionState.deletionPathInfo &&
        interactionState.deletionPathInfo.elementGuidToDelete === currentElementGuid
    );
}

/**
 * Checks if the index of the branch being traversed is same the one present in deletionPathInfo
 * @param context - The flow rendering context
 * @param currentChildIndex - Index of the connector branch being traversed
 * @return true if the index of the branch being traversed is same the one present in deletionPathInfo
 */
function isChildIndexToKeep(context: FlowRenderContext, currentChildIndex: number) {
    const { interactionState } = context;
    return (
        interactionState.deletionPathInfo && interactionState.deletionPathInfo.childIndexToKeep === currentChildIndex
    );
}

/**
 * Checks if the connector should be deleted
 * @param context - The flow rendering context
 * @param nodeGuid - Connector's source element guid
 * @param currentChildIndex - Index of the connector branch being traversed
 * @returns true if the connector should be marked as deleted
 */
function shouldDeleteConnector(context: FlowRenderContext, nodeGuid: Guid, currentChildIndex: number) {
    return !!(
        context.isDeletingBranch ||
        (isElementGuidToDelete(context, nodeGuid) && !isChildIndexToKeep(context, currentChildIndex))
    );
}

/**
 * Renders a non-branching node
 *
 * @param node - The node to render
 * @param context - The flow rendering context
 * @returns A NodeRenderInfo for the rendered node
 */
function renderSimpleNode(node: NodeModel, context: FlowRenderContext): NodeRenderInfo {
    const { guid, label, config, nodeType } = node;

    const { elementsMetadata, nodeLayoutMap, progress, layoutConfig, isDeletingBranch } = context;
    const { y, h, x } = getLayout(node.guid, progress, nodeLayoutMap);

    const metadata = getElementMetadata(elementsMetadata, node.elementType);

    const nodeRenderInfo = {
        guid,
        geometry: { x, y, w: layoutConfig.node.icon.w, h },
        menuOpened: isMenuOpened(node.guid, MenuType.NODE, context.interactionState),
        label,
        metadata,
        config,
        flows: [],
        isNew: nodeLayoutMap[guid].prevLayout == null && progress === 0,
        logicConnectors: [],
        isTerminal: nodeType === NodeType.END,
        toBeDeleted: isElementGuidToDelete(context, guid) || isDeletingBranch,
        node
    };

    return nodeRenderInfo;
}

/**
 * Renders a node in the flow
 *
 * @param parentNode - The node's branching parent
 * @param node - The node to render
 * @param context - The flow rendering context
 * @param variant - A connector variant
 * @returns A NodeRenderInfo for the rendered node
 */
function renderNode(
    parentNode: ParentNodeModel,
    node: NodeModel,
    context: FlowRenderContext,
    variant: ConnectorVariant
): NodeRenderInfo {
    const { layoutConfig, progress, nodeLayoutMap } = context;
    const { nodeType } = node;

    const nodeRenderInfo =
        fulfillsBranchingCriteria(node, nodeType) || nodeType === NodeType.LOOP
            ? renderBranchNode(node as ParentNodeModel, context)
            : renderSimpleNode(node, context);

    if (node.fault != null) {
        const stashedIsFault = context.isFault;

        // set isFault to true on the context so that all subsequent connectors are rendered with fault styling
        context.isFault = true;

        renderBranches(node as ParentNodeModel, nodeRenderInfo, context, true);
        const branchLayout = getBranchLayout(node.guid, FAULT_INDEX, progress, nodeLayoutMap);

        // Mark the Fault branch connector to be deleted if it's a part of the branch that's being deleted or
        // if it's associated with the parent element that is being deleted (Pause Element)
        const connectorToBeDeleted = shouldDeleteConnector(context, node.guid, FAULT_INDEX);

        nodeRenderInfo.logicConnectors = (nodeRenderInfo.logicConnectors || []).concat([
            connectorLib.createBranchConnector(
                parentNode.guid,
                FAULT_INDEX,
                createBranchOrMergeConnectorGeometry(branchLayout, layoutConfig, IS_BRANCH),
                ConnectorType.BRANCH_RIGHT,
                layoutConfig,
                context.isFault,
                connectorToBeDeleted
            )
        ]);

        // restore the previous fault state
        context.isFault = stashedIsFault;
    }

    if (nodeType !== NodeType.END && (!nodeRenderInfo.isTerminal || nodeType === NodeType.LOOP)) {
        nodeRenderInfo.nextConnector = createNextConnector(parentNode, node, context, variant);
    }

    return nodeRenderInfo;
}

/**
 * Get the height of the connector to the "next" node
 *
 * @param parentNode - The source node's parent
 * @param node - The source node
 * @param context - The flow render context
 * @param offsetY - The node's offset
 * @return The height of the connector to the next node
 */
function getNextConnectorHeight(
    parentNode: ParentNodeModel,
    node: NodeModel,
    context: FlowRenderContext,
    offsetY: number
): number {
    const { progress, nodeLayoutMap } = context;
    const { next } = node;
    let height;

    if (next != null) {
        const nextNodeLayout = getLayout(next, progress, nodeLayoutMap);
        height = nextNodeLayout.y - offsetY;
    } else if (!isRootNode(parentNode, context)) {
        const { guid } = parentNode;
        height = getLayout(guid, progress, nodeLayoutMap).joinOffsetY - offsetY;
    } else {
        height = 0;
    }

    return height;
}

/**
 * Creates the next node connector for a node
 *
 * @param parentNode - The parent branching node
 * @param node - The source node for the connector
 * @param context - The flow rendering context
 * @param variant - The connector variant
 * @returns A ConnectorRenderInfo for the node's next connector
 */
function createNextConnector(
    parentNode: ParentNodeModel,
    node: NodeModel,
    context: FlowRenderContext,
    variant: ConnectorVariant
): ConnectorRenderInfo {
    const { flowModel, progress, nodeLayoutMap, interactionState, isDeletingBranch } = context;
    const { y, joinOffsetY, addOffset } = getLayout(node.guid, progress, nodeLayoutMap);
    const { nodeType } = node;

    let height = getNextConnectorHeight(parentNode, node, context, y);

    let offsetY = 0;

    let mainVariant =
        fulfillsBranchingCriteria(node, nodeType) || nodeType === NodeType.LOOP
            ? ConnectorVariant.POST_MERGE
            : !(node as ParentNodeModel).children && shouldSupportTimeTriggers(node)
            ? ConnectorVariant.DEFAULT_LABEL
            : ConnectorVariant.DEFAULT;

    let showAdd = true;
    if (mainVariant === ConnectorVariant.POST_MERGE) {
        offsetY = joinOffsetY;
        height = height - joinOffsetY;
        showAdd = getMergeOutcomeCount(flowModel, node as ParentNodeModel) !== 1 || nodeType === NodeType.LOOP;
    }

    if (node.next == null) {
        mainVariant =
            mainVariant === ConnectorVariant.POST_MERGE
                ? ConnectorVariant.POST_MERGE_TAIL
                : ConnectorVariant.BRANCH_TAIL;
    }

    const connectorLabelType =
        !(node as ParentNodeModel).children && shouldSupportTimeTriggers(node)
            ? ConnectorLabelType.BRANCH
            : ConnectorLabelType.NONE;

    const connectorBadgeLabel =
        !(node as ParentNodeModel).children && shouldSupportTimeTriggers(node) ? node.defaultConnectorLabel : undefined;

    return connectorLib.createConnectorToNextNode(
        { prev: node.guid, next: node.next },
        ConnectorType.STRAIGHT,
        connectorLabelType,
        offsetY,
        height,
        isMenuOpened(node.guid, MenuType.CONNECTOR, interactionState),
        context.layoutConfig,
        context.isFault,
        [mainVariant, variant],
        isDeletingBranch,
        showAdd ? addOffset : undefined,
        connectorBadgeLabel
    );
}

/**
 * Renders a branch of a branching node.
 *
 * @param parentNode - The branching node
 * @param childIndex - The index of the branch
 * @param context - The flow rendering context
 * @returns A FlowRenderInfo for the branch
 */
function renderFlowHelper(parentNode: ParentNodeModel, childIndex: number, context: FlowRenderContext): FlowRenderInfo {
    const { flowModel, progress, nodeLayoutMap } = context;

    const layoutChild = childIndex === FAULT_INDEX ? parentNode.fault : parentNode.children[childIndex];
    const branchHead = layoutChild == null ? null : resolveBranchHead(flowModel, layoutChild);

    if (branchHead == null) {
        return renderEmptyFlow(parentNode, childIndex, context);
    }

    const { x, w, h } = getBranchLayout(parentNode.guid, childIndex, progress, nodeLayoutMap);

    let node: NodeModel | null = branchHead;

    const nodeRenderInfos = [];

    const connectorVariant = getConnectorVariant(parentNode, childIndex, context);

    while (node) {
        const nodeRenderInfo = renderNode(parentNode, node, context, connectorVariant);
        nodeRenderInfos.push(nodeRenderInfo);
        node = node.next != null ? resolveNode(flowModel, node.next) : null;
    }

    const isTerminal = !!branchHead.isTerminal;

    return {
        geometry: { x, y: 0, w, h },
        nodes: nodeRenderInfos,
        isTerminal,
        layoutConfig: context.layoutConfig
    };
}

/**
 * Creates a SelectInfo for the conditions of a branch
 *
 * @param flowModel - The flow model
 * @param conditionReferences - The condition references
 * @param fieldName - The field name metadata
 * @return A SelectInfo for the conditions of a branch
 */
function createOptionsForConditionReferences(
    flowModel: FlowModel,
    conditionReferences: any[],
    fieldName: string
): Option[] {
    return conditionReferences.map((reference: any) => {
        const value = reference[fieldName];

        return {
            label: flowModel[value].label,
            value
        };
    });
}

// TODO: FLC use metadata here
function getConditionReferences(parentNode: ParentNodeModel): any {
    // TODO: Use NodeType instead of elementType and update tests
    const elementType = parentNode.elementType;
    if (elementType === 'Decision' || elementType === 'Wait' || elementType === 'START_ELEMENT') {
        return {
            refKey: 'childReference',
            references: parentNode.childReferences
        };
    }
}

/**
 * Creates a SelectInfo for a branching node
 *
 * @param parentNode - The branching node
 * @param context - The flow rendering context
 * @returns A SelectInfo for the connector labels
 */
function createConditionOptions(parentNode: ParentNodeModel, context: FlowRenderContext): Option[] | undefined {
    const { flowModel } = context;

    const conditionReferences = getConditionReferences(parentNode);
    if (conditionReferences != null) {
        const { refKey, references } = conditionReferences;
        return createOptionsForConditionReferences(flowModel, references, refKey);
    }
}

/**
 * Get some misc branching info such as isTerminal and left/right merge indexes
 *
 * @param branchFlowRenderInfos - The flow render infos for the branches
 * @returns misc branching info
 */
function getMiscBranchingInfo(branchFlowRenderInfos: FlowRenderInfo[]) {
    let isTerminal = true;
    let w = 0;

    // the index of the leftmost branch that merges back to its parent
    let leftMergeIndex: any;

    // the index of the rightmost branch that merges back to its parent
    let rightMergeIndex: any;

    branchFlowRenderInfos.forEach((flowRenderInfo, i) => {
        if (!flowRenderInfo.isTerminal) {
            if (leftMergeIndex == null) {
                leftMergeIndex = i;
            }
            rightMergeIndex = i;
        }

        isTerminal = isTerminal && flowRenderInfo.isTerminal;
        w += flowRenderInfo.geometry.w;
    });

    return { isTerminal, w, leftMergeIndex, rightMergeIndex };
}

/**
 * Renders a branch node.
 * The branching node is rendered, along with all its branches, recursively.
 *
 * @param parentNode - The branch node
 * @param context - The flow rendering context
 * @returns A NodeRenderInfo for the rendered node
 */
function renderBranchNode(parentNode: ParentNodeModel, context: FlowRenderContext): NodeRenderInfo {
    const nodeRenderInfo = renderSimpleNode(parentNode, context);
    renderBranches(parentNode, nodeRenderInfo, context);
    return nodeRenderInfo;
}

/**
 * Renders node's children or fault
 *
 * @param node - The node
 * @param nodeRenderInfo - The node's render info
 * @param context - The flow render context
 * @param isFault  - True, if we should render the node's fault, otherwise renders the node's children
 */
function renderBranches(
    node: ParentNodeModel,
    nodeRenderInfo: NodeRenderInfo,
    context: FlowRenderContext,
    isFault: boolean = false
): void {
    const { progress, nodeLayoutMap, layoutConfig, flowModel } = context;
    const { nodeType } = node;
    const children = !isFault ? (node as ParentNodeModel).children : null;

    const layout = getLayout(node.guid, progress, nodeLayoutMap);

    const { y, h } = layout;

    const childIndexes = children != null ? children.map((child, childIndex) => childIndex) : [FAULT_INDEX];
    const conditionOptions = createConditionOptions(node, context);

    const flows = childIndexes.map((i) => {
        // When rendering branches for the element being deleted, setting context.isDeletingBranch to true
        // when traversing a branch whose index is not equal to childIndexToKeep
        if (isElementGuidToDelete(context, node.guid)) {
            context.isDeletingBranch = !isChildIndexToKeep(context, i);
        }
        const flowRenderInfo = renderFlowHelper(node, i, context);
        const child = getLayoutChildOrFault(node, i);
        const height = child == null ? layout.joinOffsetY : getLayout(child, progress, nodeLayoutMap).y;
        flowRenderInfo.preConnector = createPreConnector(node, i, context, height, conditionOptions!);

        //  Resetting context.isDeletingBranch to false after rendering each branch of the parent element being deleted
        if (isElementGuidToDelete(context, node.guid)) {
            context.isDeletingBranch = false;
        }
        return flowRenderInfo;
    });

    const { isTerminal, w, leftMergeIndex, rightMergeIndex } = getMiscBranchingInfo(flows);

    if (!isFault) {
        if (nodeType === NodeType.LOOP) {
            nodeRenderInfo.logicConnectors = [createLoopAfterLastConnector(node.guid, context)];

            const loopBranchHeadGuid = node.children[0];
            const loopBranchHead =
                loopBranchHeadGuid != null ? (flowModel[loopBranchHeadGuid] as BranchHeadNodeModel) : null;
            const renderLoopBackConnector = loopBranchHead == null || !loopBranchHead.isTerminal;

            if (renderLoopBackConnector) {
                nodeRenderInfo.logicConnectors.push(createLoopBackConnector(node.guid, context));
            }
        } else {
            nodeRenderInfo.logicConnectors = [
                ...createBranchConnectors(node, context, layoutConfig),
                ...createMergeConnectors(node, layout.joinOffsetY, context, leftMergeIndex, rightMergeIndex)
            ];
        }
    }

    if (isFault) {
        const flow = flows[0];
        flow.geometry.y = y;
        nodeRenderInfo.faultFlow = flow;
    } else {
        nodeRenderInfo.flows = flows;
        nodeRenderInfo.isTerminal = isTerminal;
    }

    nodeRenderInfo.conditionOptions = conditionOptions;
    nodeRenderInfo.defaultConnectorLabel = node.defaultConnectorLabel;
    nodeRenderInfo.geometry = { x: 0, y, w, h };
}

/**
 * Returns the variant for a connector at a childIndex
 *
 * @param parentNodeGuid - The parent node
 * @param childIndex - The childIndex
 * @param context  - The flow render context
 *
 */
function getConnectorVariant(
    parentNode: ParentNodeModel,
    childIndex: number,
    context: FlowRenderContext
): ConnectorVariant {
    if (childIndex === FAULT_INDEX) {
        return ConnectorVariant.FAULT;
    }

    const { progress, nodeLayoutMap } = context;
    const branchLayout = getBranchLayout(parentNode.guid, childIndex, progress, nodeLayoutMap);
    let variant = ConnectorVariant.DEFAULT;

    let leftBottomEdgeIndex = NaN;
    let rightBottomEdgeIndex = NaN;

    const { children, nodeType } = parentNode;

    let firstNonTerminalBranch = true;

    children.forEach((child, i) => {
        const isTerminal = child != null && resolveBranchHead(context.flowModel, child).isTerminal;

        if (!isTerminal) {
            if (firstNonTerminalBranch) {
                firstNonTerminalBranch = false;
                leftBottomEdgeIndex = i;
            }

            rightBottomEdgeIndex = i;
        }
    });

    if (nodeType === NodeType.LOOP) {
        variant = ConnectorVariant.LOOP;
    } else if (branchLayout.x === 0) {
        variant = ConnectorVariant.CENTER;
    } else if (childIndex === 0 || childIndex === children.length - 1) {
        variant = ConnectorVariant.EDGE;
    }

    if (variant === ConnectorVariant.DEFAULT) {
        if (childIndex === leftBottomEdgeIndex && branchLayout.x < 0) {
            variant = ConnectorVariant.EDGE_BOTTOM;
        } else if (childIndex === rightBottomEdgeIndex && branchLayout.x > 0) {
            variant = ConnectorVariant.EDGE_BOTTOM;
        }
    }

    return variant;
}

/**
 * Utility function to get a connectors' label type
 * @param options - The options
 * @return the connector label type
 */
function getConnectorLabelType({ isFault, isLoop }: { isFault?: boolean; isLoop?: boolean }) {
    if (isFault) {
        return ConnectorLabelType.FAULT;
    } else if (isLoop) {
        return ConnectorLabelType.LOOP_FOR_EACH;
    }

    return ConnectorLabelType.BRANCH;
}
/**
 * Creates a pre connector for a branch. This is the connector that precedes the first node in a branch.
 *
 * @param parentNode - The branch's parent node
 * @param childIndex - The branch index
 * @param context - The flow rendering index
 * @param height - The height of the connector
 * @param conditionOptions - The conditions options
 * @returns A ConnectorRenderInfo for the pre connector
 */
function createPreConnector(
    parentNode: ParentNodeModel,
    childIndex: number,
    context: FlowRenderContext,
    height: number,
    conditionOptions: Option[]
): ConnectorRenderInfo {
    const { interactionState, isDeletingBranch, progress, nodeLayoutMap } = context;

    const [branchHeadGuid, childCount] =
        childIndex === FAULT_INDEX
            ? [parentNode.fault, 1]
            : [parentNode.children[childIndex], parentNode.children.length];

    const isEmptyBranch = branchHeadGuid == null;
    const variant = getConnectorVariant(parentNode, childIndex, context);
    const { nodeType } = parentNode;

    const defaultConditionIndex =
        nodeType === NodeType.BRANCH ? childCount - 1 : nodeType === NodeType.START ? START_IMMEDIATE_INDEX : null;

    let connectorBadgeLabel;
    if (childIndex === defaultConditionIndex) {
        connectorBadgeLabel = parentNode.defaultConnectorLabel;
    } else if (childIndex !== FAULT_INDEX) {
        connectorBadgeLabel =
            nodeType === NodeType.START
                ? conditionOptions && conditionOptions[childIndex - 1].label
                : conditionOptions && conditionOptions[childIndex].label;
    }

    let variants = [variant];
    if (nodeType === NodeType.BRANCH || nodeType === NodeType.LOOP || nodeType === NodeType.START) {
        variants = [isEmptyBranch ? ConnectorVariant.BRANCH_HEAD_EMPTY : ConnectorVariant.BRANCH_HEAD, variant];
    }

    const branchLayout = getBranchLayout(parentNode.guid, childIndex, progress, nodeLayoutMap);

    return connectorLib.createConnectorToNextNode(
        { parent: parentNode.guid, childIndex },
        ConnectorType.STRAIGHT,
        getConnectorLabelType({
            isFault: childIndex === FAULT_INDEX,
            isLoop: nodeType === NodeType.LOOP
        }),
        NO_OFFSET,
        height,
        isMenuOpened(getBranchLayoutKey(parentNode.guid, childIndex), MenuType.CONNECTOR, interactionState),
        context.layoutConfig,
        context.isFault || childIndex === FAULT_INDEX,
        variants,
        isDeletingBranch,
        branchLayout.addOffset,
        connectorBadgeLabel
    );
}

/**
 * Creates the left and right branch connectors for a branching node
 *
 * @param parentNode - The branching node
 * @param context - The flow rendering context
 * @param layoutConfig - The config for the layout
 * @returns An array of ConnectorRenderInfo for the connectors
 */
function createBranchConnectors(
    parentNode: ParentNodeModel,
    context: FlowRenderContext,
    layoutConfig: LayoutConfig
): ConnectorRenderInfo[] {
    const { progress, nodeLayoutMap } = context;

    const connectorIndexes = [0, parentNode.children.length - 1];

    return connectorIndexes
        .map((branchIndex) => {
            const branchLayout = getBranchLayout(parentNode.guid, branchIndex, progress, nodeLayoutMap);

            // Marking the connector as to be deleted if it's a part of the branch being deleted
            // or if it's associated with the element being deleted and not equal to it's childIndexToKeep
            const connectorToBeDeleted = shouldDeleteConnector(context, parentNode.guid, branchIndex);

            return connectorLib.createBranchConnector(
                parentNode.guid,
                branchIndex,
                createBranchOrMergeConnectorGeometry(branchLayout, layoutConfig, IS_BRANCH),
                branchIndex === 0 ? ConnectorType.BRANCH_LEFT : ConnectorType.BRANCH_RIGHT,
                layoutConfig,
                context.isFault,
                connectorToBeDeleted
            );
        })
        .filter((connectorInfo) => connectorInfo.geometry.w > 0 && connectorInfo.geometry.h);
}

/**
 * Creates the left and right merge connectors for a branching node
 *
 * @param parentNode - The branching node
 * @param joinOffsetY - The parent's join offset
 * @param context - The flow rendering context
 * @param leftMergeIndex - The childIndex for the left merging connector
 * @param rightMergeIndex - The childIndex for the right merging connector
 * @returns An array of ConnectorRenderInfo for the connectors
 */
function createMergeConnectors(
    parentNode: ParentNodeModel,
    joinOffsetY: number,
    context: FlowRenderContext,
    leftMergeIndex: number,
    rightMergeIndex: number
): ConnectorRenderInfo[] {
    const { progress, nodeLayoutMap, layoutConfig } = context;

    return [leftMergeIndex, rightMergeIndex]
        .map((mergeIndex, i) => {
            if (mergeIndex == null) {
                return null;
            }

            // Marking the connector as to be deleted if it's a part of the branch being deleted
            // or if it's associated with the element being deleted and not equal to it's childIndexToKeep
            const connectorToBeDeleted = shouldDeleteConnector(context, parentNode.guid, mergeIndex);

            const isLeft = i === 0;
            const branchLayout = getBranchLayout(parentNode.guid, mergeIndex, progress, nodeLayoutMap);
            let connectorType: ConnectorType | null = null;
            const geometry = createBranchOrMergeConnectorGeometry(branchLayout, layoutConfig, !IS_BRANCH, joinOffsetY);

            if (branchLayout.x < 0 && isLeft) {
                connectorType = ConnectorType.MERGE_LEFT;
            } else if (branchLayout.x > 0 && !isLeft) {
                connectorType = ConnectorType.MERGE_RIGHT;
            }

            if (connectorType != null && branchLayout.x !== 0) {
                return connectorLib.createMergeConnector(
                    parentNode.guid,
                    leftMergeIndex!,
                    geometry,
                    connectorType,
                    layoutConfig,
                    context.isFault,
                    connectorToBeDeleted
                );
            }

            return null;
        })
        .filter((renderInfo) => renderInfo != null) as ConnectorRenderInfo[];
}

/**
 * Creates a ConnectorRenderInfo for a loop after last connector
 *
 * @param parentGuid - The loop element Guid
 * @param context - The flow context
 * @returns A loop after last ConnectorRenderInfo
 */
function createLoopAfterLastConnector(parentGuid: Guid, context: FlowRenderContext): ConnectorRenderInfo {
    const { progress, nodeLayoutMap, layoutConfig } = context;
    const childIndex = LOOP_BACK_INDEX;

    const branchLayout = getBranchLayout(parentGuid, childIndex, progress, nodeLayoutMap);
    const connectorToBeDeleted = shouldDeleteConnector(context, parentGuid, childIndex);
    const w = branchLayout.offsetX;

    const geometry = {
        x: -w,
        y: 0,
        w,
        h: branchLayout.h
    };

    return connectorLib.createLoopAfterLastConnector(
        parentGuid,
        geometry,
        layoutConfig,
        context.isFault,
        connectorToBeDeleted
    );
}

/**
 * Creates a ConnectorRenderInfo for a loop back connector
 *
 * @param parentGuid - The loop element Guid
 * @param context - The flow context
 * @returns A loop back ConnectorRenderInfo
 */
function createLoopBackConnector(parentGuid: Guid, context: FlowRenderContext): ConnectorRenderInfo {
    const { progress, nodeLayoutMap, layoutConfig } = context;
    const childIndex = LOOP_BACK_INDEX;
    const branchLayout = getBranchLayout(parentGuid, childIndex, progress, nodeLayoutMap);
    const connectorToBeDeleted = shouldDeleteConnector(context, parentGuid, childIndex);
    const w = branchLayout.w - branchLayout.offsetX;

    const geometry = {
        x: 0,
        y: 0,
        h: branchLayout.h,
        w
    };

    return connectorLib.createLoopBackConnector(
        parentGuid,
        geometry,
        layoutConfig,
        context.isFault,
        connectorToBeDeleted
    );
}

/**
 * Creates a FlowRenderInfo that represents a rendered flow
 *
 * @param context - The context for the flow
 * @param progress - The animation progress (0 to 1)
 * @returns A FlowRenderInfo for the rendered flow
 */
function renderFlow(context: FlowRenderContext, progress: number): FlowRenderInfo {
    Object.assign(context, { progress });
    const rootNode = getRootNode(context.flowModel);

    const flowRenderInfo = renderFlowHelper(rootNode as ParentNodeModel, 0, context);
    return flowRenderInfo;
}

export { renderFlow };
