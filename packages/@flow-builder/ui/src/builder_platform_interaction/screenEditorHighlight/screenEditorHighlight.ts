// @ts-nocheck
import { LightningElement, api } from 'lwc';
import { createScreenElementSelectedEvent, createScreenElementDeletedEvent } from 'builder_platform_interaction/events';
import { LABELS } from 'builder_platform_interaction/screenEditorI18nUtils';
import {
    SELECTED_CLASS,
    HOVERING_CLASS,
    DRAGGING_CLASS,
    CONTAINER_DIV_SELECTOR,
    booleanAttributeValue,
    setDragFieldValue
} from 'builder_platform_interaction/screenEditorUtils';

/*
 * Selection frame with a header and support for deleting components
 */
export default class ScreenEditorHighlight extends LightningElement {
    @api screenElement;
    @api highlighIcon;
    @api property;
    @api preventEvents = false;
    @api displayIcons = false;
    @api draggable = false;
    @api selected = false;
    hovering = false;

    labels = LABELS;

    get classList() {
        return (
            'highlight slds-is-relative ' +
            (booleanAttributeValue(this, 'selected') ? SELECTED_CLASS : '') +
            ' ' +
            (booleanAttributeValue(this, 'hovering') ? HOVERING_CLASS : '')
        );
    }

    get isElementHasVisiblitityConditions() {
        return (
            this.screenElement.visibilityRule &&
            this.screenElement.visibilityRule.conditions &&
            this.screenElement.visibilityRule.conditions.length > 0
        );
    }

    get isElementHasVisiblitityConditionsAndIsNotSelected() {
        return !this.selected && this.isElementHasVisiblitityConditions;
    }

    get isDraggable() {
        return booleanAttributeValue(this, 'draggable');
    }

    get shouldPreventEvents() {
        return booleanAttributeValue(this, 'preventEvents');
    }

    get shouldDisplayIcons() {
        return booleanAttributeValue(this, 'displayIcons');
    }

    connectedCallback() {
        this.highlightIcon =
            (this.screenElement && this.screenElement.type && this.screenElement.type.icon) || 'utility:connected_apps';
    }

    handleSelected = (event) => {
        event.stopPropagation();

        if (!this.selected) {
            this.dispatchEvent(createScreenElementSelectedEvent(this.screenElement, this.property));
        }
    };

    handleDelete = (event) => {
        event.stopPropagation();
        this.dispatchEvent(createScreenElementDeletedEvent(this.screenElement, this.property));
    };

    handleMouseOver = (event) => {
        event.stopPropagation();
        this.hovering = true;
    };

    handleMouseOut = (event) => {
        event.stopPropagation();
        this.hovering = false;
    };

    handleDragStart(event) {
        event.stopPropagation();
        this.template.querySelector(CONTAINER_DIV_SELECTOR).classList.add(DRAGGING_CLASS);
        event.dataTransfer.effectAllowed = 'move';
        // Cannot use a different attribute here because only 'text' works in IE
        event.dataTransfer.setData('text', this.screenElement.guid);
        setDragFieldValue(this.screenElement.fieldType);
    }

    handleDragEnd(/* event */) {
        this.template.querySelector(CONTAINER_DIV_SELECTOR).classList.remove(DRAGGING_CLASS);
    }
}
