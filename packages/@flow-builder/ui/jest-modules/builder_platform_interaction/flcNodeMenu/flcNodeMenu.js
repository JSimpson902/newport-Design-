import { LightningElement, api } from 'lwc';

export default class FlcNodeMenu extends LightningElement {
    @api
    conditionOptions;

    @api
    elementMetadata;

    @api
    guid;

    @api
    elementHasFault;
}
