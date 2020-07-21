// @ts-nocheck
import { LightningElement, api } from 'lwc';

export default class FlcFlow extends LightningElement {
    @api
    flow;

    @api
    isPasteAvailable;

    @api
    isSelectionMode;

    @api
    isReconnecting;

    @api
    isCanvasReady;
}
