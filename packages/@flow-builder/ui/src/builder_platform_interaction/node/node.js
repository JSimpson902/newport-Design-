import { Element, api } from 'engine';
import { getConfigForElementType } from 'builder_platform_interaction-builder-utils';
import { EVENT } from 'builder_platform_interaction-constant';
import { drawingLibInstance as lib } from 'builder_platform_interaction-drawing-lib';

/**
 * Node component for flow builder.
 *
 * @ScrumTeam Process UI
 * @author Priya Mittal
 * @since 214
 */

let isMultiSelectKeyPressed = false;

export default class Node extends Element {
    @api node = {
        config: {}
    };

    get nodeGuid() {
        return this.node.guid;
    }

    get nodeLocation() {
        return `left: ${this.node.locationX}px; top: ${this.node.locationY}px`;
    }

    get nodeClasses() {
        let classes = 'icon-section';
        if (this.node.config.isSelected) {
            classes = 'icon-section selected';
        }
        return classes;
    }

    get iconName() {
        return getConfigForElementType(this.node.elementType, 'nodeConfig').iconName;
    }

    get isSelected() {
        return this.node.config.isSelected;
    }

    get nodeLabel() {
        return this.node.label;
    }

    get nodeDescription() {
        return this.node.description;
    }

    /**
     * Handles the native double click event on node div and fires off a nodeDblClicked event.
     * @param {object} event - node double clicked event
     */
    handleDblClick = (event) => {
        event.stopPropagation();
        const nodeDblClickedEvent = new CustomEvent(EVENT.NODE_DBLCLICKED, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                nodeGUID : this.node.guid
            }
        });
        this.dispatchEvent(nodeDblClickedEvent);
    };

    /**
     * Handles the native click event on node div and fires off a nodeSelected event.
     * TODO: Hide trash-cans when multiple elements are selected
     * @param {object} event - node clicked event
     */
    handleNodeClick = (event) => {
        event.stopPropagation();
        if ((!this.node.config.isSelected || event.shiftKey || event.metaKey)) {
            isMultiSelectKeyPressed = (event.shiftKey || event.metaKey);
            const nodeSelectedEvent = new CustomEvent(EVENT.NODE_SELECTED, {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    nodeGUID : this.node.guid,
                    isMultiSelectKeyPressed
                }
            });
            this.dispatchEvent(nodeSelectedEvent);
        }
    };

    /**
     * Removes the node from jsPlumb and fires an event to remove the node from the dom.
     * TODO: Need to update it to delete associated connectors as well
     * @param {object} event - trash can click event
     */
    handleTrashClick = (event) => {
        event.stopPropagation();
        lib.removeNodeFromLib(this.node.guid);
        const nodeDeleteEvent = new CustomEvent(EVENT.NODE_DELETE, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                nodeGUID : this.node.guid
            }
        });
        this.dispatchEvent(nodeDeleteEvent);
    };

    /**
     * Marks the current node selected and deselects the rest (if not multi-selected)
     * as soon as drag begins
     * @param {object} event - drag start event
     */
    dragStart = (event) => {
        if (!this.node.config.isSelected) {
            isMultiSelectKeyPressed = (event.e.shiftKey || event.e.metaKey);
            const nodeSelectedEvent = new CustomEvent(EVENT.NODE_SELECTED, {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    nodeGUID : this.node.guid,
                    isMultiSelectKeyPressed
                }
            });
            this.dispatchEvent(nodeSelectedEvent);
        }
    };

    /**
     * Updates the location of the node once the user stops dragging it on the canvas.
     * @param {object} event - drag stop event
     */
    dragStop = (event) => {
        if (event.finalPos[0] !== this.node.locationX || event.finalPos[1] !== this.node.locationY) {
            const dragStopEvent = new CustomEvent(EVENT.DRAG_STOP, {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    nodeGUID: this.node.guid,
                    locationX: event.finalPos[0],
                    locationY: event.finalPos[1]
                }
            });
            this.dispatchEvent(dragStopEvent);
        }
    };

    renderedCallback() {
        if (lib.getContainer().classList.contains('innerCanvas')) {
            const nodeContainer = document.getElementById(this.node.guid).parentElement;
            lib.setDraggable(nodeContainer, {
                start : (event) => this.dragStart(event),
                stop: (event) => this.dragStop(event)
            });

            if (!lib.isSource(this.node.guid)) {
                lib.makeSource(this.node.guid, 1);
            }

            if (!lib.isTarget(this.node.guid)) {
                lib.makeTarget(this.node.guid);
            }

            if (this.node.config.isSelected) {
                lib.addToDragSelection(nodeContainer);
            } else {
                lib.removeFromDragSelection(nodeContainer);
            }
        }
    }
}