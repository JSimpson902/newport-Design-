import { drawingLibInstance as lib } from 'builder_platform_interaction/drawingLib';
import { getConfigForElementType } from 'builder_platform_interaction/elementConfig';
import { getPropertyOrDefaultToTrue } from 'builder_platform_interaction/commonUtils';

/**
 * Helper function to set the id on the canvas element container.
 *
 * @param {Object} canvasElementContainer - Container of the canvas element
 * @param {String} canvasElementGuid - Guid of the canvas element
 * @private
 */
const _setIdOnCanvasElementContainer = (
    canvasElementContainer,
    canvasElementGuid
) => {
    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }

    if (!canvasElementGuid) {
        throw new Error(
            'canvasElementGuid is not defined. It must be defined.'
        );
    }

    if (!canvasElementContainer.getAttribute('id')) {
        canvasElementContainer.setAttribute('id', canvasElementGuid);
    }
};

/**
 * Helper function to set the canvas element as draggable using jsPlumb.
 *
 * @param {Object} canvasElementContainerTemplate - Template of the canvas element
 * @param {Object} canvasElementContainer - Container of the canvas element
 * @param {String} elementType - Type of the canvas element
 * @private
 */
const _setElementAsDraggable = (
    canvasElementContainerTemplate,
    canvasElementContainer,
    elementType
) => {
    if (!canvasElementContainerTemplate) {
        throw new Error(
            'canvasElementContainerTemplate is not defined. It must be defined.'
        );
    }

    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }

    if (!elementType) {
        throw new Error('elementType is not defined. It must be defined.');
    }

    const { dragStart, dragStop, drag } = canvasElementContainerTemplate;
    const isDraggable = getPropertyOrDefaultToTrue(
        getConfigForElementType(elementType).nodeConfig,
        'isDraggable'
    );

    if (isDraggable) {
        lib.setDraggable(canvasElementContainer, {
            start: dragStart,
            stop: dragStop,
            drag
        });
    }
};

/**
 * Helper function to set the canvas element as a target using jsPlumb.
 *
 * @param {Object} canvasElementContainer - Container of the canvas element
 * @param {String} elementType - Type of the canvas element
 * @private
 */
const _setElementAsTarget = (canvasElementContainer, elementType) => {
    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }

    if (!elementType) {
        throw new Error('elementType is not defined. It must be defined.');
    }

    const canBeTarget = getPropertyOrDefaultToTrue(
        getConfigForElementType(elementType).nodeConfig,
        'canBeConnectorTarget'
    );

    if (canBeTarget && !lib.isTarget(canvasElementContainer)) {
        lib.makeTarget(canvasElementContainer);
    }
};

/**
 * Helper function to set the canvas element as a source using jsPlumb.
 *
 * @param {Object} canvasElementContainer - Container of the canvas element
 * @private
 */
const _setElementAsSource = (canvasElementContainer, elementType) => {
    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }

    if (!elementType) {
        throw new Error('elementType is not defined. It must be defined.');
    }

    const canBeSource = getPropertyOrDefaultToTrue(
        getConfigForElementType(elementType).nodeConfig,
        'canBeConnectorSource'
    );

    if (canBeSource && !lib.isSource(canvasElementContainer)) {
        lib.makeSource(canvasElementContainer);
    }
};

/**
 * Check if canvas element selected state (updated in the store) has been changed from the previous one
 * (canvasElementContainer contains the jtk-drag-selected class when the canvas element is selected), if so then
 * update its properties, otherwise skip updating the style and making heavy call from Jsplumb
 *
 * @param {Boolean} isCanvasElementSelected - New isSelected state of the canvas element
 * @param {Object} canvasElementContainer - Canvas element container
 * @returns {Boolean} true if canvas element selected state has changed
 */
const _hasCanvasElementSelectionChanged = (
    isCanvasElementSelected,
    canvasElementContainer
) => {
    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }
    return (
        isCanvasElementSelected !==
        (canvasElementContainer &&
            canvasElementContainer.classList &&
            canvasElementContainer.classList.contains('jtk-drag-selected'))
    );
};

/**
 * Helper function to update the drag selection based on the isSelected and addToDragSelection config.
 *
 * @param {Object} canvasElementContainer - Container of the canvas element
 * @param {Object} canvasElementConfig - Canvas element's config
 * @private
 */
