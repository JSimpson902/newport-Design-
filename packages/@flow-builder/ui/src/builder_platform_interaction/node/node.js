import { LightningElement, api } from 'lwc';
import { getConfigForElementType, ICON_SHAPE } from 'builder_platform_interaction/elementConfig';
import { ELEMENT_TYPE, FLOW_TRIGGER_TYPE, FLOW_TRIGGER_SAVE_TYPE } from 'builder_platform_interaction/flowMetadata';
import {
    DragNodeEvent,
    DragNodeStopEvent,
    NodeMouseDownEvent,
    SelectNodeEvent,
    EditElementEvent,
    DeleteElementEvent
} from 'builder_platform_interaction/events';
import { drawingLibInstance as lib } from 'builder_platform_interaction/drawingLib';
import { LABELS } from './nodeLabels';
import { format, getPropertyOrDefaultToTrue } from 'builder_platform_interaction/commonUtils';
import { isTestMode } from 'builder_platform_interaction/contextLib';
import { clamp } from 'builder_platform_interaction/clampLib';
import { logInteraction } from 'builder_platform_interaction/loggingUtils';

/**
 * Node component for flow builder.
 *
 * @ScrumTeam Process UI
 * @since 214
 */

const { NONE, BEFORE_SAVE, SCHEDULED, SCHEDULED_JOURNEY } = FLOW_TRIGGER_TYPE;
const { CREATE, UPDATE, CREATE_AND_UPDATE } = FLOW_TRIGGER_SAVE_TYPE;

export default class Node extends LightningElement {
    currentNodeLabel = null;

    @api
    node = {
        config: {}
    };

    getNodeConfig() {
        return getConfigForElementType(this.node.elementType).nodeConfig;
    }

    isSelectable() {
        return getPropertyOrDefaultToTrue(this.getNodeConfig(), 'isSelectable');
    }

    isEditable() {
        return getPropertyOrDefaultToTrue(this.getNodeConfig(), 'isEditable');
    }

    getIconShape() {
        return this.getNodeConfig().iconShape;
    }

    get nodeLocation() {
        return `left: ${this.node.locationX}px; top: ${this.node.locationY}px`;
    }

    get nodeClasses() {
        let classes = 'icon-section slds-align_absolute-center';

        if (this.getIconShape() === ICON_SHAPE.DIAMOND) {
            classes = `${classes} decision-icon-section`;
        }

        if (this.node.config.isSelected) {
            classes = `${classes} selected`;
        }

        return classes;
    }

    get rotateIconClass() {
        return this.getIconShape() === ICON_SHAPE.DIAMOND ? 'rotate-icon' : '';
    }

    get buttonClass() {
        return this.getIconShape() === ICON_SHAPE.CIRCLE
            ? `icon slds-icon__container_circle`
            : `icon slds-icon_container`;
    }

    get iconName() {
        return this.getNodeConfig().iconName;
    }

    get iconShape() {
        return this.getIconShape();
    }

    get iconSize() {
        return this.getNodeConfig().iconSize || 'large';
    }

    get iconBackgroundColor() {
        return this.getNodeConfig().iconBackgroundColor;
    }

    get hasAvailableConnections() {
        return this.node.maxConnections !== this.node.connectorCount;
    }

    get showTrashIcon() {
        return (
            this.node.config.isSelected &&
            getPropertyOrDefaultToTrue(getConfigForElementType(this.node.elementType), 'isDeletable')
        );
    }

    get nodeIconTitle() {
        // Special case if elementType equals START_ELEMENT
        if (this.node.elementType === ELEMENT_TYPE.START_ELEMENT) {
            switch (this.node.triggerType) {
                case NONE:
                    return LABELS.nodeIconTitleStartDefault;
                case BEFORE_SAVE:
                    return format(
                        this.formatStartSaveType(this.node.recordTriggerType),
                        this.node.object.toLowerCase()
                    );
                case SCHEDULED:
                case SCHEDULED_JOURNEY:
                    return LABELS.nodeIconTitleStartScheduled;
                default:
                    return '';
            }
        }
        return format(
            LABELS.nodeIconTitle,
            getConfigForElementType(this.node.elementType).labels.singular,
            this.node.label
        );
    }

    formatStartSaveType(saveType) {
        switch (saveType) {
            case CREATE:
                return LABELS.nodeIconTitleStartBeforeSaveCreated;
            case UPDATE:
                return LABELS.nodeIconTitleStartBeforeSaveUpdated;
            case CREATE_AND_UPDATE:
                return LABELS.nodeIconTitleStartBeforeSaveCreatedOrUpdated;
            default:
                return '';
        }
    }

    get endPointTitle() {
        return LABELS.endPointTitle;
    }

    get endPointA11yTitle() {
        return LABELS.endPointTitleA11yText;
    }

    get nodeIconA11yTitle() {
        return LABELS.nodeIconA11yText;
    }

