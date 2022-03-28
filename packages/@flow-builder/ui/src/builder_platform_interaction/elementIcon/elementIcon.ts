// @ts-nocheck
import { ICON_SHAPE } from 'builder_platform_interaction/elementConfig';
import { api, LightningElement } from 'lwc';

export default class ElementIcon extends LightningElement {
    @api
    iconName;
    @api
    iconSize;
    @api
    iconSrc;
    @api
    iconShape;
    @api
    isCanvasElementIcon = false;
    @api
    isDraggable = false;
    @api
    title = '';
    @api
    alternativeText = '';
    @api
    backgroundColor = '';

    @api
    get iconElement() {
        return this.template.querySelector('.drag-element');
    }

    updateClassesForNonCanvasElements(baseClasses, commonClasses) {
        if (!this.isCanvasElementIcon) {
            const updatedBaseClasses = `${baseClasses} ${commonClasses}`;
            return this.updateClassesForDraggableElements(updatedBaseClasses);
        }
        return baseClasses;
    }

    updateClassesForDraggableElements(baseClasses) {
        if (this.isDraggable) {
            return `${baseClasses} drag-element`;
        }
        return baseClasses;
    }

    get iconVariant() {
        return this.iconName === 'utility:right' ? 'inverse' : '';
    }

    get containerClass() {
        if (this.iconName === 'standard:decision') {
            const baseClasses = 'rotate-icon-container slds-icon-standard-decision';
            const commonClasses = 'non-canvas-decision-icon slds-m-right_x-small';
            return this.updateClassesForNonCanvasElements(baseClasses, commonClasses);
        }
        return '';
    }

    get svgClass() {
        let commonClasses;
        if (this.iconName === 'standard:decision') {
            commonClasses = 'rotate-icon-svg';
        } else {
            commonClasses = this.updateClassesForNonCanvasElements(this.backgroundColor, 'slds-m-right_x-small');

            if (this.iconShape === ICON_SHAPE.CIRCLE) {
                commonClasses = `${commonClasses} slds-icon__container_circle`;
            }
        }
        if (this.iconSrc) {
            commonClasses = `${commonClasses} custom-icon`;
        }

        return commonClasses;
    }
}
