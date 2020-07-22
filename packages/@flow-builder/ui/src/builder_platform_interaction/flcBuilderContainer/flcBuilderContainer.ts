// @ts-nocheck
import { LightningElement, api, track } from 'lwc';
import { Store } from 'builder_platform_interaction/storeLib';
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import {
    getFlcElementType,
    startElementDescription,
    hasTrigger,
    hasContext
} from 'builder_platform_interaction/flcBuilderUtils';
import { ClosePropertyEditorEvent } from 'builder_platform_interaction/events';

let startElementMetadata = null;

function augmentElementsMetadata(elementsMetadata) {
    const startElement = getConfigForElementType(ELEMENT_TYPE.START_ELEMENT);
    const endElement = getConfigForElementType(ELEMENT_TYPE.END_ELEMENT);

    elementsMetadata = elementsMetadata.map(metadata => ({
        ...metadata,
        type: getFlcElementType(metadata.elementType)
    }));

    return elementsMetadata.concat([
        {
            section: null,
            icon: '',
            label: '',
            elementType: ELEMENT_TYPE.ROOT_ELEMENT,
            value: ELEMENT_TYPE.ROOT_ELEMENT,
            type: getFlcElementType(ELEMENT_TYPE.ROOT_ELEMENT),
            canHaveFaultConnector: false,
            supportsMenu: false
        },
        {
            section: endElement.nodeConfig.section,
            icon: endElement.nodeConfig.iconName,
            iconBackgroundColor: endElement.nodeConfig.iconBackgroundColor,
            iconShape: endElement.nodeConfig.iconShape,
            iconSize: endElement.nodeConfig.iconSize,

            description: endElement.nodeConfig.description,
            label: endElement.labels.singular,
            value: ELEMENT_TYPE.END_ELEMENT,
            elementType: ELEMENT_TYPE.END_ELEMENT,
            type: getFlcElementType(ELEMENT_TYPE.END_ELEMENT),
            canHaveFaultConnector: false,
            supportsMenu: false
        },
        {
            description: startElementDescription(startElementMetadata.triggerType),
            section: null,
            icon: startElement.nodeConfig.iconName,
            iconBackgroundColor: startElement.nodeConfig.iconBackgroundColor,
            iconShape: startElement.nodeConfig.iconShape,
            iconSize: startElement.nodeConfig.iconSize,
            label: startElement.labels.singular,
            value: ELEMENT_TYPE.START_ELEMENT,
            elementType: ELEMENT_TYPE.START_ELEMENT,
            type: getFlcElementType(ELEMENT_TYPE.START_ELEMENT),
            canHaveFaultConnector: false,
            supportsMenu: true,
            hasTrigger: hasTrigger(startElementMetadata.triggerType),
            hasContext: hasContext(startElementMetadata.triggerType)
        }
    ]);
}

let storeInstance;

/**
 * Flow Builder container for the FLC builder
 *
 * Configures to the FLC Builder with the Flow Builder elements metadata and
 * listens to the store, passing on the updated state when there are updates.
 */
export default class FlcBuilderContainer extends LightningElement {
    _storeUnsubsribe;
    _elementsMetadata;

    @api
    set elementsMetadata(elementsMetadata) {
        if (elementsMetadata != null) {
            this.setStartElementMetadata();
            this._elementsMetadata = augmentElementsMetadata(elementsMetadata);
            this.mapCanvasStateToStore();
        }
    }

    get elementsMetadata() {
        return this._elementsMetadata;
    }

    @api
    isPasteAvailable;

    @api
    isSelectionMode;

    @track
    flowModel = null;

    rootElement = null;

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

        startElementMetadata = Object.values(elements).find(ele => ele.elementType === ELEMENT_TYPE.START_ELEMENT);
    }

    mapCanvasStateToStore = () => {
        const storeState = storeInstance.getCurrentState();
        const { elements } = storeState;

        this.rootElement =
            this.rootElement || Object.values(elements).find(ele => ele.elementType === ELEMENT_TYPE.ROOT_ELEMENT);

        if (this.rootElement && this.elementsMetadata) {
            this.flowModel = storeState.elements;
        }
    };

    handleFlcBuilderClick = event => {
        event.stopPropagation();
        const closePropertyEditorEvent = new ClosePropertyEditorEvent();
        this.dispatchEvent(closePropertyEditorEvent);
    };
}
