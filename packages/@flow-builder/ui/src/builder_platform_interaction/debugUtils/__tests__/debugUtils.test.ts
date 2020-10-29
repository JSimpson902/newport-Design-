// @ts-nocheck
import { copyAndUpdateDebugTraceObject, makeElementTitle, formatDateHelper } from '../debugUtils';
import { LABELS } from '../debugUtilsLabels';
import { pausedInterview } from 'mock/debugResponse/mock-paused-interview';
import { completedInterviewWithErrors } from 'mock/debugResponse/mock-completed-interview-errors';
import { completedInterview } from 'mock/debugResponse/mock-completed-interview';

const commonUtils = jest.requireActual('builder_platform_interaction/commonUtils');
commonUtils.format = jest
    .fn()
    .mockImplementation((formatString, ...args) => formatString + '(' + args.toString() + ')');

describe('debug utils', () => {
    describe('completed interview', () => {
        let updatedDebugTraceObject;
        beforeEach(() => {
            updatedDebugTraceObject = copyAndUpdateDebugTraceObject(completedInterview);
        });

        it('should display interview started info', () => {
            expect(updatedDebugTraceObject[0].title).toMatch(completedInterview.debugTrace[0].lines[0]);
            const startedLines = updatedDebugTraceObject[0].lines;
            expect(startedLines[startedLines.length - 1]).toContain(LABELS.interviewStartedAt);
        });

        it('should display the completed info', () => {
            const len = updatedDebugTraceObject.length;
            expect(len).toBe(completedInterview.debugTrace.length + 1);
            expect(updatedDebugTraceObject[len - 1].title).toMatch(LABELS.interviewFinishHeader);
        });

        it('should display debug info header', () => {
            const expectedHeader = makeElementTitle(completedInterview.debugTrace[1]);
            expect(updatedDebugTraceObject[1].title).toMatch(expectedHeader);
        });
    });

    describe('completed interview with errors', () => {
        let updatedDebugTraceObject;
        beforeEach(() => {
            updatedDebugTraceObject = copyAndUpdateDebugTraceObject(completedInterviewWithErrors);
        });
        it('should display the completed with error info', () => {
            const len = updatedDebugTraceObject.length;
            expect(len).toBe(completedInterviewWithErrors.debugTrace.length + 1);
            expect(updatedDebugTraceObject[len - 1].title).toMatch(LABELS.interviewError);
        });

        it('should display accurate duration', () => {
            const len = updatedDebugTraceObject.length;
            const lastTrace = updatedDebugTraceObject[len - 1].lines;
            const calculatedDurationInMs = (
                (completedInterviewWithErrors.endInterviewTime.getTime() -
                    completedInterviewWithErrors.startInterviewTime.getTime()) /
                1000
            ).toFixed(2);
            expect(lastTrace[0]).toContain(calculatedDurationInMs);
        });
    });

    describe('paused interview', () => {
        let updatedDebugTraceObject;
        beforeEach(() => {
            updatedDebugTraceObject = copyAndUpdateDebugTraceObject(pausedInterview);
        });

        it('should display the paused message', () => {
            const len = updatedDebugTraceObject.length;
            expect(len).toBe(pausedInterview.debugTrace.length + 1);
            expect(updatedDebugTraceObject[len - 1].title).toMatch(LABELS.interviewPausedHeader);
            expect(updatedDebugTraceObject[len - 1].lines[0]).toMatch(LABELS.interviewPaused);
        });
    });

    it('test date formatter', () => {
        const start = new Date('June 17, 2020 03:24:00');
        const outputDateAndTime = formatDateHelper(start).dateAndTime;
        expect(outputDateAndTime).toMatch('June 17, 2020, 3:24 AM');
        const outputDate = formatDateHelper(start).date;
        expect(outputDate).toMatch('June 17, 2020');
        const outputTime = formatDateHelper(start).time;
        expect(outputTime).toMatch('3:24 AM');
    });
});
