import { ICON_SHAPE } from 'builder_platform_interaction/alcComponentsUtils';
import type { ElementMetadata } from 'builder_platform_interaction/autoLayoutCanvas';
import { NodeType } from 'builder_platform_interaction/autoLayoutCanvas';
import { commonUtils, storeUtils } from 'builder_platform_interaction/sharedUtils';
import { LABELS } from './alcConnectorMenuLabels';

const { generateGuid } = storeUtils;
const { format, memoize } = commonUtils;

export const PASTE_ACTION = 'Paste';
export const GOTO_ACTION = 'goTo';
export const GOTO_REROUTE_ACTION = 'goToReroute';
export const GOTO_DELETE_ACTION = 'goToDelete';

const actionSection: MenuSection = {
    guid: generateGuid(),
    heading: '',
    items: [],
    label: LABELS.actionSectionLabel,
    separator: true
};

const pasteActionItem: MenuItem = {
    guid: generateGuid(),
    icon: 'utility:paste',
    iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
    iconClass: '',
    iconSize: 'x-small',
    iconVariant: '',
    label: '',
    elementType: PASTE_ACTION,
    rowClass: 'slds-listbox__item action-row-line-height'
};

const addGoToActionItem: MenuItem = {
    guid: generateGuid(),
    icon: 'utility:level_down',
    iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
    iconClass: '',
    iconSize: 'x-small',
    iconVariant: '',
    label: LABELS.goToPathItemLabel,
    elementType: GOTO_ACTION,
    rowClass: 'slds-listbox__item action-row-line-height'
};

const rerouteGoToActionItem: MenuItem = {
    guid: generateGuid(),
    icon: 'utility:level_down',
    iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
    iconClass: '',
    iconSize: 'x-small',
    iconVariant: '',
    label: LABELS.reRouteGoToPathItemLabel,
    elementType: GOTO_REROUTE_ACTION,
    rowClass: 'slds-listbox__item action-row-line-height'
};

const deleteGoToActionItem: MenuItem = {
    guid: generateGuid(),
    icon: 'utility:delete',
    iconContainerClass: 'slds-media__figure slds-listbox__option-icon',
    iconClass: '',
    iconSize: 'x-small',
    iconVariant: '',
    label: LABELS.deleteGoToPathItemLabel,
    elementType: GOTO_DELETE_ACTION,
    rowClass: 'slds-listbox__item action-row-line-height'
};

/**
 * Create ALC menu configuration from the elements metadata
 *
 * @param metadata - The menu's metadata
 * @param elementsMetadata - The elements metadata
 * @param showEndElement - Whether to show the end element item
 * @param numPasteElementsAvailable - Number of elements available to paste
 * @param canAddGoto - Is the next element END
 * @param isGoToConnector - Is this a Goto connection
 * @returns the connector menu configuration
 */
