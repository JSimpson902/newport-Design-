// @ts-nocheck
import { LABELS } from './flcNodeMenuLabels';
import { ElementType } from 'builder_platform_interaction/autoLayoutCanvas';

// TODO: Remove this as a part of branch connect story
const deleteElementAndReconnectLabel = 'Delete Element and Reconnect';

export const CONTEXTUAL_MENU_MODE = {
    BASE_ACTIONS_MODE: 'BASE_ACTIONS_MODE',
    DELETE_BRANCH_ELEMENT_MODE: 'DELETE_BRANCH_ELEMENT_MODE'
};

export const ELEMENT_ACTION_CONFIG = {
    COPY_ACTION: {
        icon: 'utility:copy_to_clipboard',
        label: LABELS.copyActionLabel,
        value: 'COPY_ACTION'
    },
    DELETE_ACTION: {
        icon: 'utility:delete',
        iconVariant: 'error',
        label: LABELS.deleteActionLabel,
        value: 'DELETE_ACTION'
    },
    ADD_FAULT_ACTION: {
        icon: 'utility:delete',
        iconVariant: 'error',
        label: LABELS.addFaultActionLabel,
        value: 'ADD_FAULT_ACTION'
    },
    DELETE_FAULT_ACTION: {
        icon: 'utility:delete',
        iconVariant: 'error',
        label: LABELS.deleteFaultActionLabel,
        value: 'DELETE_FAULT_ACTION'
    },
    DELETE_END_ELEMENT_ACTION: {
        icon: 'utility:reply',
        iconVariant: 'error',
        label: deleteElementAndReconnectLabel,
        value: 'DELETE_ACTION'
    },
    EDIT_DETAILS_ACTION: {
        buttonTextLabel: LABELS.editDetailsFooterActionLabel,
        buttonTextTitle: LABELS.editDetailsFooterActionTitle,
        buttonVariant: 'brand',
        value: 'EDIT_DETAILS_ACTION'
    },
    DELETE_BRANCH_ELEMENT_ACTION: {
        buttonIcon: 'utility:delete',
        buttonIconPosition: 'left',
        buttonTextLabel: LABELS.deleteFooterActionLabel,
        buttonTextTitle: LABELS.deleteFooterActionTitle,
        buttonVariant: 'destructive',
        value: 'DELETE_BRANCH_ELEMENT_ACTION'
    }
};

const getFooterData = contextualMenuMode => {
    return contextualMenuMode === CONTEXTUAL_MENU_MODE.DELETE_BRANCH_ELEMENT_MODE
        ? ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION
        : ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION;
};

export const getMenuConfiguration = (
    { type, label, description, canHaveFaultConnector },
    contextualMenuMode,
    elementHasFault
) => {
    const nodeActions =
        type === ElementType.END
            ? [ELEMENT_ACTION_CONFIG.DELETE_END_ELEMENT_ACTION]
            : [ELEMENT_ACTION_CONFIG.COPY_ACTION, ELEMENT_ACTION_CONFIG.DELETE_ACTION];

    if (canHaveFaultConnector) {
        nodeActions.push(
            elementHasFault ? ELEMENT_ACTION_CONFIG.DELETE_FAULT_ACTION : ELEMENT_ACTION_CONFIG.ADD_FAULT_ACTION
        );
    }

    const menuConfiguration = {
        header: {
            label,
            description
        },
        body: {
            nodeActions
        }
    };

    if (type !== ElementType.END) {
        const footerData = getFooterData(contextualMenuMode);
        menuConfiguration.footer = footerData;
    }

    return menuConfiguration;
};
