import { Element, track } from 'engine';
import { PROPERTY_EDITOR } from 'builder_platform_interaction-constant';
import { CRUD, invokePanel } from 'builder_platform_interaction-builder-utils';
import { Store, deepCopy } from 'builder_platform_interaction-store-lib';
import { canvasSelector, resourcesSelector, elementPropertyEditorSelector } from 'builder_platform_interaction-selectors';
import { addElement, updateElement, deleteElement, addConnector, selectOnCanvas, toggleOnCanvas, deselectOnCanvas } from 'builder_platform_interaction-actions';
import { dehydrate, hydrateWithErrors, mutateEditorElement, removeEditorElementMutation } from 'builder_platform_interaction-data-mutation-lib';
import { createFlowElement, ELEMENT_TYPE } from 'builder_platform_interaction-element-config';
import { createConnectorObject } from 'builder_platform_interaction-connector-utils';

let unsubscribeStore;
let storeInstance;

const SAVE_FLOW = 'saveflow';

/**
 * Editor component for flow builder. This is the top-level smart component for
 * flow builder. It is responsible for maintaining the overall state of app and
 * handle event from various child components.
 *
 * @ScrumTeam Process UI
 * @since 214
 */
export default class Editor extends Element {
    @track
    appState = {
        canvas: {
            nodes: [],
            connectors: []
        },
        resources: []
    };

    constructor() {
        super();
        storeInstance = Store.getStore();
        unsubscribeStore = storeInstance.subscribe(this.mapAppStateToStore);
    }

    /**
     * Method to map appstate to store. This method get called when store changes.
     */
    mapAppStateToStore = () => {
        const currentState = storeInstance.getCurrentState();

        const nodes = canvasSelector(currentState);
        const connectors = currentState.connectors;
        const resources = resourcesSelector(currentState);

        this.appState = {
            canvas : {
                nodes,
                connectors
            },
            resources
        };
    };

    /**
     * Handle save event fired by a child component. Fires another event
     * containing flow information, which is handled by container.cmp.
     */
    handleSaveFlow = () => {
        const saveEvent = new CustomEvent(
            SAVE_FLOW,
            {
                bubbles: true,
                composed: true
            }
        );
        this.dispatchEvent(saveEvent);
    };

    /**
     * Handle click event fired by a child component. Fires another event
     * containing resources information, which is handled by container.cmp.
     *  @param {object} event - when add resource button is clicked.
     */
    handleAddResourceClick = (event) => {
        if (event) {
            const mode = CRUD.CREATE;
            invokePanel(PROPERTY_EDITOR, {mode, modalType: 'RESOURCE', modalTitle: 'New Resource'});
        }
    };

    /** *********** Canvas and Node Event Handling *************** **/

    /**
     * Handles the node double clicked event and fires up the property editor based on node type
     * It uses builder-util library to fire up the ui:panel.
     *
     * @param {object} event - node double clicked event coming from node.js
     */
    handleNodeDblClicked = (event) => {
        if (event && event.detail) {
            this.handleNodeSelection(event);
            const mode = CRUD.UPDATE;
            const node = elementPropertyEditorSelector(storeInstance.getCurrentState(), event.detail.canvasElementGUID);
            const nodeUpdate = this.deMutateAndUpdateNodeCollection;
            invokePanel(PROPERTY_EDITOR, { mode, nodeUpdate, node, modalType: 'CANVAS', modalTitle: node.elementType });
        }
    };

    /**
     * Handles the node click event and dispatches an action to select the clicked node and deselect everything else on
     * the canvas when multi-select is off. If multi-select is off, then dispatches an action to toggle the current
     * state of the clicked node.
     *
     * @param {object} event - node clicked event coming from node.js
     */
    handleNodeSelection = (event) => {
        if (event && event.detail) {
            const payload = {
                guid: event.detail.canvasElementGUID
            };

            if (!event.detail.isMultiSelectKeyPressed) {
                storeInstance.dispatch(selectOnCanvas(payload));
            } else {
                storeInstance.dispatch(toggleOnCanvas(payload));
            }
        }
    };

