// @ts-nocheck
import { api, LightningElement } from 'lwc';

export default class OutputResourcePicker extends LightningElement {
    @api propertyEditorElementType;

    @api value;

    @api comboboxConfig;

    @api elementParam;

    @api errorMessage;

    @api rowIndex;

    @api isPillSupported;
}
