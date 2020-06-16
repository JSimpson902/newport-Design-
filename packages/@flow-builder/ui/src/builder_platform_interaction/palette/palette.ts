// @ts-nocheck
import { LightningElement, api, track } from 'lwc';
import { LocatorIconClickedEvent, PaletteItemChevronClickedEvent } from 'builder_platform_interaction/events';
import { logInteraction } from 'builder_platform_interaction/loggingUtils';
import { flatten } from './paletteLib';
import { LABELS } from './paletteLabels';

/**
 * NOTE: Please do not use this without contacting Process UI DesignTime first!
 *
 * An interim component to give us lightning-tree-grid functionality. This will
 * be removed in the future once lightning-tree-grid satisfies our requirements.
 */
export default class Palette extends LightningElement {
    @api iconSize;
    @api showLocatorIcon;

    @api
    // eslint-disable-next-line @lwc/lwc/valid-api
    get data() {
        return this.rows;
    }

    set data(value) {
        this.original = value;
        this.init();
    }

    @api
    get itemsDraggable() {
        return this.draggableItems;
    }

    set itemsDraggable(value) {
        this.draggableItems = value === 'true';
    }

    @api
    get detailsButton() {
        return this.showResourceDetails;
    }

    set detailsButton(value) {
        this.showResourceDetails = value === 'true';
    }

    @api
    get showSectionItemCount() {
        return this.showItemCount;
    }

    set showSectionItemCount(value) {
        this.showItemCount = value === 'true';
        this.init();
    }

    get enableLocator() {
        return this.showLocatorIcon && this.showResourceDetails;
    }

    @track rows = [];
    @track draggableItems = false;
    @track showItemCount = false;
    @track showResourceDetails = false;

    labels = LABELS;
    original = [];
    collapsedSections = {};
    itemMap = {};

    /**
     * Sets up the internal state used to render the tree.
     */
    init() {
        // TODO: If lightning-tree-grid doesn't satisfy our requirements and we
        // end up getting stuck with using palette, we should consider making
        // resources-lib give us data in a format that works without needing to
        // flatten it here.
        const options = {
            collapsedSections: this.collapsedSections,
            showSectionItemCount: this.showItemCount
        };
        const rows = flatten(this.original, options);
        this.rows = rows;
        this.itemMap = this.createItemMap(rows);
    }

    /**
     * This maps unique identifiers back to the row data. This is helpful when
     * handling events and all we have is the dom element.
     *
     * @param {Array}
     *            rows The flattened row data
     * @returns {Object} A mapping of tree node identifier to its row data
     */
    createItemMap(rows) {
        const itemMap = {};
        rows.forEach(row => {
            itemMap[row.key] = row;
        });
        return itemMap;
    }

    /**
     * When toggling a section, we need to flatten the original data again using
     * the updated collapsed sections state.
     *
     * @param {Event}
     *            event A section toggle event
     */
    handleToggleSection(event) {
        const sectionId = event.currentTarget.dataset.id;
        this.collapsedSections[sectionId] = !this.collapsedSections[sectionId];
        this.init();
    }

    /**
     * Dispatches the LocatorIconClickedEvent that highlights the element on canvas
     * @param {object} event onclick event
     */
    handleLocatorClick(event) {
        const guid = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.guid;
        const locatorIconEvent = new LocatorIconClickedEvent(guid);
        this.dispatchEvent(locatorIconEvent);
    }

    /**
     * Dispatches an event which opens the resource details panel.
     *
     * @param {Event}
     *            event A resource details button click event
     */
    handleResourceDetailsClick(event) {
        const guid = event.currentTarget.dataset.guid;
        const iconName = event.currentTarget.dataset.iconName;
        const paletteItemChevronClickedEvent = new PaletteItemChevronClickedEvent(guid, iconName);
        this.dispatchEvent(paletteItemChevronClickedEvent);
        logInteraction('element-details', 'manager-tab', null, 'click');
    }

    /**
     * Handler for when an element is dragged.
     *
     * @param {Object}
     *            event drag start event
     */
    handleDragStart(event) {
        if (event) {
            const referenceElement = event.currentTarget;
            const item = this.itemMap[referenceElement.dataset.key];

            // Only items in the map should be considered draggable.
            if (!item) {
                event.dataTransfer.effectAllowed = 'none';
                return;
            }

            const paletteItem = referenceElement.querySelector('builder_platform_interaction-palette-item');
            let dragElement = paletteItem.dragImage;
            if (!dragElement) {
                const elementIcon = paletteItem.elementIcon;
                dragElement = elementIcon && elementIcon.iconElement;
            }

            const eventDetail = {
                elementType: item.elementType,
                elementSubtype: item.elementSubtype,
                actionType: item.actionType,
                actionName: item.actionName
            };
            event.dataTransfer.setData('text', JSON.stringify(eventDetail));
            if (event.dataTransfer.setDragImage && dragElement) {
                event.dataTransfer.setDragImage(dragElement, 0, 0);
            }
            event.dataTransfer.effectAllowed = 'copy';
        }
    }
}
