import { UpdateSortCollectionOutputEvent } from 'builder_platform_interaction/events';
import { LIMIT_RANGE, SORT_OUTPUT_OPTION } from 'builder_platform_interaction/sortEditorLib';
import { api, LightningElement, track } from 'lwc';
import { LABELS } from './sortCollectionOutputLabels';

export default class SortCollectionOutput extends LightningElement {
    labels = LABELS;

    @track
    _selectedOutput = SORT_OUTPUT_OPTION.ALL;

    @track
    _limit = {};

    @track
    showMaxNumber = false;

    /**
     * @param value the selected output: all or custom
     */
    set selectedOutput(value: string) {
        this._selectedOutput = value || SORT_OUTPUT_OPTION.ALL;
        this.showMaxNumber = this._selectedOutput === SORT_OUTPUT_OPTION.CUSTOM;
    }

    @api
    get selectedOutput(): string {
        return this._selectedOutput;
    }

    /**
     * @param value the maximum records to be sorted or null if sorting for all records
     */
    set limit(value: object) {
        this._limit = value || {};
    }

    @api get limit(): object {
        return this._limit;
    }

    renderedCallback() {
        const inputSelector = this.template.querySelector('lightning-input');
        if (inputSelector) {
            inputSelector.focus();
        }
    }

    get outputOptions() {
        return [
            {
                label: this.labels.sortOutputAll,
                value: SORT_OUTPUT_OPTION.ALL
            },
            {
                label: this.labels.sortOutputCustom,
                value: SORT_OUTPUT_OPTION.CUSTOM
            }
        ];
    }

    get maxLimit() {
        return LIMIT_RANGE.max;
    }

    /**
     * handle sort output radio changed
     *
     * @param event the radio changed event
     */
    handleSortOutputChanged(event: CustomEvent) {
        event.stopPropagation();
        this.showMaxNumber = event.detail.value === SORT_OUTPUT_OPTION.CUSTOM;
        // dispatch event
        this.dispatchEvent(new UpdateSortCollectionOutputEvent(event.detail.value, null, event.detail.error));
    }

    /**
     * handle limit changed
     *
     * @param event input changed event
     */
    handleMaxNumberChanged(event: CustomEvent) {
        event.stopPropagation();
        // dispatch event
        this.dispatchEvent(
            new UpdateSortCollectionOutputEvent(SORT_OUTPUT_OPTION.CUSTOM, event.detail.value, event.detail.error)
        );
    }
}
