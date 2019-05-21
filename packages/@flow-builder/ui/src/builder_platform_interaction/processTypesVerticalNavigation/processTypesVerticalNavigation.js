import { LightningElement, api} from 'lwc';
import { ProcessTypeSelectedEvent } from 'builder_platform_interaction/events';
import { ALL_PROCESS_TYPE, getProcessTypesWithIcons, PROCESS_TYPES_ICONS } from 'builder_platform_interaction/processTypeLib';

export default class ProcessTypesVerticalNavigation extends LightningElement {
    /**
     * All unfiltered process types
     * @return {Array} array of all the process types
     */
    @api
    processTypes;

    /**
     * Select(ed) process type name
     * @return {String} select(ed) process type name
     */
    @api
    selectedProcessType = ALL_PROCESS_TYPE.name;

    /**
     * Has some other process types?
     * @return {Boolean} true if other process types exist false otherwise
     */
    get hasOtherProcessTypes() {
        return this.otherProcessTypes && this.otherProcessTypes.length;
    }

    /**
     * @typedef {Object} ProcessTypeWithIcon
     *
     * @property {String} name
     * @property {String} label
     * @property {String} iconName
     */

    /**
     * Get the "featured" process types with their corresponding icon (or default if none found)
     * @return {ProcessTypeWithIcon[]} array of "featured" process types with corresponding icon or default one (fallback) if none foundd
     */
    @api
    get featuredProcessTypes() {
        return getProcessTypesWithIcons(this.processTypes, PROCESS_TYPES_ICONS.FEATURED,
            processType => PROCESS_TYPES_ICONS.FEATURED.has(processType.name),
            filteredProcessTypes => filteredProcessTypes.unshift(ALL_PROCESS_TYPE));
    }

    /**
     * Get the "other" process types with their corresponding icon (or default if none found)
     * @return {ProcessTypeWithIcon[]} array of "other" process types with corresponding icon or default one (fallback) if none foundd
     */
    @api
    get otherProcessTypes() {
        if (!this._otherProcessTypes) {
            this._otherProcessTypes = getProcessTypesWithIcons(this.processTypes, PROCESS_TYPES_ICONS.OTHERS,
            processType => !PROCESS_TYPES_ICONS.FEATURED.has(processType.name));
        }
        return this._otherProcessTypes;
    }

    /**
     * Handler for process type selection
     * @param {Object} event - navigation select event
     * @param {string} event.detail.name - selected process type name
     */
    handleSelectProcessType(event) {
        event.stopPropagation();
        this.dispatchEvent(new ProcessTypeSelectedEvent(event.detail.name));
    }
}