// @ts-nocheck
import { api, LightningElement } from 'lwc';

export default class UsedByContent extends LightningElement {
    @api listSectionHeader;
    @api listSectionItems;
    @api isResourceDetails = false;
    @api showLocatorIcon;

    get enableLocator() {
        return this.showLocatorIcon && this.isResourceDetails;
    }
}
