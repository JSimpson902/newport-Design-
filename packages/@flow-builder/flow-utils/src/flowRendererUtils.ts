import { LayoutInfo, NodeLayoutMap, getBranchLayoutKey } from './layout';
import ConnectorType from './ConnectorTypeEnum';
import { SvgInfo, Geometry } from './svgUtils';
import { FlowModel, ElementsMetadata, ElementMetadata, NodeRef, Guid } from './model';
import MenuType from './MenuType';
import ElementType from './ElementType';

export enum ConditionType {
    DEFAULT,
    FAULT,
    STANDARD
}

export interface FlowRenderContext {
    flowModel: FlowModel;
    nodeLayoutMap: NodeLayoutMap;
    progress: number;
    interactionState: FlowInteractionState;
    elementsMetadata: ElementsMetadata;
    layoutConfig: LayoutConfig;
    isFault: boolean;
}

export interface FlowInteractionState {
    menuInfo: {
        key: Guid;
        type: MenuType;
    } | null;
}

export interface FlowRenderInfo {
    geometry: Geometry;
    nodes: NodeRenderInfo[];
    isTerminal: boolean;
    layoutConfig: object;
    preConnector?: ConnectorRenderInfo;
}

export interface NodeRenderInfo {
    geometry: Geometry;
    label: string;
    metadata: ElementMetadata;
    config: { isSelected: boolean; isHighlighted: boolean; canSelect: boolean };
    nextConnector?: ConnectorRenderInfo;
    flows: FlowRenderInfo[];
    faultFlow?: FlowRenderInfo;
    isNew?: boolean;
    logicConnectors: ConnectorRenderInfo[];
    conditionOptions?: Option[];
    defaultConnectorLabel?: string;
    guid: string;
    menuOpened: boolean;
    isTerminal: boolean;
}

export interface Dimension {
    w: number;
    h: number;
}

export enum ConnectorVariant {
    DEFAULT = 'default',
    EDGE = 'edge',
    CENTER = 'center'
}

interface ConnectorTypeLayoutConfig {
    h: number;
    addOffset: number;
    labelOffset?: number;
    variants?: {
        [key in ConnectorVariant]: any;
    };
    svgMarginTop?: number;
    svgMarginBottom?: number;
}

export interface LayoutConfig {
    grid: {
        w: number;
        h: number;
    };
    menu: {
        marginBottom: number;
    };
    connector: {
        icon: {
            w: number;
            h: number;
        };
        strokeWidth: number;
        curveRadius: number;
        menu: Dimension;
        types: {
            [key in ConnectorType]?: ConnectorTypeLayoutConfig;
        };
    };
    node: {
        icon: {
            w: number;
            h: number;
        };
        w: number;
        offsetX: number;
        menu: {
            [key in ElementType]?: Dimension | undefined;
        };
    };
    branch: {
        defaultWidth: number;
        emptyWidth: number;
    };
}

export interface Option {
    label: string;
    value: Guid;
}

export interface MenuInfo {
    guid: NodeRef;
    menuOpened: boolean;
}

export interface ConnectorAddInfo {
    offsetY: number;
    menuOpened: boolean;
}

export interface SelectInfo {
    value: NodeRef;
    options: Option[];
}

export interface ConnectorConnectionInfo {
    prev?: NodeRef;
    next?: NodeRef;
    parent?: NodeRef;
    childIndex?: number;
}

export interface ConnectorRenderInfo {
    type: ConnectorType;
    geometry: Geometry;
    svgInfo: SvgInfo;
    addInfo?: ConnectorAddInfo;
    connectionInfo: ConnectorConnectionInfo;

    isFault: boolean;

    labelOffsetY?: number;
    conditionOptions?: Option[];
    conditionValue?: Guid;
    conditionType?: ConditionType;
    isNew?: boolean;
}

function getLayoutByKey(key: string, progress: number, nodeLayoutMap: NodeLayoutMap): LayoutInfo {
    const { prevLayout, layout } = nodeLayoutMap[key];

    return !prevLayout || progress === 1 ? layout : tween(prevLayout, layout, progress);
}

function tweenValue(prevValue: number, value: number, progress: number): number {
    const delta = (value - prevValue) * progress;
    return prevValue + delta;
}

/**
 * Tweens LayoutInfo values
 *
 * @param prevLayout - The previous LayoutInfo
 * @param layout - The current LayoutInfo
 * @param progress - The rendering progress
 * @returns A LayoutInfo that with the tweened values
 */
function tween(prevLayout: LayoutInfo, layout: LayoutInfo, progress: number): LayoutInfo {
    return {
        x: tweenValue(prevLayout.x, layout.x, progress),
        y: tweenValue(prevLayout.y, layout.y, progress),
        w: tweenValue(prevLayout.w, layout.w, progress),
        h: tweenValue(prevLayout.h, layout.h, progress),
        offsetX: tweenValue(prevLayout.offsetX, layout.offsetX, progress),
        joinOffsetY: tweenValue(prevLayout.joinOffsetY, layout.joinOffsetY, progress)
    };
}

function getLayout(nodeGuid: string, progress: number, nodeLayoutMap: NodeLayoutMap): LayoutInfo {
    return getLayoutByKey(nodeGuid, progress, nodeLayoutMap);
}

/**
 * Get a LayoutInfo for a branch
 *
 * @param parentGuid - A branching element guid
 * @param childIndex  - A branch index
 * @param progress - Rendering progress
 * @param nodeLayoutMap - The node layout map
 * @returns A LayoutInfo for the branch
 */
function getBranchLayout(
    parentGuid: Guid,
    childIndex: number,
    progress: number,
    nodeLayoutMap: NodeLayoutMap
): LayoutInfo {
    const key = getBranchLayoutKey(parentGuid, childIndex);
    return getLayoutByKey(key, progress, nodeLayoutMap);
}

export { getBranchLayout, tween, getLayout };
