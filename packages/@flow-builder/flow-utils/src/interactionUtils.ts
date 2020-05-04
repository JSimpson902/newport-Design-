import { FlowInteractionState } from './flowRendererUtils';
import MenuType from './MenuType';
import { Guid } from './model';
import { getBranchLayoutKey } from './layout';

/**
 * Util functions for flow interactions
 */
interface MenuEventDetail {
    top: number;
    left: number;
    guid: string;
    parent: string;
    childIndex: number;
    type: MenuType;
}

/**
 * Checks if a menu is opened for a node.
 *
 * @param nodeGuid - The guid for the node
 * @param menuType - The type of the menu to check for
 * @param interactionState - The flow's interaction state
 * @returns True if the menu is opened, false otherwise
 */
function isMenuOpened(nodeGuid: Guid, menuType: MenuType, interactionState: FlowInteractionState): boolean {
    if (!interactionState.menuInfo) {
        return false;
    } else {
        const menuInfo = interactionState.menuInfo;
        return menuInfo.key === nodeGuid && menuInfo.type === menuType;
    }
}

/**
 * Updates a flow's FlowInteractionState so that the menu is toggled
 *
 * @param menuEventDetail - The menu event detail
 * @param interactionState - The flow interaction state
 * @returns A new, updated FlowInteractionState
 */
function toggleFlowMenu(
    menuEventDetail: MenuEventDetail,
    interactionState: FlowInteractionState
): FlowInteractionState {
    let menuInfo = interactionState.menuInfo;

    if (!menuInfo) {
        const { parent, childIndex, type } = menuEventDetail;
        const key = parent ? getBranchLayoutKey(parent, childIndex) : menuEventDetail.guid;

        menuInfo = {
            key,
            type
        };
    } else {
        menuInfo = null;
    }

    return { ...interactionState, menuInfo };
}

function closeFlowMenu(interactionState: FlowInteractionState): FlowInteractionState {
    return { ...interactionState, menuInfo: null };
}

export { isMenuOpened, toggleFlowMenu, closeFlowMenu };
