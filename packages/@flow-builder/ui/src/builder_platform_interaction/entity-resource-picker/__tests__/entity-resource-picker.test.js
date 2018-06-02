import { createElement } from 'engine';
import { getEntitiesMenuData } from 'builder_platform_interaction-expression-utils';
import EntityResourcePicker from '../entity-resource-picker';

const setupComponentUnderTest = (props) => {
    const element = createElement('builder_platform_interaction-entity-resource-picker', {
        is: EntityResourcePicker,
    });

    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
};

const entityMenuData = [{value:'entityMenuData', displayText: 'entity menu data'}];

jest.mock('builder_platform_interaction-expression-utils', () => {
    return {
        getEntitiesMenuData: jest.fn().mockReturnValue([{value:'entityMenuData', displayText: 'entity menu data'}]).mockName('getEntitiesMenuData'),
    };
});

const selectors = {
    BASE_RESOURCE_PICKER: 'builder_platform_interaction-base-resource-picker',
};

describe('entity-resource-picker', () => {
    let props;

    beforeEach(() => {
        props = {
            crudFilterType: 'TEST_FILTER',
        };
    });

    it('contains one base resource picker', () => {
        const entityResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            const baseResourcePicker = entityResourcePicker.querySelector(selectors.BASE_RESOURCE_PICKER);
            expect(baseResourcePicker).toBeDefined();
        });
    });

    it('retrieves entity menu data on initial load', () => {
        const entityResourcePicker = setupComponentUnderTest(props);
        const baseResourcePicker = entityResourcePicker.querySelector(selectors.BASE_RESOURCE_PICKER);
        return Promise.resolve().then(() => {
            expect(getEntitiesMenuData).toHaveBeenCalledTimes(1);
            expect(getEntitiesMenuData).toHaveBeenCalledWith(props.crudFilterType);
            expect(baseResourcePicker.fullMenuData).toEqual(entityMenuData);
        });
    });

    it('retrieves entity menu data when changing crud filter type', () => {
        const entityResourcePicker = setupComponentUnderTest(props);
        const newFilter = 'NEW_FILTER';
        Object.assign(entityResourcePicker, { crudFilterType: newFilter});
        return Promise.resolve().then(() => {
            expect(getEntitiesMenuData).toHaveBeenCalledTimes(2);
            expect(getEntitiesMenuData).toHaveBeenCalledWith(newFilter);
        });
    });

    it('sets the combobox config object of the base resource picker', () => {
        props.comboboxConfig = {
            label: 'test label'
        };
        const entityResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            const baseResourcePicker = entityResourcePicker.querySelector(selectors.BASE_RESOURCE_PICKER);
            expect(baseResourcePicker.comboboxConfig).toEqual(props.comboboxConfig);
        });
    });

    it('sets the displayText of the base resource picker', () => {
        props.displayText = 'test display text';
        const entityResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            const baseResourcePicker = entityResourcePicker.querySelector(selectors.BASE_RESOURCE_PICKER);
            expect(baseResourcePicker.displayText).toEqual(props.displayText);
        });
    });

    it('sets the value of the base resource picker', () => {
        props.value = { value: 'testValue', displayText: 'test display text'};
        const entityResourcePicker = setupComponentUnderTest(props);
        return Promise.resolve().then(() => {
            const baseResourcePicker = entityResourcePicker.querySelector(selectors.BASE_RESOURCE_PICKER);
            expect(baseResourcePicker.value).toEqual(props.value);
        });
    });
});