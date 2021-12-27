import { deselectOnCanvas } from 'builder_platform_interaction/actions';
import { setElementsMetadata } from 'builder_platform_interaction/alcCanvasUtils';
import { ConnectionSource } from 'builder_platform_interaction/autoLayoutCanvas';
import { ClosePropertyEditorEvent } from 'builder_platform_interaction/events';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { lwcUtils } from 'builder_platform_interaction/sharedUtils';
import { Store } from 'builder_platform_interaction/storeLib';
import { api, LightningElement, track } from 'lwc';
import { augmentElementsMetadata } from './alcCanvasContainerUtils';

// TODO: W-9613981 [Trust] Remove hardcoded alccanvas offsets
const LEFT_PANE_WIDTH = 320;
const NODE_ICON_HALF_HEIGHT_WITH_PADDING = 58;

let storeInstance;

const defaultConnectorMenuMetadata: ConnectorMenuMetadata = {
    elementTypes: new Set<string>(),
    menuComponent: 'builder_platform_interaction/alcConnectorMenu'
};

const selectors = {
    alcCanvas: 'builder_platform_interaction-alc-canvas'
};

/**
 * Flow Builder container for the ALC builder
 *
 * Configures to the ALC Builder with the Flow Builder elements metadata and
 * listens to the store, passing on the updated state when there are updates.
 */
export default class AlcCanvasContainer extends LightningElement {
    dom = lwcUtils.createDomProxy(this, selectors);

    _storeUnsubsribe;
    _elementsMetadata;
    _startElementMetadata!: UI.Start;
    _connectorMenuMetadata = defaultConnectorMenuMetadata;

    @api
    set elementsMetadata(elementsMetadata) {
        if (elementsMetadata != null) {
            this.setStartElementMetadata();
            elementsMetadata = augmentElementsMetadata(elementsMetadata, this._startElementMetadata);
            this.updateConnectorMenuMetadata(elementsMetadata);
            setElementsMetadata(elementsMetadata);
            this._elementsMetadata = elementsMetadata;
            this.mapCanvasStateToStore();
        }
    }

    get elementsMetadata() {
        return this._elementsMetadata;
    }

    /**
     * The active element refers to the element currently being edited using the property editor panel
     */
    @api
    activeElementGuid;

    @api
    isPasteAvailable;

    @api
    isSelectionMode;

    @api
    disableAddElements;

    @api
    disableDeleteElements;

    @api
    disableEditElements;

    @api
    disableAnimation;

    @api
    disableDebounce;

    @track
    flowModel;

    rootElement;

    isAutoLayoutCanvas = false;

    get shouldRenderCanvas() {
        // only render the canvas when all the data it needs is ready
        return this.isAutoLayoutCanvas && this._elementsMetadata && this.flowModel;
    }

    get canvasOffsets() {
        // TODO: W-9613981 [Trust] Remove hardcoded alccanvas offsets
        return this.isSelectionMode
            ? [LEFT_PANE_WIDTH, NODE_ICON_HALF_HEIGHT_WITH_PADDING]
            : [0, NODE_ICON_HALF_HEIGHT_WITH_PADDING];
    }

    constructor() {
        super();

        storeInstance = Store.getStore();
        this._storeUnsubsribe = storeInstance.subscribe(this.mapCanvasStateToStore);
    }

    disconnectedCallback() {
        this._storeUnsubsribe();
    }

    setStartElementMetadata() {
        const storeState = storeInstance.getCurrentState();
        const { elements } = storeState;

        this._startElementMetadata = Object.values<UI.Element>(elements).find(
            (ele) => ele.elementType === ELEMENT_TYPE.START_ELEMENT
        ) as UI.Start;
    }

    mapCanvasStateToStore = () => {
        const storeState = storeInstance.getCurrentState();
        const { elements, properties } = storeState;

        // W-7868857: check the mode to avoid rendering a flow that has been switched to free form
        this.isAutoLayoutCanvas = properties.isAutoLayoutCanvas;

        this.rootElement =
            this.rootElement ||
            Object.values<UI.Element>(elements).find((ele) => ele.elementType === ELEMENT_TYPE.ROOT_ELEMENT);

        if (this.rootElement && this.elementsMetadata) {
            this.flowModel = storeState.elements;
        }
    };

    handleAlcCanvasClick = (event) => {
        event.stopPropagation();
        const closePropertyEditorEvent = new ClosePropertyEditorEvent();
        this.dispatchEvent(closePropertyEditorEvent);
    };

    /**
     * Calling the function in alcCanvas to close the contextual menu
     */
    @api
    callCloseNodeOrConnectorMenuInBuilder() {
        const alcCanvas = this.getAlcCanvas();
        if (alcCanvas) {
            alcCanvas.closeNodeOrConnectorMenu();
        }
    }

    /**
     * Set focus on alcCanvas when focus is set on the container
     */
    @api
    focus() {
        const alcCanvas = this.getAlcCanvas();
        alcCanvas.focus();
    }

    @api
    focusOnNode = (elementGuid: UI.Guid) => {
        const alcCanvas = this.getAlcCanvas();
        if (alcCanvas) {
            alcCanvas.focusOnNode(elementGuid);
        }
    };

    @api
    focusOnConnector = (source: ConnectionSource) => {
        const alcCanvas = this.getAlcCanvas();
        if (alcCanvas) {
            alcCanvas.focusOnConnector(source);
        }
    };

    @api
    shiftFocus = (shiftBackward: boolean) => {
        this.getAlcCanvas().shiftFocus(shiftBackward);
    };

    /**
     * Handles the canvas mouse up event and dispatches an action to deselect all selected nodes and connectors.
     */
    handleElementDeselection = () => {
        storeInstance.dispatch(deselectOnCanvas);
    };

    /**
     * Updates the connector menu metadata
     *
     * @param nextElementsMetadata - The next elements metadata
     */
    updateConnectorMenuMetadata(nextElementsMetadata) {
        nextElementsMetadata = [...nextElementsMetadata];
        const nextElementsMetadataSet = new Set(nextElementsMetadata.map(({ elementType }) => elementType));

        // Comparing the existing elementMetadata to the newElementsMetadata
        // If an item of the old list is not found in the new one, push it the updated list and don't
        // include it in the connectorMenuElementTypes
        this._elementsMetadata?.forEach((metadata) => {
            if (!nextElementsMetadataSet.has(metadata.elementType)) {
                nextElementsMetadata.push({ ...metadata });
            }
        });

        this._elementsMetadata = nextElementsMetadata;

        const connectorMenuElementTypes = this._elementsMetadata
            .map(({ elementType }) => elementType)
            .filter(
                (elementType) => elementType !== ELEMENT_TYPE.ACTION_CALL || !nextElementsMetadataSet.has(elementType)
            );

        this._connectorMenuMetadata = {
            ...this._connectorMenuMetadata,
            elementTypes: new Set(connectorMenuElementTypes)
        };
    }

    /**
     * Get the alc canvas element
     *
     * @returns the alc canvas element
     */
    getAlcCanvas() {
        return this.dom.as<any>().alcCanvas;
    }
}
