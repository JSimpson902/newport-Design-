const eventName = 'updatenode';

export class UpdateNodeEvent extends CustomEvent<any> {
    constructor(node) {
        super(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true,
            detail: {
                node
            }
        });
    }

    static EVENT_NAME = eventName;
}
