import { renderFlow } from '../flowRenderer';
import { calculateFlowLayout } from '../layout';
import MenuType from '../MenuType';

import {
    getEmptyFlowContext,
    getFlowWithEmptyDecisionContext,
    getFlowWithEmptyDeciisionWith3BranchesContext,
    getFlowWithDecisionWithOneElementOnLeftBranchContext,
    getFlowWithEmptyLoopContext,
    getFlowWithTwoFaults,
    getSimpleFlowContext,
    getFlowWithDynamicNodeComponent,
    getFlowWithHighlightedLoopBranches,
    getFlowWithHighlightedFaultBranch,
    getFlowWithHighlightedDecisionBranch,
    getFlowWithHighlightedAndMergedDecisionBranch
} from './testUtils';

function renderAndAssert(ctx) {
    calculateFlowLayout(ctx);
    expect(renderFlow(ctx, 1)).toMatchSnapshot();
}

describe('flowRenderer', () => {
    describe('renderFlow', () => {
        it('empty flow', () => {
            renderAndAssert(getEmptyFlowContext());
        });

        it('flow with empty decision', () => {
            renderAndAssert(getFlowWithEmptyDecisionContext());
        });

        it('flow with empty decision with 3 branches', () => {
            renderAndAssert(getFlowWithEmptyDeciisionWith3BranchesContext());
        });

        it('flow with decision with one element on left branch', () => {
            renderAndAssert(getFlowWithDecisionWithOneElementOnLeftBranchContext());
        });

        it('flow with decision with highlighted branch', () => {
            renderAndAssert(getFlowWithHighlightedDecisionBranch());
        });

        it('flow with decision with highlighted and merged branch', () => {
            renderAndAssert(getFlowWithHighlightedAndMergedDecisionBranch());
        });

        it('flow with empty loop context', () => {
            renderAndAssert(getFlowWithEmptyLoopContext());
        });

        it('flow with highlighted loop branches', () => {
            renderAndAssert(getFlowWithHighlightedLoopBranches());
        });

        it('flow with highlighted fault branch', () => {
            renderAndAssert(getFlowWithHighlightedFaultBranch());
        });

        it('flow with two faults', () => {
            renderAndAssert(getFlowWithTwoFaults());
        });

        it('flow with dynamic node component', () => {
            renderAndAssert(getFlowWithDynamicNodeComponent());
        });

        describe('with menu', () => {
            const context = getSimpleFlowContext();
            const interactionState = {
                menuInfo: {
                    key: 'screen-guid',
                    type: MenuType.NODE
                },
                geometry: { x: 0, y: 0, w: 100, h: 100 },
                needToPosition: false
            };

            it('opened', () => {
                renderAndAssert({ ...context, interactionState });
            });

            it('closing', () => {
                renderAndAssert({ ...context, interactionState });
            });
        });
    });
});
