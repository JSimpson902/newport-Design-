import { LightningElement, api } from 'lwc';
import { classSet } from 'lightning/utils';
import { LABELS } from './leftPanelResourcesLabels';
import { loggingUtils } from 'builder_platform_interaction/sharedUtils';
import { ShowResourceDetailsEvent } from 'builder_platform_interaction/events';
import { time } from 'instrumentation/service';

const { logPerfTransactionStart, logPerfTransactionEnd, initMetricsTracker, writeMetrics, LEFT_PANEL_RESOURCES } =
    loggingUtils;
export default class LeftPanelResources extends LightningElement {
    loadLeftPanelStartTime;
    isFirstTimeCalled = true;
    private elementToFocus: HTMLElement | undefined;

    @api
    canvasElements = [];

    _nonCanvasElements = [];

    @api
    get nonCanvasElements() {
        return this._nonCanvasElements;
    }

    set nonCanvasElements(newVal) {
        this._nonCanvasElements = newVal;
    }

    @api focus() {
        this.elementToFocus?.focus();
    }

    handleActiveCell(event) {
        this.elementToFocus = event.detail.cell;
    }

    constructor() {
        super();

        // @ts-ignore
        logPerfTransactionStart(LEFT_PANEL_RESOURCES);
        initMetricsTracker();
        this.loadLeftPanelStartTime = time();
    }
    get labels() {
        return LABELS;
    }

    get showNonCanvasElementsLabel() {
        return this.nonCanvasElements.length > 0;
    }

    get showCanvasElementsLabel() {
        return this.canvasElements.length > 0;
    }

    /**
     * Add specific padding class for elements section header
     * depending on resources section header existence
     */
    get computedCanvasElementsSectionTitleClass() {
        return classSet('slds-text-title_caps slds-p-left_small').add({
            'slds-p-vertical_small': this.showNonCanvasElementsLabel,
            'slds-p-bottom_small': !this.showNonCanvasElementsLabel
        });
    }

    /**
     * Force renders the components
     */
    forceRender() {
        const nonCanvasElements = this.nonCanvasElements || [];
        // clone the array to force a render cycle
        this._nonCanvasElements = [...nonCanvasElements];
    }

    // TODO: W-10146473 [Trust] use decorator to reduce duplicate code for logging
    renderedCallback() {
        if (this.isFirstTimeCalled) {
            // @ts-ignore
            logPerfTransactionEnd(LEFT_PANEL_RESOURCES, {
                canvasElementsCount: this.canvasElements.length,
                nonCanvasElementsCount: this.nonCanvasElements.length
            });
            writeMetrics(LEFT_PANEL_RESOURCES, time() - this.loadLeftPanelStartTime, false, {});
            this.isFirstTimeCalled = false;
        }
    }

    handleNonCanvasElementChevronClicked(event) {
        const showResourceDetailsEvent = new ShowResourceDetailsEvent(event.detail.elementGUID, false);
        this.dispatchEvent(showResourceDetailsEvent);
    }

    handleCanvasElementChevronClicked(event) {
        const showResourceDetailsEvent = new ShowResourceDetailsEvent(event.detail.elementGUID, true);
        this.dispatchEvent(showResourceDetailsEvent);
    }
}
