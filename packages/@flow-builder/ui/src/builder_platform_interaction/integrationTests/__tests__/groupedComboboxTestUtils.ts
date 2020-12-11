// @ts-nocheck
import { ticks, selectEvent, blurEvent, textInputEvent } from 'builder_platform_interaction/builderTestUtils';

export const getGroupedComboboxItemBy = (groupedCombobox, propertyName, propertyValue) => {
    if (groupedCombobox.items) {
        for (const item of groupedCombobox.items) {
            if (item.items) {
                for (const subItem of item.items) {
                    if (subItem[propertyName] === propertyValue) {
                        return subItem;
                    }
                }
            } else if (item[propertyName] === propertyValue) {
                return item;
            }
        }
    }
    return undefined;
};

export const getSelectableGroupedComboboxItems = (groupedCombobox) => {
    const result = [];
    if (groupedCombobox.items) {
        for (const item of groupedCombobox.items) {
            if (item.items) {
                for (const subItem of item.items) {
                    result.push(subItem);
                }
            } else {
                result.push(item);
            }
        }
    }
    return result;
};

export const getGroupedComboboxGroupLabel = (groupedCombobox, propertyName, propertyValue) => {
    if (groupedCombobox.items) {
        for (const item of groupedCombobox.items) {
            if (item.items) {
                for (const subItem of item.items) {
                    if (subItem[propertyName] === propertyValue) {
                        return item.label;
                    }
                }
            }
        }
    }
    return undefined;
};

export const getGroupedComboboxItemInGroup = (groupedCombobox, groupLabel, propertyName, propertyValue) => {
    for (const item of groupedCombobox.items) {
        if (item.label === groupLabel && item.items) {
            for (const subItem of item.items) {
                if (subItem[propertyName] === propertyValue) {
                    return subItem;
                }
            }
        }
    }
    return undefined;
};

export const loadMoreInGroupedCombobox = async (groupedCombobox) => {
    groupedCombobox.dispatchEvent(
        new CustomEvent('endreached', {
            bubbles: true,
            cancelable: false
        })
    );
    await ticks(50);
};

export const loadAllInGroupedCombobox = async (groupedCombobox) => {
    let previousComboboxItems;
    do {
        previousComboboxItems = groupedCombobox.items;
        // eslint-disable-next-line no-await-in-loop
        await loadMoreInGroupedCombobox(groupedCombobox);
    } while (groupedCombobox.items !== previousComboboxItems);
};

export const selectGroupedComboboxItemBy = async (
    groupedCombobox,
    propertyName,
    propertyValues,
    { blur = true } = {}
) => {
    let comboboxItem;
    if (groupedCombobox.inputText !== '') {
        groupedCombobox.dispatchEvent(textInputEvent(''));
    }
    for (const propertyValue of propertyValues) {
        // eslint-disable-next-line no-await-in-loop
        await ticks(50);
        comboboxItem = getGroupedComboboxItemBy(groupedCombobox, propertyName, propertyValue);
        if (!comboboxItem) {
            // eslint-disable-next-line no-await-in-loop
            await loadAllInGroupedCombobox(groupedCombobox);
            comboboxItem = getGroupedComboboxItemBy(groupedCombobox, propertyName, propertyValue);
        }
        if (!comboboxItem) {
            break;
        }
        groupedCombobox.dispatchEvent(selectEvent(comboboxItem.value));
    }
    await ticks(50);
    if (blur) {
        groupedCombobox.dispatchEvent(blurEvent);
    }
    await ticks(50);
    return comboboxItem;
};

const checkHasNext = (selectedItem, expectedHasNext) => {
    return !expectedHasNext
        ? !selectedItem.rightIconName || selectedItem.rightIconName === ''
        : selectedItem.rightIconName === 'utility:chevronright';
};

/**
 * Verify that given propertyName property values are selectable in the given combobox and that they can be traversed (i.e. they have next value)
 * @param {Object} combobox a grouped combobox
 * @param {String} propertyName the name of the property propertyValues correspond to
 * @param {Array} propertyValues an array of value that correspond to propertyName of the menu items (e.g. ['myTraversableProperty','nextValue'])
 */
export const expectCanBeTraversed = async (combobox, propertyName, propertyValues) => {
    const selectedItem = await selectGroupedComboboxItemBy(combobox, propertyName, propertyValues, { blur: false });

    expect(selectedItem).toBeDefined();
    expect(checkHasNext(selectedItem, true)).toBe(true);
};

/**
 * Verify that given propertyName property values are selectable in the given combobox and that they cannot be traversed (i.e. they do not have next value)
 * @param {Object} combobox a grouped combobox
 * @param {String} propertyName the name of the property propertyValues correspond to
 * @param {Array} propertyValues an array of value that correspond to propertyName of the menu items (e.g. ['myTraversableProperty','nextValue'])
 */
export const expectCannotBeTraversed = async (combobox, propertyName, propertyValues) => {
    const selectedItem = await selectGroupedComboboxItemBy(combobox, propertyName, propertyValues, { blur: false });

    expect(selectedItem).toBeDefined();
    expect(checkHasNext(selectedItem, false)).toBe(true);
};

/**
 * Verify that given propertyName property values are not selectable in the given combobox
 * @param {Object} combobox a grouped combobox
 * @param {String} propertyName the name of the property propertyValues correspond to
 * @param {Array} propertyValues an array of value that correspond to propertyName of the menu items (e.g. ['myTraversableProperty','nextValue'])
 */
export const expectCannotBeSelected = async (combobox, propertyName, propertyValues) => {
    const itemNotToBeSelected = await selectGroupedComboboxItemBy(combobox, propertyName, propertyValues, {
        blur: false
    });
    expect(itemNotToBeSelected).toBeUndefined();
};
