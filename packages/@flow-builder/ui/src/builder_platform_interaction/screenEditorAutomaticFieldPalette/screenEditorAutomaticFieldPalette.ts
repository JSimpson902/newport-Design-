import { LightningElement, track, api } from 'lwc';
import { SOBJECT_OR_SOBJECT_COLLECTION_FILTER } from 'builder_platform_interaction/filterTypeLib';
import { getElementByGuid } from 'builder_platform_interaction/storeUtils';
import { fetchFieldsForEntity } from 'builder_platform_interaction/sobjectLib';
import { generateGuid } from 'builder_platform_interaction/storeLib';
import { format } from 'builder_platform_interaction/commonUtils';
import { LABELS } from './screenEditorAutomaticFieldPaletteLabels';
import { containsMatcher } from 'builder_platform_interaction/filterLib';
import { FLOW_DATA_TYPE, getDataTypeIcons } from 'builder_platform_interaction/dataTypeLib';
import { createAddAutomaticScreenFieldEvent, SObjectReferenceChangedEvent } from 'builder_platform_interaction/events';
import {
    getFieldByGuid,
    getScreenFieldName,
    SCREEN_EDITOR_GUIDS,
    setDragFieldValue
} from 'builder_platform_interaction/screenEditorUtils';

const SUPPORTED_DATATYPES = [
    FLOW_DATA_TYPE.STRING.value,
    FLOW_DATA_TYPE.NUMBER.value,
    FLOW_DATA_TYPE.DATE_TIME.value,
    FLOW_DATA_TYPE.DATE.value,
    FLOW_DATA_TYPE.BOOLEAN.value
];

export default class ScreenEditorAutomaticFieldPalette extends LightningElement {
    sobjectCollectionCriterion = SOBJECT_OR_SOBJECT_COLLECTION_FILTER.SOBJECT;
    showNoItemsIllustration = true;
    sobjectPickerErrorMessage?: String | null;
    entityName = '';
    showErrorMessageRelatedToFieldFetching = false;
    labels = LABELS;
    @api
    searchPattern?: string | null;

    @track
    state: { recordVariable: string; entityFields: any } = {
        recordVariable: '',
        entityFields: {}
    };

    get sObjectPickerRowIndex(): String {
        return generateGuid();
    }

    get searchInputPlaceholder(): String {
        return format(LABELS.filterFieldsPlaceHolderLabel, this.entityName);
    }

    @api
    paletteData: ScreenPaletteSection[] = [];

    @api
    get showNoItemIllustrationContainer() {
        return this.showNoItemsIllustration;
    }

    @api
    get recordVariable() {
        return this.state.recordVariable;
    }

    @api
    get entityFields() {
        return this.state.entityFields;
    }

    /**
     * Handler for "SObjectReference" element property changes
     * @param {object} event
     */
    handleSObjectReferenceChangedEvent(event: SObjectReferenceChangedEvent) {
        event.stopPropagation();
        if (this.state.recordVariable !== event.detail.value) {
            this.searchPattern = null;
            this.state.recordVariable = event.detail.value;
            this.sobjectPickerErrorMessage = event.detail.error;
            if (this.state.recordVariable !== '' && this.sobjectPickerErrorMessage == null) {
                this.updateFields();
                this.showNoItemsIllustration = false;
            } else {
                this.showNoItemsIllustration = true;
            }
        }
    }

    /**
     * Get the fields of the selected entity and set the state accordingly
     */
    updateFields() {
        this.state.entityFields = {};
        if (this.state.recordVariable) {
            const resource = getElementByGuid(this.state.recordVariable)!;
            this.entityName = resource.subtype!;
            fetchFieldsForEntity(this.entityName)
                .then((fields) => {
                    this.state.entityFields = fields;
                    this.showErrorMessageRelatedToFieldFetching = false;
                    this.buildModel();
                })
                .catch(() => {
                    this.showErrorMessageRelatedToFieldFetching = true;
                });
        }
    }

