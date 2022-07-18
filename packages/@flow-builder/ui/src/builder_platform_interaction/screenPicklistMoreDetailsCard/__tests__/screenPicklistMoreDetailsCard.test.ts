import { LIGHTNING_COMPONENTS_SELECTORS, setDocumentBodyChildren } from 'builder_platform_interaction/builderTestUtils';
import PicklistMoreDetailsCard from 'builder_platform_interaction/screenPicklistMoreDetailsCard';
import { createElement } from 'lwc';

type PicklistMoreDetailsCardProps = {
    sideText: string;
    popupText: string;
};

// General purpose functions

const createComponentForTest = (props: PicklistMoreDetailsCardProps): PicklistMoreDetailsCard => {
    const element = createElement('builder_platform_interaction-screen-picklist-more-details-card', {
        is: PicklistMoreDetailsCard
    });
    Object.assign(element, props);
    setDocumentBodyChildren(element);
    return element;
};

const getPropertyFromSelector = (comp: PicklistMoreDetailsCard, selector: string, property: string): string =>
    comp.shadowRoot.querySelector(selector)[property];

// Functions allowing to get specific element properties

const getSideText = (comp: PicklistMoreDetailsCard) =>
    getPropertyFromSelector(comp, LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_FORMATTED_TEXT, 'value');

const getPopupText = (comp: PicklistMoreDetailsCard) =>
    getPropertyFromSelector(comp, LIGHTNING_COMPONENTS_SELECTORS.LIGHTNING_HELPTEXT, 'content');

// Test cases

describe('The picklist more details card', () => {
    let component: PicklistMoreDetailsCard;
    beforeAll(() => {
        const props: PicklistMoreDetailsCardProps = {
            sideText: 'sideText',
            popupText: 'popupText'
        };
        component = createComponentForTest(props);
    });

    describe('should have its elements displayed correctly', () => {
        test('Side text', () => {
            expect(getSideText(component)).toEqual('sideText');
        });
        test('Popup text', () => {
            expect(getPopupText(component)).toEqual('popupText');
        });
    });
});
