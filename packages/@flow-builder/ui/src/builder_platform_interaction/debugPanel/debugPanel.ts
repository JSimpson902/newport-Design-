// @ts-nocheck
import { LightningElement, api } from 'lwc';
import { LABELS } from './debugPanelLabels';
import { copyAndUpdateDebugTraceObject } from 'builder_platform_interaction/debugUtils';

/**
 * This is the debug panel that shows the debug run info on builder canvas (debugMode)
 *
 * - Mutate debug trace so that there's a title & body per debug accordion
 * - Add time (start time, finish time, duration)
 * - Show error if debug run fails
 */

export default class DebugPanel extends LightningElement {
    @api ifBlockResume;

    TRANSACTION_ENTRY = 'TransactionInfoEntry';
    // initial component rendering always blocks transaction boundaries
    blockedEntries = [this.TRANSACTION_ENTRY];
    _debugData;
    debugTracesFull = [];
    debugTraces = [];
    debugTraceCopy = [];

    /* this is the error message for a failed debug run, not per flow element errors */
    errorMessage = '';
    headerTitle = LABELS.debugInspector;
    showGovLim = false;
    comboboxPlaceholderText = LABELS.basicFilter;

    filterOptions = [
        {
            label: LABELS.basicFilter,
            isSelected: true,
            isDefault: true
        },
        {
            label: LABELS.govLimFilter,
            isSelected: false,
            isDefault: false
        },
        {
            label: LABELS.transactionFilter,
            isSelected: false,
            isDefault: false
        }
    ];

    handleCustomFilter(event) {
        this.filterOptions = Object.assign([], event.detail.selection);
        for (let i = 0; i < this.filterOptions.length; i++) {
            const option = this.filterOptions[i];
            if (option.label === LABELS.govLimFilter) {
                this.showGovLim = option.isSelected;
            }
            if (option.label === LABELS.transactionFilter) {
                if (option.isSelected) {
                    this.blockedEntries = this.blockedEntries.filter((e) => e === !this.TRANSACTION_ENTRY);
                } else {
                    this.blockedEntries.push(this.TRANSACTION_ENTRY);
                }
            }
        }
        this.removeBlockedEntries();
    }

    handleDefaultFilter() {
        this.showGovLim = false;
        this.blockedEntries.push(this.TRANSACTION_ENTRY);
        this.removeBlockedEntries();
    }

    get hasErrors() {
        return this.debugData && this.debugData.error && !!this.debugData.error[0];
    }

    get allTitles() {
        if (this.debugTraces) {
            return this.debugTraces.map((e) => e.title);
        }
        return [];
    }

    @api
    get debugData() {
        return this._debugData;
    }

    set debugData(value) {
        this._debugData = value;
        this.updateProperties(this._debugData);
    }

    updateProperties(data) {
        this.debugTracesFull = [];
        if (!this.hasErrors && data && data.debugTrace) {
            const traces = copyAndUpdateDebugTraceObject(data);
            this.debugTracesFull = traces.debugTraces;
            this.debugTraceCopy = traces.copyTraces;
            this.removeBlockedEntries();
        } else if (this.hasErrors) {
            this.debugTraces = this.debugTraceCopy;
            this.errorMessage = data.error;
        }
    }

    removeBlockedEntries() {
        if (this.blockedEntries.length === 0) {
            this.debugTraces = this.debugTracesFull;
        }
        this.debugTraces = this.debugTracesFull.filter((e) => !this.blockedEntries.includes(e.entryType));
    }
}