    /**
     * Handles the connector click event and dispatches an action to select the clicked connector and deselect everything else on
     * the canvas when multi-select is off. If multi-select is off, then dispatches an action to toggle the current
     * state of the clicked connector.
     *
     * @param {object} event - connection clicked event coming from canvas.js
     */
    handleConnectorSelection = (event) => {
        if (event && event.detail) {
            const payload = {
                guid : event.detail.connectorGUID
            };

            if (!event.detail.isMultiSelectKeyPressed) {
                storeInstance.dispatch(selectOnCanvas(payload));
            } else {
                storeInstance.dispatch(toggleOnCanvas(payload));
            }
        }
    };

    /**
     * Handles the canvas mouse up event and dispatches an action to deselect all selected nodes and connectors.
     */
    handleElementDeselection = () => {
        storeInstance.dispatch(deselectOnCanvas());
    };

    /**
     * Handles the multi-element delete event and dispatches an action to delete all the selected nodes and connectors.
     *
     * @param {object} event - multi delete event coming from canvas.js
     */
    handleDeleteOnCanvas = (event) => {
        if (event && event.detail) {
            const payload = {
                selectedCanvasElementGUIDs: event.detail.selectedCanvasElementGUIDs,
                connectorGUIDs: event.detail.connectorGUIDs,
                canvasElementsToUpdate: event.detail.canvasElementsToUpdate,
                // TODO: Update in second iteration
                elementType: ELEMENT_TYPE.ASSIGNMENT
            };
            storeInstance.dispatch(deleteElement(payload));
        }
    };

    /**
     * Handles the drag node stop event and dispatches  an action to update the location of the node.
     *
     * @param {object} event - node stop event coming from node.js
     */
    handleDragNodeStop = (event) => {
        if (event && event.detail) {
            const payload = {
                guid: event.detail.canvasElementGUID,
                elementType: event.detail.elementType,
                locationX: event.detail.locationX,
                locationY: event.detail.locationY
            };
            storeInstance.dispatch(updateElement(payload));
        }
    };

    /**
     * Handles the add connection event and dispatches an action to add the newly created connector.
     *
     * @param {object} event - add connection event coming from canvas.js
     */
    handleAddConnection = (event) => {
        if (event && event.detail) {
            const connector = createConnectorObject(
                event.detail.source,
                event.detail.childSource,
                event.detail.target,
                event.detail.label,
                event.detail.type
            );
            storeInstance.dispatch(addConnector(connector));
        }
    };

    /**
     * Handles the canvas element drop event which is fired after an element from left palette is
     * dropped on the canvas.
     *
     * @param {Object} event canvas element drop event
     */
    handleCanvasElementDrop = (event) => {
        const mode = CRUD.CREATE;

        let node = createFlowElement(event.detail.elementType);
        node.locationX = event.detail.locationX;
        node.locationY = event.detail.locationY;

        node = mutateEditorElement(node);
        node = hydrateWithErrors(node);

        const nodeUpdate = this.deMutateAndAddNodeCollection;
        invokePanel(PROPERTY_EDITOR, { mode, node, nodeUpdate, modalType: 'CANVAS', modalTitle: node.elementType });
    };

    /**
     * Method for talking to validation library and store for updating the node collection/flow data.
     *
     * @param {object} node - node object for the particular property editor update
     */
    deMutateAndUpdateNodeCollection(node) {
        // TODO: add validations if needed
        // This deepCopy is needed as a temporary workaround because the unwrap() function that the property editor
        // calls on OK doesn't actually work and keeps the proxy wrappers.
        const nodeForStore = removeEditorElementMutation(dehydrate(deepCopy(node)));

        storeInstance.dispatch(updateElement(nodeForStore));
    }

    deMutateAndAddNodeCollection(node) {
        // TODO: add validations if needed
        // TODO: This looks almost exactly like deMutateAndUpdateNodeCollection. Maybe we should
        // pass the node collection modification mode (CREATE, UPDATE, etc) and switch the store
        // action based on that.
        const nodeForStore = removeEditorElementMutation(dehydrate(deepCopy(node)));
        storeInstance.dispatch(addElement(nodeForStore));
    }

    disconnectedCallback() {
        unsubscribeStore();
    }
}