const configureElementMenu = (
    metadata: ConnectorMenuMetadata,
    elementsMetadata: ElementMetadata[],
    showEndElement: boolean,
    numPasteElementsAvailable: number,
    canAddGoto: boolean,
    isGoToConnector: boolean
): { sections: MenuSection[] } => {
    const sectionDefinitionsMap = {};

    let extraSections: MenuSection[] = [];
    actionSection.items = [];

    if (numPasteElementsAvailable > 0 || canAddGoto || isGoToConnector) {
        if (isGoToConnector) {
            actionSection.items.push(rerouteGoToActionItem);
            actionSection.items.push(deleteGoToActionItem);
        } else if (canAddGoto) {
            actionSection.items.push(addGoToActionItem);
        }

        if (numPasteElementsAvailable > 0) {
            pasteActionItem.label =
                numPasteElementsAvailable === 1
                    ? LABELS.pasteOneItemLabel
                    : format(LABELS.pasteMultiItemLabel, numPasteElementsAvailable.toString());
            actionSection.items.push(pasteActionItem);
        }

        extraSections = [actionSection];
    }

    const sections: MenuSection[] = elementsMetadata.reduce(
        (
            acc,
            {
                section,
                description,
                icon,
                iconShape,
                iconBackgroundColor,
                label,
                elementType,
                elementSubtype,
                actionType,
                actionName,
                type
            }
        ) => {
            if (section == null || (type === NodeType.END && !showEndElement)) {
                return acc;
            }

            let sectionDefinition: MenuSection = sectionDefinitionsMap[section];

            if (!sectionDefinition) {
                sectionDefinitionsMap[section] = sectionDefinition = {
                    guid: generateGuid(),
                    // TODO: refactor
                    heading: type === NodeType.ORCHESTRATED_STAGE ? null : section,
                    label: section,
                    items: [],
                    separator: false
                };

                acc.push(sectionDefinition);
            }

            let iconContainerClass = 'slds-media__figure slds-listbox__option-icon';
            let iconClass = '';
            let iconSize = 'small';
            let iconVariant = '';

            if (iconBackgroundColor) {
                iconClass = iconBackgroundColor;
            }

            if (iconShape === ICON_SHAPE.CIRCLE && type === NodeType.END) {
                iconClass = `${iconClass} end-element-svg`;
                iconSize = 'xx-small';
                iconVariant = 'inverse';
            } else if (iconShape === ICON_SHAPE.DIAMOND) {
                iconContainerClass = `${iconContainerClass} rotate-icon-container slds-icon-standard-decision`;
                iconClass = `${iconClass} rotate-icon-svg`;
            }

            const isSupported = metadata.elementTypes.has(elementType);

            if (isSupported) {
                const item: MenuItem = {
                    guid: generateGuid(),
                    description,
                    label,
                    elementType,
                    actionType,
                    actionName,
                    icon,
                    iconContainerClass,
                    iconClass,
                    iconSize,
                    iconVariant,
                    rowClass: 'slds-listbox__item',
                    elementSubtype,
                    tooltip: description ? label + ': ' + description : label
                };
                sectionDefinition.items.push(item);
            }

            return acc;
        },
        extraSections
    );
    // Filtering out sections that no longer have items in them.
    const updatedSections = sections.filter((section) => {
        return section.items?.length > 0;
    });

    return { sections: updatedSections };
};

const memoizedConfigureMenu = memoize(configureElementMenu);

/**
 * Create ALC Menu Configuration from the metadata
 *
 * @param searchInput - search input entered by the user
 * @param metadata - The menu's metadata
 * @param elementsMetadata - The elements metadata
 * @param showEndElement - Whether to show the end element item
 * @param numPasteElementsAvailable - Number of elements available to paste
 * @param canAddGoto - Is the next element END
 * @param isGoToConnector - Is this a Goto connection
 * @returns the connector menu configuration
 */
export const configureMenu = (
    searchInput: string,
    metadata: ConnectorMenuMetadata,
    elementsMetadata: ElementMetadata[],
    showEndElement: boolean,
    numPasteElementsAvailable: number,
    canAddGoto: boolean,
    isGoToConnector: boolean
) => {
    // We don't want to show Go to connector, paste elements, etc
    // if the user is searching
    const elementsSection = searchInput
        ? memoizedConfigureMenu(metadata, elementsMetadata, false, 0, false, false)
        : memoizedConfigureMenu(
              metadata,
              elementsMetadata,
              showEndElement,
              numPasteElementsAvailable,
              canAddGoto,
              isGoToConnector
          );

    if (!searchInput) {
        return elementsSection;
    }

    // Flatten the usual configured menu into one Search Results section
    const searchResultsSection = flattenIntoSearchResultsSection(elementsSection);

    const allItems = searchResultsSection.items;

    // Now add other MenuItems passed from Canvas (Actions, Subflows, etc)
    allItems.push(...metadata.menuItems);

    const filteredItems = allItems.filter((item) => {
        return item.label.toLowerCase().indexOf(searchInput.toLowerCase()) > -1;
    });

    searchResultsSection.items = filteredItems;

    return { sections: [searchResultsSection] };
};

/**
 * Flatten several Menu Sections into one big Search Results section
 *
 * @param existingMenuSections - The normal menu configuration
 * @returns the connector menu search results section
 */
const flattenIntoSearchResultsSection = (existingMenuSections) => {
    const searchSectionName = LABELS.searchSectionHeading;

    const items: ConnectorMenuItem[] = [];

    const searchResultsSection = {
        guid: generateGuid(),
        heading: searchSectionName,
        label: searchSectionName,
        items,
        separator: false
    };
    existingMenuSections?.sections.forEach((sec) => {
        searchResultsSection.items = searchResultsSection.items.concat(sec.items);
    });
    return searchResultsSection;
};
