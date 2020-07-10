// @ts-nocheck
import { LightningElement, api, track } from 'lwc';

import { modalFooterVariant } from 'builder_platform_interaction/builderUtils';

export default class ModalFooter extends LightningElement {
    @api buttons;
    @api closeModalCallback;
    @api keyMap;
    @api footerVariant;
    _buttonOneClass;
    _buttonTwoClass;

    @track state = {
        buttonOneDisabled: false,
        buttonTwoDisabled: false
    };

    @api
    get buttonOneClass() {
        return this.footerVariant === modalFooterVariant.PROMPT ? '' : this.assignButtonClass(this._buttonOneClass);
    }

    set buttonOneClass(value) {
        this._buttonOneClass = value;
    }

    @api
    get buttonTwoClass() {
        return this.assignButtonClass(this._buttonTwoClass);
    }

    set buttonTwoClass(value) {
        this._buttonTwoClass = value;
    }

    assignButtonClass(buttonClass) {
        return buttonClass ? buttonClass : 'slds-m-left_x-small slds-float_right';
    }

    closeModal = (closeCallback = true) => {
        if (typeof this.closeModalCallback === 'function' && closeCallback === true) {
            this.closeModalCallback();
        }
    };

    handleButtonOneClick() {
        if (typeof this.buttons.buttonOne.buttonCallback === 'function') {
            this.buttons.buttonOne.buttonCallback();
        }

        this.closeModal(this.buttons.buttonOne.closeCallback);
    }

    handleButtonTwoClick() {
        if (typeof this.buttons.buttonTwo.buttonCallback === 'function') {
            this.buttons.buttonTwo.buttonCallback();
        }

        this.closeModal(this.buttons.buttonTwo.closeCallback);
    }

    @api disableButtons() {
        this.state.buttonOneDisabled = true;
        this.state.buttonTwoDisabled = true;
    }
}
