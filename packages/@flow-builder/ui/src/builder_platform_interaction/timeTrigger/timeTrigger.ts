import { LightningElement, api } from 'lwc';
import { LABELS } from './timeTriggerLabels';
import { getEntity, fetchFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { PropertyChangedEvent } from 'builder_platform_interaction/events';
import { TIME_OPTION } from 'builder_platform_interaction/flowMetadata';
import { FLOW_TRIGGER_SAVE_TYPE, RECORD_TIGGER_EVENT } from 'builder_platform_interaction/flowMetadata';
import { getValueFromHydratedItem } from 'builder_platform_interaction/dataMutationLib';
import { format } from 'builder_platform_interaction/commonUtils';

export default class TimeTrigger extends LightningElement {
    @api timeTrigger;
    @api object;
    @api recordTriggerType;

    labels = LABELS;
    timeSourceOptions: { label: string; value: string }[] = [];

    TIME_OPTIONS: { label: string; value: string }[] = [
        {
            label: this.labels.timeOptionDaysAfterLabel,
            value: TIME_OPTION.DAYS_AFTER
        },
        {
            label: this.labels.timeOptionDaysBeforeLabel,
            value: TIME_OPTION.DAYS_BEFORE
        },
        {
            label: this.labels.timeOptionHoursAfterLabel,
            value: TIME_OPTION.HOURS_AFTER
        },
        {
            label: this.labels.timeOptionHoursBeforeLabel,
            value: TIME_OPTION.HOURS_BEFORE
        }
    ];

    RECORD_TRIGGER_EVENT_LABEL_LOOKUP = {
        [FLOW_TRIGGER_SAVE_TYPE.CREATE]: this.labels.startElementRecordCreated,
        [FLOW_TRIGGER_SAVE_TYPE.UPDATE]: this.labels.startElementRecordUpdated,
        [FLOW_TRIGGER_SAVE_TYPE.DELETE]: this.labels.startElementRecordDeleted,
        [FLOW_TRIGGER_SAVE_TYPE.CREATE_AND_UPDATE]: this.labels.startElementRecordCreatedUpdated
    };

    get timeSourceValue() {
        return getValueFromHydratedItem(this.timeTrigger.timeSource);
    }

    get offsetNumberValue() {
        return getValueFromHydratedItem(this.timeTrigger.offsetNumber);
    }

    get offsetUnitValue() {
        return getValueFromHydratedItem(this.timeTrigger.offsetUnit);
    }

    get timeSourceComboboxOptions() {
        return this.timeSourceOptions;
    }

    connectedCallback() {
        this.updateTimeSourceOptions();
    }

    /**
     * Retrives the dropdown menu options for the time source combobox
     */
    updateTimeSourceOptions() {
        const eventDateOptions: { label: string; value: string }[] = [];
        if (this.object && this.object.value) {
            const entity = getEntity(getValueFromHydratedItem(this.object));
            eventDateOptions.push({
                label: format(
                    this.RECORD_TRIGGER_EVENT_LABEL_LOOKUP[getValueFromHydratedItem(this.recordTriggerType)],
                    entity.apiName
                ),
                value: RECORD_TIGGER_EVENT
            });
            fetchFieldsForEntity(entity.apiName)
                .then((fields) => {
                    Object.keys(fields).forEach((key) => {
                        if (fields[key].dataType === 'DateTime') {
                            eventDateOptions.push({
                                label: `${entity.apiName}: ${fields[key].label}`,
                                value: fields[key].apiName
                            });
                        }
                    });
                    this.timeSourceOptions = eventDateOptions;
                })
                .catch((errorMessage) => {
                    throw new Error('error: ' + errorMessage);
                });
        }
        return [];
    }

    handlePropertyChanged(event) {
        event.detail.guid = this.timeTrigger.guid;
    }

    /**
     * Handles the event for time source value change.
     * Fires the propertyChangedEvent to be handled by the parent.
     */
    handleTimeSourceValueChanged(event) {
        const propertyChangedEvent = new PropertyChangedEvent(
            'timeSource',
            event.detail.value,
            null,
            this.timeTrigger.guid
        );
        this.dispatchEvent(propertyChangedEvent);
    }

    /**
     * Handles the event for off set number focus out.
     * Fires the propertyChangedEvent to be handled by the parent.
     */
    handleOffsetNumberChanged(event) {
        const propertyChangedEvent = new PropertyChangedEvent(
            'offsetNumber',
            event.target.value,
            null,
            this.timeTrigger.guid
        );
        this.dispatchEvent(propertyChangedEvent);
    }

    /**
     * Handles the event for time offset unit change.
     * Fires the propertyChangedEvent to be handled by the parent.
     */
    handleoffsetUnitValueChanged(event) {
        const propertyChangedEvent = new PropertyChangedEvent(
            'offsetUnit',
            event.detail.value,
            null,
            this.timeTrigger.guid
        );
        this.dispatchEvent(propertyChangedEvent);
    }
}
