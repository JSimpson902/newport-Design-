import { LightningElement, api } from 'lwc';

export default class FlcConnectorMenu extends LightningElement {
    @api
    childIndex;

    @api
    elementsMetadata;

    @api
    next;

    @api
    parent;

    @api
    prev;

    @api
    isPasteAvailable;
}
