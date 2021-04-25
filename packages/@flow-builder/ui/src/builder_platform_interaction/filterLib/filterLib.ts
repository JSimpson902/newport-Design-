// @ts-nocheck
import { ELEMENT_TYPE } from 'builder_platform_interaction/flowMetadata';
import { booleanMatcher, containsMatcher, notEqualsMatcher } from './matchers';
import { isAutomaticOutputElementWithoutChildren } from 'builder_platform_interaction/complexTypeLib';
import {
    isRegionContainerField,
    isRegionField,
    isAutomaticField
} from 'builder_platform_interaction/screenEditorUtils';

export * from './matchers';

/**
 * Creates a filter function that finds objects containing the given pattern in
 * their label field.
 *
 * @param {String}
 *            pattern the substring to search for
 * @return {Function} a filter function that finds elements containing the given
 *         pattern in their label
 */
export const labelFilter = (pattern) => {
    return (obj) => {
        return pattern ? containsMatcher(obj, 'label', pattern) : true;
    };
};

/**
 * Creates a filter that finds resources (non canvas elements and elements in automatic handling mode) containing the
 * given pattern in their name.
 *
 * @param {String}
 *            pattern the substring to search for
 * @return {Function} a filter function that finds resources containing the given
 *         pattern in their label
 */
export const resourceFilter = (pattern) => {
    return (obj) => {
        let result = false;
        if (
            obj.elementType === ELEMENT_TYPE.ROOT_ELEMENT ||
            obj.elementType === ELEMENT_TYPE.END_ELEMENT ||
            obj.elementType === ELEMENT_TYPE.SCHEDULED_PATH
        ) {
            result = false;
        } else if (
            booleanMatcher(obj, 'isCanvasElement', false) &&
            !isRegionContainerField(obj) &&
            !isRegionField(obj) &&
            !isAutomaticField(obj)
        ) {
            result = true;
        } else if (booleanMatcher(obj, 'storeOutputAutomatically', true)) {
            // if fields have not been retrieved yet, consider it as a resource for now
            result = !isAutomaticOutputElementWithoutChildren(obj);
        }

        if (pattern) {
            result = result && containsMatcher(obj, 'name', pattern);
        }

        return result;
    };
};

/**
 * Creates a filter that finds canvas elements containing the given pattern in their name.
 *
 * @param {String}
 *            pattern the substring to search for
 * @return {Function} a filter function that finds canvas elements containing the given
 *         pattern in their label
 */
export const canvasElementFilter = (pattern) => {
    return (obj) => {
        // TODO: Temporarily filtering out the Start Element until it becomes a
        // first class element.
        let result =
            notEqualsMatcher(obj, 'elementType', ELEMENT_TYPE.START_ELEMENT) &&
            notEqualsMatcher(obj, 'elementType', ELEMENT_TYPE.END_ELEMENT) &&
            notEqualsMatcher(obj, 'elementType', ELEMENT_TYPE.ROOT_ELEMENT) &&
            booleanMatcher(obj, 'isCanvasElement', true);
        if (pattern) {
            result = result && containsMatcher(obj, 'name', pattern);
        }
        return result;
    };
};
