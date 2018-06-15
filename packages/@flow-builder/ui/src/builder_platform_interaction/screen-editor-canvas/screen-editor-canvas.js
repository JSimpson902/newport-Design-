import { Element, api } from 'engine';
import { CANVAS_SCREEN_GUIDS } from 'builder_platform_interaction-screen-editor-utils';
import { LABELS } from 'builder_platform_interaction-screen-editor-i18n-utils';
import { ReorderListEvent, createScreenElementDeselectedEvent } from 'builder_platform_interaction-events';
const DRAGGING_REGION_SELECTOR = '.screen-editor-canvas-dragging-region';
const INSERTION_LINE_SELECTOR = '.screen-editor-canvas-insertion-line';

/*
 * The screen editor canvas, support for adding, deleting, editing and rearranging fields (incomplete)
 */
export default class ScreenEditorCanvas extends Element {
    @api screen;
    @api tabIndex = 0;
    @api selectedItemGuid;

    labels = LABELS;

    get hasHelpText() {
        return this.screen.helpText && this.screen.helpText.value;
    }

    get headerSelected() {
        return this.selectedItemGuid === CANVAS_SCREEN_GUIDS.HEADER_GUID;
    }

    get footerSelected() {
        return this.selectedItemGuid === CANVAS_SCREEN_GUIDS.FOOTER_GUID;
    }

    get fields() {
        if (this.screen) {
            return this.screen.fields.map((field) => {
                return {
                    field,
                    selected: (this.selectedItemGuid === field.guid)
                };
            });
        }

        return [];
    }

    handleOnClick = (/* event */) => {
        const selected = this.getSelectedElement();
        this.dispatchEvent(createScreenElementDeselectedEvent(selected));
        event.stopPropagation();
    }

    handleDrop(event) {
        this.handleDragEnd();

        const range = this.getDraggingRange(event);
        const sourceGuid = event.dataTransfer.getData('text');

        const destGuid = range.index === 0 ? this.screen.fields[range.index].guid : this.screen.fields[range.index - 1].guid;
        if (sourceGuid) {
            this.fireReorder(sourceGuid, destGuid);
            this.clearDraggingState();
        }
    }

    handleDragEnter(event) {
        this.template.querySelector(DRAGGING_REGION_SELECTOR).classList.remove('slds-hide');
        event.preventDefault();
    }

    handleDragEnd(/* event */) {
        this.template.querySelector(DRAGGING_REGION_SELECTOR).classList.add('slds-hide');
        this.template.querySelector(INSERTION_LINE_SELECTOR).style.top = '0';
    }

    handleDragOver(event) {
        const range = this.getDraggingRange(event);
        if (range) {
            if (!this.top) {
                this.top = this.template.querySelector(DRAGGING_REGION_SELECTOR).getBoundingClientRect().top;
            }

            this.template.querySelector(INSERTION_LINE_SELECTOR).style.top = (range.top - this.top) + 'px';
        }
        event.preventDefault();
    }

    getDraggingRange(event) {
        if (!this.ranges) {
            this.ranges = [];
            let idx = 0;

            // iterate over all screen fields and get their vertical coordinates.
            for (const highlight of this.template.querySelector('div.screen-editor-canvas-body').querySelectorAll('builder_platform_interaction-screen-editor-highlight')) {
                const rect = highlight.getBoundingClientRect();
                this.ranges.push({
                    top: rect.top,
                    bottom: rect.bottom,
                    middle: rect.top + ((rect.bottom - rect.top) / 2),
                    index: idx
                });
                idx++;
            }

            // Add a range element to represent the very bottom spot.
            this.ranges.push({
                top: idx > 0 ? this.ranges[idx - 1].bottom + 1 : 0,
                bottom: this.top + 2,
                middle: this.top + 1,
                index: idx
            });
        }

        // Figure out which screen field's corresponding range is associated with this event.
        for (let i = 0, length = this.ranges.length; i < length; i++) {
            const range = this.ranges[i];
            if (event.y >= range.top && event.y <= range.bottom) {
                return (i < length - 1 && event.y >= range.middle) ? this.ranges[i + 1] : range;
            } else if ((i === 0 && event.y < range.top) || (i === length - 1 && event.y > range.top)) {
                return range;
            }
        }

        return null;
    }

    handleScroll()  {
        this.clearDraggingState();
    }

    clearDraggingState() {
        delete this.ranges; // Force recalculate bounding client rects for the new scroll position
        delete this.top;
    }

    getSelectedElement() {
        for (const highlight of this.template.querySelectorAll('builder_platform_interaction-screen-editor-highlight')) {
            if (highlight.selected) {
                return highlight;
            }
        }

        return null;
    }

    fireReorder(sourceIndex, destIndex) {
        if (sourceIndex !== destIndex) {
            const reorderListEvent = new ReorderListEvent(sourceIndex, destIndex);
            this.dispatchEvent(reorderListEvent);
        }
    }
}