// @ts-nocheck
import { LightningElement, api } from 'lwc';
import { getStyleFromGeometry } from 'builder_platform_interaction/alcComponentsUtils';
import { SelectMenuItemEvent } from 'builder_platform_interaction/alcEvents';

export default class Menu extends LightningElement {
    @api top;
    @api left;
    @api items;

    get style() {
        return getStyleFromGeometry({ y: this.top + 10, x: this.left });
    }

    handleSelectItem(event) {
        this.dispatchEvent(new SelectMenuItemEvent({ value: event.detail.value }));
    }
}
