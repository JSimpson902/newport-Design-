import { DeleteGoToConnectionEvent, GoToPathEvent, PasteOnCanvasEvent } from 'builder_platform_interaction/alcEvents';
import AlcMenu from 'builder_platform_interaction/alcMenu';
import { ConnectionSource, ElementMetadata } from 'builder_platform_interaction/autoLayoutCanvas';
import { AddElementEvent } from 'builder_platform_interaction/events';
import { commonUtils } from 'builder_platform_interaction/sharedUtils';
import { api } from 'lwc';
import {
    configureMenu,
    GOTO_ACTION,
    GOTO_DELETE_ACTION,
    GOTO_REROUTE_ACTION,
    PASTE_ACTION
} from './alcConnectorMenuConfig';
import { LABELS } from './alcConnectorMenuLabels';
const { debounce } = commonUtils;

const DELAY_TIME = 250;

/**
 * The connector menu overlay. It is displayed when clicking on a connector.
 */
export default class AlcConnectorMenu extends AlcMenu {
    static className = 'connector-menu';

    _searchableMenuData = {};

    _metadata!: ConnectorMenuMetadata;

    searchInput = '';

    actionsLoaded = [];

    @api
    source!: ConnectionSource;

    @api
    elementsMetadata: ElementMetadata[] = [];

    @api
    numPasteElementsAvailable!: number;

    /* whether the end element should be shown in the menu */
    @api
    canAddEndElement!: boolean;

    @api
    canAddGoto!: boolean;

    @api
    isGoToConnector!: boolean;

    @api
    set metadata(metadata) {
        // We need to change Spinner Indicator
        // whenever metadata is changed
        this._metadata = metadata;
        this.showSpinner = this.shouldShowSpinner();
    }

    get metadata() {
        return this._metadata;
    }

    get menuConfiguration() {
        return configureMenu(
            this.searchInput,
            this._metadata,
            this.elementsMetadata,
            this.canAddEndElement,
            this.numPasteElementsAvailable,
            this.canAddGoto,
            this.isGoToConnector
        );
    }

    get labels() {
        return LABELS;
    }

    shouldShowSpinner() {
        return (this.searchInput && this._metadata.isLoading) as boolean;
    }

    debouncedChangeInput = debounce((value) => {
        this.searchInput = value;
        this.showSpinner = this.shouldShowSpinner();
    }, DELAY_TIME);

    handleElementSearchInputChange(event) {
        event.stopPropagation();
        this.debouncedChangeInput(event.detail.value);
    }

    handleInputClick(event) {
        event.stopPropagation();
    }

    handleInputKeydown(event) {
        event.stopPropagation();
    }

    /**
     * Menu item action behaviour dependent on the attributes of the selected element
     *
     * @param currentTarget the HTML element selected in the menu
     */
    override doSelectMenuItem(currentTarget: HTMLElement) {
        super.doSelectMenuItem(currentTarget);

        const { value, subType, actionType, actionName } = currentTarget.dataset;

        const source = this.source;

        switch (value) {
            case PASTE_ACTION:
                this.dispatchEvent(new PasteOnCanvasEvent(this.source));
                break;
            case GOTO_ACTION:
                this.dispatchEvent(new GoToPathEvent(source));
                break;
            case GOTO_DELETE_ACTION:
                this.dispatchEvent(new DeleteGoToConnectionEvent(source));
                break;
            case GOTO_REROUTE_ACTION:
                this.dispatchEvent(new GoToPathEvent(source, true));
                break;
            default: {
                const alcConnectionSource = source;
                this.dispatchEvent(
                    new AddElementEvent({
                        elementType: value!,
                        elementSubtype: subType!,
                        actionType: actionType!,
                        actionName: actionName!,
                        locationX: 0,
                        locationY: 0,
                        alcConnectionSource,
                        designateFocus: true
                    })
                );
            }
        }
    }
}
