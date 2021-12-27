// @ts-nocheck
import { LocatorIconClickedEvent } from 'builder_platform_interaction/events';
import { loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { api, LightningElement } from 'lwc';
import { LABELS } from './usedByContentItemLabels';

const { logInteraction } = loggingUtils;

export default class UsedByContentItem extends LightningElement {
    @api
    listItem;

    @api
    showLocatorIcon = false;

    get showLocatorIconForCanvasElements() {
        return this.showLocatorIcon && this.listItem.isCanvasElement;
    }

    get labels() {
        return LABELS;
    }

    /**
     * Dispatches the LocatorIconClickedEvent that highlights the element on canvas
     *
     * @param {object} event onclick event
     */
    handleUsageSectionLocatorClick(event) {
        const guid = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.guid;
        const locatorIconEvent = new LocatorIconClickedEvent(guid);
        this.dispatchEvent(locatorIconEvent);
        logInteraction(`find-in-canvas-button`, 'resource-details', null, 'click');
    }
}