    /**
     * Populate section/items data for inner palette component
     */
    buildModel(fieldNamePattern?: String | null) {
        const sections: ScreenPaletteSection[] = [];
        const requiredSection: ScreenPaletteSection = {
            guid: generateGuid(),
            label: LABELS.paletteSectionRequiredFieldsLabel,
            _children: []
        };
        const optionalSection: ScreenPaletteSection = {
            guid: generateGuid(),
            label: LABELS.paletteSectionOptionalFieldsLabel,
            _children: []
        };
        const fieldsArray: Array<FieldDefinition> = Object.values(this.state.entityFields);
        fieldsArray
            .filter(
                (field) =>
                    (field.editable || field.creatable) &&
                    SUPPORTED_DATATYPES.includes(field.dataType) &&
                    field.relationshipName == null &&
                    (fieldNamePattern && fieldNamePattern.trim().length > 0
                        ? containsMatcher(field, 'label', fieldNamePattern.trim())
                        : true)
            )
            .forEach((field) => {
                const guid = generateGuid();
                const item: ScreenAutomaticFieldPaletteItem = {
                    apiName: field.apiName,
                    description: field.label,
                    guid,
                    iconName: getDataTypeIcons(field.dataType, 'utility'),
                    label: field.label,
                    fieldTypeName: getScreenFieldName(field)!,
                    objectFieldReference: this.recordVariable + '.' + field.apiName
                };
                if (field.required) {
                    requiredSection._children.push(item);
                } else {
                    optionalSection._children.push(item);
                }
            });
        this.pushSectionIfNotEmpty(sections, requiredSection);
        this.pushSectionIfNotEmpty(sections, optionalSection);
        this.paletteData = sections;
    }

    /**
     * Add a section to an array of palette section if the section is not empty
     * @param {ScreenPaletteSection[]} sectionArray array of section to push into
     * @param {ScreenPaletteSection} paletteSection palette section to add
     */
    pushSectionIfNotEmpty(sectionArray: ScreenPaletteSection[], paletteSection: ScreenPaletteSection) {
        if (paletteSection._children.length > 0) {
            sectionArray.push(paletteSection);
        }
    }

    /**
     * Rebuild palette data when a new search term is given as input
     */
    handleSearch(event) {
        const filterValue = event.target.value;
        this.searchPattern = filterValue ? filterValue : null;
        this.buildModel(this.searchPattern);
    }

    /**
     * Show no item illustration when SObject picker is cleared with pill (X) click
     */
    handlePillRemoved(event) {
        event.stopPropagation();
        this.state.recordVariable = '';
        this.showNoItemsIllustration = true;
    }

    handlePaletteItemClickedEvent = (event) => {
        // Clicking on an element from the palette should add the corresponding field
        // type to the canvas.
        const fieldGuid = event.detail.guid;
        const field = getFieldByGuid(this.paletteData, fieldGuid) as ScreenAutomaticFieldPaletteItem;
        const addFieldEvent = createAddAutomaticScreenFieldEvent(field.fieldTypeName, field.objectFieldReference);
        this.dispatchEvent(addFieldEvent);
        event.stopPropagation();
    };

    handleDragStart(event) {
        // Dragging an element could mean user wants to add the corresponding
        // field type to the canvas. Figure out which field type user wants
        // to add.
        const { key: fieldGuid } = JSON.parse(event.dataTransfer.getData('text'));
        const field = getFieldByGuid(this.paletteData, fieldGuid) as ScreenAutomaticFieldPaletteItem;
        const fieldTypeName = field.fieldTypeName;
        event.dataTransfer.setData(
            'text',
            JSON.stringify({ fieldTypeName, objectFieldReference: field.objectFieldReference })
        );
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('dragStartLocation', SCREEN_EDITOR_GUIDS.PALETTE); // Needed for safari browser. effectAllowed always resolves to 'all' and it is not supported by safari.
        setDragFieldValue(fieldTypeName);
    }
}
