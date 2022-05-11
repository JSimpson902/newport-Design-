import { LABELS } from './alcNodeMenuLabels';

const SUBFLOW = 'Subflow';

export enum NodeMenuMode {
    Default,
    Delete
}

export const ELEMENT_ACTION_CONFIG = {
    COPY_ACTION: {
        icon: 'utility:copy_to_clipboard',
        label: LABELS.copyActionLabel,
        value: 'COPY_ACTION'
    },
    CUT_ACTION: {
        icon: 'utility:cut',
        label: LABELS.cutActionLabel,
        value: 'CUT_ACTION'
    },
    DELETE_ACTION: {
        icon: 'utility:delete',
        iconVariant: 'error',
        label: LABELS.deleteActionLabel,
        value: 'DELETE_ACTION'
    },
    ADD_FAULT_ACTION: {
        icon: 'utility:level_down',
        label: LABELS.addFaultActionLabel,
        value: 'ADD_FAULT_ACTION'
    },
    DELETE_FAULT_ACTION: {
        icon: 'utility:level_down',
        iconVariant: 'error',
        label: LABELS.deleteFaultActionLabel,
        value: 'DELETE_FAULT_ACTION'
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
    },
    OPEN_SUBFLOW_ACTION: {
        icon: 'utility:new_window',
        label: LABELS.openReferenceFlowTitle,
        value: 'OPEN_SUBFLOW_ACTION'
    }
};

const getFooterData = (nodeMenuMode: NodeMenuMode) => {
    return nodeMenuMode === NodeMenuMode.Delete
        ? ELEMENT_ACTION_CONFIG.DELETE_BRANCH_ELEMENT_ACTION
        : ELEMENT_ACTION_CONFIG.EDIT_DETAILS_ACTION;
};

export const getMenuConfiguration = (
    { label, description, elementType },
    contextualMenuMode,
    canHaveFaultConnector,
    elementHasFault,
    disableDeleteElements
) => {
    const nodeActions = disableDeleteElements
        ? [ELEMENT_ACTION_CONFIG.COPY_ACTION]
        : [ELEMENT_ACTION_CONFIG.COPY_ACTION, ELEMENT_ACTION_CONFIG.CUT_ACTION, ELEMENT_ACTION_CONFIG.DELETE_ACTION];

    if (elementType === SUBFLOW) {
        nodeActions.push(ELEMENT_ACTION_CONFIG.OPEN_SUBFLOW_ACTION);
    }

    if (canHaveFaultConnector && !elementHasFault) {
        nodeActions.push(ELEMENT_ACTION_CONFIG.ADD_FAULT_ACTION);
    } else if (elementHasFault && !disableDeleteElements) {
        nodeActions.push(ELEMENT_ACTION_CONFIG.DELETE_FAULT_ACTION);
    }

    const menuConfiguration = {
        header: {
            label,
            description
        },
        body: {
            nodeActions
        },
        footer: getFooterData(contextualMenuMode)
    };

    return menuConfiguration;
};
