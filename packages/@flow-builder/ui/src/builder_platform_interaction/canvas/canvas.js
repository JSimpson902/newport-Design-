import { Element, api } from 'engine';
import { EVENT, CONNECTOR_OVERLAY } from 'builder_platform_interaction-constant';
import { drawingLibInstance as lib } from 'builder_platform_interaction-drawing-lib';

/**
 * Canvas component for flow builder.
 *
 * @ScrumTeam Process UI
 * @since 214
 */

export default class Canvas extends Element {
    @api nodes = [];
    @api connectors = [];

    jsPlumbContainer = false;
    isMouseDown = false;
    isPanning = false;

    // TODO: Move it to a library
    isMultiSelect(event) {
        return event.shiftKey || event.metaKey;
    }

    constructor() {
        super();
        lib.setNewConnection(this.connectionAdded);
        lib.clickConnection(this.connectionClicked);
    }

    /**
     * Method to set up any new connections made within the canvas.
     * @param {object} connectorInfo - Contains all the information about the new connector
     */
    connectionAdded = (connectorInfo) => {
        connectorInfo.connection.getOverlay(CONNECTOR_OVERLAY.ARROW).setVisible(true);
        connectorInfo.connection.getOverlay(CONNECTOR_OVERLAY.LABEL).setVisible(true);
        connectorInfo.connection.getOverlay(CONNECTOR_OVERLAY.LABEL).setLabel('Label');
        const addConnectionEvent = new CustomEvent(EVENT.ADD_CONNECTION,
            {
                bubbles: true,
                composed: true,
                detail: {
                    source: connectorInfo.sourceId,
                    target: connectorInfo.targetId,
                    label: connectorInfo.connection.getOverlay('__label').getLabel()
                }
            }
        );
        this.dispatchEvent(addConnectionEvent);
    };

    /**
     * Fires connector selection event
     * @param {object} connection - jsPlumb's connector object
     * @param {object} event - connection click event coming from drawing-lib.js
     */
    connectionClicked = (connection, event) => {
        event.stopPropagation();
        const isMultiSelectKeyPressed = this.isMultiSelect(event);
        const connectorSelectedEvent = new CustomEvent(EVENT.CONNECTOR_SELECTED, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                connectorGUID: connection.id,
                isMultiSelectKeyPressed
            }
        });

        this.dispatchEvent(connectorSelectedEvent);
    };

    /**
     * Handling mouse down event for canvas.
     * @param {object} event - mouse down event
     */
    handleMouseDown = (event) => {
        event.preventDefault();
        this.isMouseDown = true;
    };

    /**
     * Handling mouse move event for canvas.
     * @param {object} event - mouse move event
     */
    handleMouseMove = (event) => {
        event.preventDefault();
        if (this.isMouseDown) {
            this.isPanning = true;
        }
    };

    /**
     * Handling mouse up event for canvas. If mouse up happens directly on canvas/innerCanvas then marking the nodes
     * as unselected. Also checking the isCanvasInFocus and isPanning condition to prevent nodes from deselecting when
     * the user clicks outside canvas or stops panning.
     * @param {object} event - mouse up event
     */
    handleMouseUp = (event) => {
        event.preventDefault();
        this.isMouseDown = false;
        const canvasArea = this.root.querySelector('#canvas');
        canvasArea.focus();
        if ((event.target.id === 'canvas' || event.target.id === 'innerCanvas') && !this.isPanning) {
            const canvasMouseUpEvent = new CustomEvent(EVENT.CANVAS_MOUSEUP, {
                bubbles: true,
                composed: true,
                cancelable: true
            });
            this.dispatchEvent(canvasMouseUpEvent);
        }

        this.isPanning = false;
    };

    /**
     * Handling right click event for canvas.
     */
    handleContextMenu = () => {
        this.isMouseDown = false;
        this.isPanning = false;
    };

    /**
     * Helper method to update connectorGUIDs and canvasElementsToUpdate arrays
     * @param {Array} selectedCanvasElementGUIDs - Contains GUIDs of all the selected canvas elements
     * @param {Array} connectorGUIDs - Contains GUIDs of all the connectors that need to be deleted
     * @param {Array} canvasElementsToUpdate - Contains GUIDs of all the canvas elements that need to be updated
     * @param {Object} connector - A single connector object
     */
    updateCanvasAndConnectorArray = (selectedCanvasElementGUIDs, connectorGUIDs, canvasElementsToUpdate, connector) => {
        if (selectedCanvasElementGUIDs.indexOf(connector.target) !== -1) {
            canvasElementsToUpdate.push(connector.source);
            connectorGUIDs.push(connector.guid);
        } else if (selectedCanvasElementGUIDs.indexOf(connector.source) !== -1) {
            connectorGUIDs.push(connector.guid);
        }
    };

    /**
     * Handling the trash click event coming from node.js
     * @param {object} event - canvas element delete event
     */
    handleCanvasElementDelete = (event) => {
        if (event && event.detail) {
            const selectedCanvasElementGUIDs = [event.detail.canvasElementGUID];
            const connectorGUIDs = [];
            const canvasElementsToUpdate = [];

            // Pushing all the selected and associated connectors to connectorGUIDs and pushing all affected canvas
            // elements to canvasElementsToUpdate to update their connector count
            this.connectors.map((connector) => {
                this.updateCanvasAndConnectorArray(selectedCanvasElementGUIDs, connectorGUIDs, canvasElementsToUpdate, connector);
                return connector;
            });

            const deleteEvent = new CustomEvent(EVENT.DELETE_ON_CANVAS, {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    selectedCanvasElementGUIDs,
                    connectorGUIDs,
                    canvasElementsToUpdate
                }
            });
            this.dispatchEvent(deleteEvent);
        }
    };

    /**
     * Handling key down event for canvas and deleting selected nodes from the canvas if delete key is pressed.
     * @param {object} event - key down event
     */
    handleKeyDown = (event) => {
        if (event.key === 'Backspace') {
            const selectedCanvasElementGUIDs = [];
            const connectorGUIDs = [];
            const canvasElementsToUpdate = [];

            // Pushing all the selected canvas elements to selectedCanvasElementGUIDs
            this.nodes.map((node) => {
                if (node.config.isSelected) {
                    selectedCanvasElementGUIDs.push(node.guid);
                }
                return node;
            });

            // Pushing all the selected and associated connectors to connectorGUIDs and pushing all affected canvas
            // elements to canvasElementsToUpdate to update their connector count
            this.connectors.map((connector) => {
                if (connector.config.isSelected) {
                    connectorGUIDs.push(connector.guid);
                    canvasElementsToUpdate.push(connector.source);
                } else {
                    this.updateCanvasAndConnectorArray(selectedCanvasElementGUIDs, connectorGUIDs, canvasElementsToUpdate, connector);
                }
                return connector;
            });

            const deleteEvent = new CustomEvent(EVENT.DELETE_ON_CANVAS, {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    selectedCanvasElementGUIDs,
                    connectorGUIDs,
                    canvasElementsToUpdate
                }
            });
            this.dispatchEvent(deleteEvent);
        }
    };

    renderedCallback() {
        if (!this.jsPlumbContainer) {
            lib.setContainer('innerCanvas');
            this.jsPlumbContainer = true;
        }
    }
}