const _updateDragSelection = (
    canvasElementContainer,
    canvasElementConfig = {}
) => {
    if (!canvasElementContainer) {
        throw new Error(
            'canvasElementContainer is not defined. It must be defined.'
        );
    }

    if (
        _hasCanvasElementSelectionChanged(
            canvasElementConfig.isSelected,
            canvasElementContainer
        )
    ) {
        if (
            canvasElementConfig.isSelected ||
            canvasElementConfig.addToDragSelection
        ) {
            lib.addToDragSelection(canvasElementContainer);
        } else {
            lib.removeFromDragSelection(canvasElementContainer);
        }
    }
};

/**
 * Helper function to set up a jsPlumb Connection.
 *
 * @param {Object} connector - Object containing the connector data
 * @param {Object} sourceElementContainer - Container div of the source element
 * @param {Object} targetElementContainer - Container div of the target element
 * @returns {Object} jsPlumbConnector - Newly setup jsPlumb connection
 * @private
 */
const _setJsPlumbConnection = (
    connector,
    sourceElementContainer,
    targetElementContainer
) => {
    if (!connector) {
        throw new Error('connector is not defined. It must be defined.');
    }

    if (!sourceElementContainer) {
        throw new Error(
            'sourceElementContainer is not defined. It must be defined.'
        );
    }

    if (!targetElementContainer) {
        throw new Error(
            'sourceElementContainer is not defined. It must be defined.'
        );
    }

    const jsPlumbConnector = lib.setExistingConnections(
        sourceElementContainer,
        targetElementContainer,
        connector.label,
        connector.guid,
        connector.type
    );
    return jsPlumbConnector;
};

/**
 * Check if connector selected state (updated in the store) has been changed from the previous one
 * (jsPlumbConnector contains the connector-selected class when the connector is selected), if so then
 * update its properties, otherwise skip updating the style and making heavy call from Jsplumb
 *
 * @param {Boolean} isConnectorSelected - New isSelected state of the connector
 * @param {Object} jsPlumbConnector - JsPlumb Connector
 * @returns {Boolean} true if connector selected state has changed
 */
const _hasConnectorSelectionChanged = (
    isConnectorSelected,
    jsPlumbConnector
) => {
    if (!jsPlumbConnector) {
        throw new Error('jsPlumbConnector is not defined. It must be defined.');
    }
    return (
        isConnectorSelected !==
        (jsPlumbConnector &&
            jsPlumbConnector.getClass() &&
            jsPlumbConnector.getClass().includes('connector-selected'))
    );
};

/**
 * Helper function to update the styling of the connector based on it's selected state.
 *
 * @param {Object} connector - Object containing the connector data
 * @param {Object} jsPlumbConnector - Connector Object provided by jsPlumb
 * @private
 */
const _updateConnectorStyling = (connector, jsPlumbConnector) => {
    if (!connector) {
        throw new Error('connector is not defined. It must be defined.');
    }

    if (!jsPlumbConnector) {
        throw new Error('jsPlumbConnector is not defined. It must be defined.');
    }

    if (
        _hasConnectorSelectionChanged(
            connector.config.isSelected,
            jsPlumbConnector
        )
    ) {
        if (connector.config.isSelected) {
            lib.selectConnector(jsPlumbConnector, connector.type);
        } else {
            lib.deselectConnector(jsPlumbConnector, connector.type);
        }
    }
};

/**
 * Helper function to set up the connector label.
 *
 * @param {Object} connector - Object containing the connector data
 * @param {Object} jsPlumbConnector - Connector Object provided by jsPlumb
 * @private
 */
const _setConnectorLabel = (connector, jsPlumbConnector) => {
    if (!connector) {
        throw new Error('connector is not defined. It must be defined.');
    }

    if (!jsPlumbConnector) {
        throw new Error('jsPlumbConnector is not defined. It must be defined.');
    }

    if (jsPlumbConnector.getLabel() !== connector.label) {
        jsPlumbConnector.setLabel(connector.label);
    }
};

