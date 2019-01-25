import { getDataTypeIcons } from "builder_platform_interaction/dataTypeLib";
import { getElementCategory } from "builder_platform_interaction/elementConfig";
import { ELEMENT_TYPE } from "builder_platform_interaction/flowMetadata";
import { labelComparator } from "builder_platform_interaction/sortLib";
import { generateGuid } from "builder_platform_interaction/storeLib";

/**
 * Helper function to return the dataType associated with a screen field
 * @param {Object} screenFieldObject Screen field object
 * @returns dataType associated with a screen field
 */
const getScreenFieldDataType = (screenFieldObject = {}) => {
    return screenFieldObject.dataType || (screenFieldObject.type && screenFieldObject.type.type);
};

/**
 * Transforms elements into a form that is usable by lightning-tree-grid. These
 * are grouped by element category so that they can more easily be placed into
 * sections.
 *
 * @param {Object}
 *            elements list of all the elements
 * @returns {Object} a mapping of element type to a list of
 *          lightning-tree-grid-items
 */
const mutateElements = (elements) => Object.values(elements).reduce((acc, element) => {
    const resourceElement = {
        elementType: element.elementType,
        guid: element.guid,
        label: element.name
    };

    // Adding utility icons for resource manager
    // TODO: Figure out a better way to recognize elements that do need an icon
    // based on the dataType
    const dataTypeIconElements = [ELEMENT_TYPE.VARIABLE, ELEMENT_TYPE.CONSTANT, ELEMENT_TYPE.FORMULA, ELEMENT_TYPE.CHOICE, ELEMENT_TYPE.PICKLIST_CHOICE_SET, ELEMENT_TYPE.RECORD_CHOICE_SET];
    if (element.elementType === ELEMENT_TYPE.SCREEN_FIELD) {
        const screenFieldDataType = getScreenFieldDataType(element);
        resourceElement.iconName = screenFieldDataType ? getDataTypeIcons(screenFieldDataType, 'utility') : 'utility:connected_apps';
    } else if (element.dataType && dataTypeIconElements.includes(element.elementType)) {
        resourceElement.iconName = getDataTypeIcons(element.dataType, 'utility');
    }

    const category = getElementCategory(element.elementType, element.dataType, element.isCollection);
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(resourceElement);

    return acc;
}, {});

/**
 * Combines elements into their respective groupings in a form that is usable by
 * lightning-tree-grid.
 *
 * @param {Object}
 *            elements list of all the elements
 * @param {Function}
 *            filter function to use for resource filtering
 * @param {Function}
 *            sort function to use for resource ordering
 * @returns {Array} collection of lightning-tree-grid items
 */
export const getResourceSections = (elements, filter, sort) => {
    if (!elements || Object.keys(elements).length === 0) {
        return [];
    }

    let resourceSections = [];

    const filteredElements = Object.values(elements).filter(filter).sort(sort);
    const resourceMap = mutateElements(filteredElements);
    resourceSections = Object.keys(resourceMap)
        .filter(elementType => {
            return (
                resourceMap[elementType] &&
                resourceMap[elementType].length > 0
            );
        })
        .map(category => {
            const section = {
                guid: generateGuid(),
                label: category,
                _children: resourceMap[category]
            };
            return section;
        });

    resourceSections.sort(labelComparator);
    return resourceSections;
};