    get trashCanAlternativeText() {
        return format(
            LABELS.trashCanAlternativeText,
            getConfigForElementType(this.node.elementType).labels.singular,
            this.node.label
        );
    }

    get nodeLabel() {
        return getPropertyOrDefaultToTrue(this.getNodeConfig(), 'showLabel') ? this.node.label : '';
    }

    get nodeTypeLabel() {
        return getConfigForElementType(this.node.elementType).labels.singular;
    }

    /**
     * Build main parent template div class adding some "test mode only" value to it to ease up Selenium effort
     */
    get parentDivComputedClass() {
        let classes = 'node-container slds-is-absolute slds-text-align_center';

        if (!this.isSelectable()) {
            classes = `${classes} nonselectable-cursor-style`;
        }

        if (this.node.config.isHighlighted) {
            classes = `${classes} highlighted-container`;
        }

        if (isTestMode()) {
            classes = `${classes} test-node-${(this.node.elementType || '').toLowerCase()}`;
        }

        return classes;
    }

    isMultiSelect(event) {
        if (event && event.shiftKey) {
            return event.shiftKey;
        }
        return false;
    }

    isNodeDragging = false;

    /**
     * Handles the node click event on node div and fires off a nodeSelected event.
     * @param {object} event - node clicked event
     */
    handleNodeClick = event => {
        event.stopPropagation();
        const isMultiSelectKeyPressed = this.isMultiSelect(event);

        if (this.isSelectable() && (!this.node.config.isSelected || !this.isNodeDragging)) {
            const nodeSelectedEvent = new SelectNodeEvent(this.node.guid, isMultiSelectKeyPressed);
            this.dispatchEvent(nodeSelectedEvent);
        }
        this.isNodeDragging = false;
    };

    /**
     * Handles the node double click event on node div and fires off a edit element event.
     * @param {object} event - node double clicked event
     */
    handleDblClick = event => {
        event.stopPropagation();

        if (this.isEditable()) {
            const canvasElementGUID = this.node.guid;
            const editElementEvent = new EditElementEvent(canvasElementGUID);
            this.dispatchEvent(editElementEvent);
        }
    };

    /**
     * Fires an event to delete the node. We are passing the guid as an array
     * since multiple elements can be deleted using the delete key.
     * @param {object} event - trash can click event
     */
    handleTrashClick = event => {
        event.stopPropagation();
        if (!this.isNodeDragging) {
            const { guid, elementType } = this.node;
            const deleteEvent = new DeleteElementEvent([guid], elementType);
            this.dispatchEvent(deleteEvent);
            logInteraction(`element-trash-can-icon`, 'node-icon', { guid, elementType }, 'click');
        }
        this.isNodeDragging = false;
    };

    /**
     * Handles the mouse down event on node div and fires off a node mousedown event.
     * @param {object} event - node mousedown event
     */
    handleMouseDown = () => {
        const mouseDownEvent = new NodeMouseDownEvent(this.node.guid);
        this.dispatchEvent(mouseDownEvent);
    };

    /**
     * Marks the current node selected and deselects the rest (if not multi-selected)
     * as soon as drag begins
     * @param {object} event - drag start event
     */
    @api
    dragStart = event => {
        this.isNodeDragging = true;
        if (this.isSelectable() && !this.node.config.isSelected) {
            const isMultiSelectKeyPressed = this.isMultiSelect(event.e);
            const nodeSelectedEvent = new SelectNodeEvent(this.node.guid, isMultiSelectKeyPressed);
            this.dispatchEvent(nodeSelectedEvent);
        }
    };

    /**
     * Updates the location of the node once the user stops dragging it on the canvas.
     * @param {object} event - drag stop event
     */
    @api
    dragStop = event => {
        if (
            (event.finalPos[0] !== this.node.locationX || event.finalPos[1] !== this.node.locationY) &&
            event.selection &&
            event.selection.length > 0
        ) {
            const dragStopEvent = new DragNodeStopEvent(event.selection);
            this.dispatchEvent(dragStopEvent);
        }
    };

    /**
     * Updates the location of the node while the user is dragging it on the canvas.
     * @param {object} event - drag event
     */
    @api
    drag = event => {
        const dragNodeEvent = new DragNodeEvent(this.node.guid, event.pos[0], event.pos[1]);
        this.dispatchEvent(dragNodeEvent);
    };

    @api focus() {
        this.template.querySelector('button.icon').focus();
    }

    renderedCallback() {
        const canvasElementContainer = this.template.querySelector('.node-container');

        // revalidate the specific canvas element when it is being rendered (in case the canvas element's location has been programmatically updated)
        if (canvasElementContainer && canvasElementContainer.getAttribute('id')) {
            lib.revalidate(canvasElementContainer);
        }

        const textElementLabel = this.template.querySelector('.text-element-label');
        if (textElementLabel && this.nodeLabel !== this.currentNodeLabel) {
            clamp(textElementLabel, {
                label: this.nodeLabel
            });
        }
        this.currentNodeLabel = this.nodeLabel;
    }
}