/**
 * Checks if the user is trying to multi-select, i.e. checks if the shift key is pressed during the event or not.
 *
 * @param {Object} event - Any event that needs to be checked for multi-selection
 * @returns {boolean}  Returns true if shift key is down during the event
 */
export const isMultiSelect = event => {
    return event && event.shiftKey;
};

/**
 * Helper function to set the id and jsPlumb properties on the canvas elements. Also updates the drag selection and
 * pans the element into view if needed.
 *
 * @param {Object[]} canvasElementTemplates - Array of Canvas Element Templates
 * @returns {Object} canvasElementGuidToContainerMap - Map of Guid to Canvas Element Container
 */
export const setupCanvasElements = canvasElementTemplates => {
    const canvasElementGuidToContainerMap = {};
    const canvasElementTemplatesLength =
        canvasElementTemplates && canvasElementTemplates.length;
    for (let index = 0; index < canvasElementTemplatesLength; index++) {
        const canvasElementContainerTemplate = canvasElementTemplates[index];
        const canvasElementContainer =
            canvasElementContainerTemplate &&
            canvasElementContainerTemplate.shadowRoot &&
            canvasElementContainerTemplate.shadowRoot.firstChild;

        const canvasElementGuid =
            canvasElementContainerTemplate &&
            canvasElementContainerTemplate.node &&
            canvasElementContainerTemplate.node.guid;
        canvasElementGuidToContainerMap[
            canvasElementGuid
        ] = canvasElementContainer;
        _setIdOnCanvasElementContainer(
            canvasElementContainer,
            canvasElementGuid
        );

        const elementType =
            canvasElementContainerTemplate &&
            canvasElementContainerTemplate.node &&
            canvasElementContainerTemplate.node.elementType;
        _setElementAsDraggable(
            canvasElementContainerTemplate,
            canvasElementContainer,
            elementType
        );
        _setElementAsTarget(canvasElementContainer, elementType);
        _setElementAsSource(canvasElementContainer, elementType);

        const canvasElementConfig =
            canvasElementContainerTemplate &&
            canvasElementContainerTemplate.node &&
            canvasElementContainerTemplate.node.config;
        _updateDragSelection(canvasElementContainer, canvasElementConfig);
    }

    return canvasElementGuidToContainerMap;
};

/**
 * Helper function to set the jsPlumb properties on the connectors along with updating the styling of the connectors.
 *
 * @param {String[]} connectors - Array of store connector guids
 * @param {Object} jsPlumbConnectorMap - Map of Guid to jsPlumbConnector instance
 * @param {Object} canvasElementGuidToContainerMap - Map of Guid to Canvas Element Container
 *
 * @returns {Object} - Map of Guid to jsPlumbConnector
 */
export const setupConnectors = (
    connectors,
    jsPlumbConnectorMap,
    canvasElementGuidToContainerMap
) => {
    if (!connectors) {
        throw new Error('connectors is not defined. It must be defined.');
    }

    if (!jsPlumbConnectorMap) {
        throw new Error(
            'jsPlumbConnectorMap is not defined. It must be defined.'
        );
    }

    if (!canvasElementGuidToContainerMap) {
        throw new Error(
            'canvasElementGuidToContainerMap is not defined. It must be defined.'
        );
    }

    // This contains all the newly added connectors
    const additionJsPlumbConnectorMap = {};

    connectors.forEach(connector => {
        const connectorGuid = connector.guid;

        let jsPlumbConnector = jsPlumbConnectorMap[connectorGuid];

        if (!jsPlumbConnector) {
            const sourceElementContainer =
                canvasElementGuidToContainerMap[connector.source];
            const targetElementContainer =
                canvasElementGuidToContainerMap[connector.target];
            jsPlumbConnector = _setJsPlumbConnection(
                connector,
                sourceElementContainer,
                targetElementContainer
            );

            additionJsPlumbConnectorMap[connectorGuid] = jsPlumbConnector;

            if (connector.config && connector.config.isSelected) {
                lib.selectConnector(jsPlumbConnector, connector.type);
            }
        } else {
            _updateConnectorStyling(connector, jsPlumbConnector);
            _setConnectorLabel(connector, jsPlumbConnector);
        }
    });

    return { ...additionJsPlumbConnectorMap, ...jsPlumbConnectorMap };
};
