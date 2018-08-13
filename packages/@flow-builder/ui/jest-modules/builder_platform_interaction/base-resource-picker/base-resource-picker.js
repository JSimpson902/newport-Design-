import { Element, api } from 'engine';

export default class BaseResourcePicker extends Element {
    @api
    comboboxConfig;

    @api
    value;

    @api
    errorMessage;

    @api
    setMenuData(newMenuData) {
        this._fullMenuData = newMenuData;
    }

    @api
    get fullMenuData() {
        return this._fullMenuData;
    }

    static getComboboxConfig() {
        return {};
    }

    @api
    allowedParamTypes;
}