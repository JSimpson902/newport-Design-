const eventName = 'togglemenu';
export class ToggleMenuEvent extends CustomEvent<any> {
    constructor(detail) {
        super(eventName, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail
        });
    }

    static EVENT_NAME = eventName;
}
