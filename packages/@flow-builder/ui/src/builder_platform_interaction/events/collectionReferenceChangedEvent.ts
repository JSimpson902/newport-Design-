const eventName = 'collectionreferencechanged';

export class CollectionReferenceChangedEvent extends CustomEvent<any> {
    constructor(value: string | null, error: string | null) {
        super(eventName, {
            cancelable: false,
            composed: true,
            bubbles: true,
            detail: {
                value,
                error
            }
        });
    }

    static EVENT_NAME = eventName;
}
