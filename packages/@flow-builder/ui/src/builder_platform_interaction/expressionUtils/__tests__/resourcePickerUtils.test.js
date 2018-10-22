import { getMenuData } from '../resourcePickerUtils';
import {
    filterAndMutateMenuData,
    filterFieldsForChosenElement,
    getStoreElements,
} from '../menuDataRetrieval';
import { getFieldsForEntity } from 'builder_platform_interaction/sobjectLib';

const paramTypes = ['paramType'];

let resourcePicker;

const objectName = 'Account';
const parentItem = {
    objectType: objectName,
};

const fields = ['field1'];
const elements = ['element1'];
const storeInstance = {
    getCurrentState() {
        return elements;
    }
};

jest.mock('../menuDataRetrieval', () => {
    return {
        getSecondLevelItems: require.requireActual('../menuDataRetrieval').getSecondLevelItems,
        filterFieldsForChosenElement: jest.fn(),
        getStoreElements: jest.fn((storeState) => {
            return storeState;
        }),
        filterAndMutateMenuData: jest.fn(),
    };
});

jest.mock('builder_platform_interaction/sobjectLib', () => {
    return {
        getFieldsForEntity: jest.fn((entityName, fieldsFn) => {
            fieldsFn(['field2']);
        }),
    };
});

describe('resourcePickerUtils', () => {
    describe('Get field menudata', () => {
        beforeEach(() => {
            resourcePicker = {
                populateParamTypes() {
                    return paramTypes;
                }
            };
        });
        it('Should filter the fields when the fields already have been loaded', () => {
            getMenuData(null, null, resourcePicker.populateParamTypes, false, false, null, true, parentItem, fields);
            expect(filterFieldsForChosenElement).toHaveBeenCalledWith(parentItem, paramTypes,
                fields, true, true);
        });

        it('Should filter the fields after waiting for the fields to load', () => {
            getMenuData(null, null, resourcePicker.populateParamTypes, false, false, null, true, parentItem);
            expect(getFieldsForEntity).toHaveBeenCalledWith(objectName, expect.anything());
            expect(filterFieldsForChosenElement).toHaveBeenCalledWith(parentItem, paramTypes,
                ['field2'], true, true);
        });
    });

    describe('Get FEROV menudata', () => {
        beforeEach(() => {
            resourcePicker = {
                populateParamTypes() {
                    return paramTypes;
                },
                propertyEditorElementType: 'Assignment',
                allowSobjectForFields: true,
                enableFieldDrilldown: false
            };
        });
        it('Should get menu data when there is no element config', () => {
            getMenuData(null, resourcePicker.propertyEditorElementType, resourcePicker.populateParamTypes,
                resourcePicker.allowSobjectForFields, resourcePicker.enableFieldDrilldown, storeInstance, true);
            expect(getStoreElements).toHaveBeenCalledWith(elements, { elementType: 'Assignment' });
            expect(filterAndMutateMenuData).toHaveBeenCalledTimes(1);
            expect(filterAndMutateMenuData).toHaveBeenCalledWith(elements, paramTypes, true, true, true);
        });

        it('Should get menu data when there is element config and we do not want new resource option', () => {
            getMenuData('elementConfig', resourcePicker.propertyEditorElementType, resourcePicker.populateParamTypes,
                resourcePicker.allowSobjectForFields, resourcePicker.enableFieldDrilldown, storeInstance, false);
            expect(getStoreElements).toHaveBeenCalledWith(elements, 'elementConfig');
            expect(filterAndMutateMenuData).toHaveBeenCalledTimes(1);
            expect(filterAndMutateMenuData).toHaveBeenCalledWith(elements, paramTypes, false, true, true);
        });
    });
});