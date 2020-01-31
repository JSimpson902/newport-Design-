import { createElement } from 'lwc';
import Header from '../header';
import { LABELS } from '../headerLabels';

function createComponentForTest(name, version, backUrl, helpUrl) {
    const el = createElement('builder_platform_interaction-header', {
        is: Header
    });
    el.flowName = name;
    el.flowVersion = version;
    el.backUrl = backUrl;
    el.helpUrl = helpUrl;
    document.body.appendChild(el);
    return el;
}

const selectors = {
    root: '.header',
    flowNameVersionTitle: '.test-flow-name-version-title',
    flowName: '.test-flow-name',
    flowVersion: '.test-flow-version',
    appName: '.test-app-name',
    backUrl: '.test-back-url',
    backLabel: '.test-back-label',
    helpUrl: '.test-help-url',
    helpLabel: '.test-help-label',
    flowIcon: '.test-flow-utility-icon',
    backIcon: '.test-back-utility-icon',
    helpIcon: '.test-help-utility-icon'
};

describe('HEADER', () => {
    it('checks the rendering of default FLOW UTILITY Icon', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.flowIcon).iconName).toEqual('utility:flow');
        });
    });

    it('checks the rendering of default APP NAME label', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.appName).textContent).toEqual(LABELS.appNameText);
        });
    });

    it('checks the rendering of configured icon', () => {
        const testIcon = 'utility:testIcon';
        const headerComponent = createComponentForTest();
        headerComponent.builderIcon = testIcon;
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.flowIcon).iconName).toEqual(testIcon);
        });
    });

    it('checks the rendering of configured builder name', () => {
        const testBuilderName = 'testBuilder';
        const headerComponent = createComponentForTest();
        headerComponent.builderName = testBuilderName;
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.appName).textContent).toEqual(testBuilderName);
        });
    });

    it('checks the rendering FLOW NAME VERSION TITLE', () => {
        const headerComponent = createComponentForTest('Flow Name', '1');
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.flowNameVersionTitle).title).toEqual(
                `Flow Name${LABELS.versionLabelText}1`
            );
        });
    });

    it('checks the rendering FLOW NAME', () => {
        const headerComponent = createComponentForTest('Flow Name', '1');
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.flowName).textContent).toEqual(`Flow Name`);
        });
    });

    it('checks the rendering FLOW VERSION', () => {
        const headerComponent = createComponentForTest('Flow Name', '1');
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.flowVersion).textContent).toEqual(
                `${LABELS.versionLabelText}1`
            );
        });
    });

    it('checks the rendering BACK UTILITY Icon', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.backIcon).iconName).toEqual('utility:back');
        });
    });

    it('checks the rendering BACK URL when its undefined and should return Undefined.', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.backUrl).value).toBeUndefined();
        });
    });

    it('checks the rendering BACK URL when ProcessUIFlow value is provided should return /300', () => {
        const headerComponent = createComponentForTest('Flow Name', '1', '/300');
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.backUrl).pathname).toEqual('/300');
        });
    });

    it('checks the rendering BACK label', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.backLabel).textContent).toEqual(
                LABELS.backButtonText
            );
        });
    });

    it('checks the rendering HELP UTILITY Icon', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.helpIcon).iconName).toEqual('utility:help');
        });
    });

    it('checks the rendering HELP label', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.helpLabel).textContent).toEqual(
                LABELS.helpButtonText
            );
        });
    });

    it('checks the rendering HELP URL when its undefined and should return Undefined.', () => {
        const headerComponent = createComponentForTest();
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.helpUrl).value).toBeUndefined();
        });
    });

    it('checks the rendering HELP URL when ProcessUIFlow value is provided should return /HELP', () => {
        const headerComponent = createComponentForTest('Flow Name', '1', '/300', '/HELP');
        return Promise.resolve().then(() => {
            expect(headerComponent.shadowRoot.querySelector(selectors.helpUrl).pathname).toEqual('/HELP');
        });
    });
});
