import { Element, api } from 'engine';
import { createScreenElementSelectedEvent, createScreenElementDeletedEvent } from 'builder_platform_interaction-events';
import { LABELS } from 'builder_platform_interaction-screen-editor-i18n-utils';
import { SELECTED_CLASS, DRAGGING_CLASS, CONTAINER_DIV_SELECTOR, booleanAttributeValue} from 'builder_platform_interaction-screen-editor-utils';

/*
 * Selection frame with a header and support for deleting components
 */
export default class ScreenEditorHighlight extends Element {
    @api screenElement;
    @api property;
    @api preventEvents = false;
    @api displayMoveIcon = false;
    @api draggable = false;
    @api title;
    @api tabIndex = 0;
    @api selected = false;

    labels = LABELS;

    get classList() {
        return 'highlight slds-is-relative ' + (booleanAttributeValue(this, 'selected') ? SELECTED_CLASS : '');
    }

    get isDraggable() {
        return typeof this.draggable === 'string' ? this.draggable.toLowerCase() === 'true' : this.draggable;
    }

    get shouldPreventEvents() {
        return typeof this.preventEvents === 'string' ? this.preventEvents.toLowerCase() === 'true' : this.preventEvents;
    }

    get shouldDisplayMoveIcon() {
        return typeof this.displayMoveIcon === 'string' ? this.displayMoveIcon.toLowerCase() === 'true' : this.displayMoveIcon;
    }

    handleSelected = (event) => {
        event.stopPropagation();

        if (!this.selected) {
            this.dispatchEvent(createScreenElementSelectedEvent(this.screenElement, this.property));
        }
    }

    handleDelete = (event) => {
        event.stopPropagation();
        this.dispatchEvent(createScreenElementDeletedEvent(this.screenElement, this.property));
    }

    handleDragStart(event) {
        this.template.querySelector(CONTAINER_DIV_SELECTOR).classList.add(DRAGGING_CLASS);
        event.dataTransfer.effectAllowed = 'move';
        // Cannot use a different attribute here because only 'text' works in IE
        event.dataTransfer.setData('text', this.screenElement.guid);
    }

    handleDragEnd(/* event */) {
        this.template.querySelector(CONTAINER_DIV_SELECTOR).classList.remove(DRAGGING_CLASS);
    }
}
