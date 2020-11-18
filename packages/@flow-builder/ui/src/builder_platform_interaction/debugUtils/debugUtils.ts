// @ts-nocheck
import { LABELS } from './debugUtilsLabels';
import { format } from 'builder_platform_interaction/commonUtils';
import { generateGuid } from 'builder_platform_interaction/storeLib';

/**
 * @constant STATUS The Interview Status
 * @type {Object}
 */
export const STATUS = {
    FINISHED: 'FINISHED',
    ERROR: 'ERROR',
    WAITING: 'WAITING'
};

const ELEMENT_ERR_TITLE = LABELS.errorBody.replace(/ \{0\} \(\{1\}\)./, '').trim();

/**
 * Unable to directly mutate the passed object: debugData
 * Add start and end info and create new title field (first element in debugInfo)
 * @param {Object} debugData the debug interview response
 * @returns {Array} debugTraces array that contains objects representing each debug trace
 */
export function copyAndUpdateDebugTraceObject(debugData) {
    const debugTraces = [];
    // handle special case where a flow's start element is not connected to any other element
    if (debugData.debugTrace.length === 1 && debugData.debugTrace[0].error != null) {
        debugTraces.push({
            title: makeElementTitle(debugData.debugTrace[0]),
            lines: debugData.debugTrace[0].lines,
            error: debugData.debugTrace[0].error,
            id: generateGuid()
        });
    } else {
        debugTraces.push(getStartInterviewInfo(debugData));
        for (let i = 1; i < debugData.debugTrace.length; i++) {
            const trace = debugData.debugTrace[i].lines.filter((e) => {
                return !!e;
            });
            const cardTitle = makeElementTitle(debugData.debugTrace[i]);
            debugTraces.push({
                title: cardTitle,
                lines: cardTitle !== '' ? trace.slice(1) : trace, // remove 1st elem cause it has the title (see BaseInterviewHTMLWriter#addElementHeader)
                error: debugData.debugTrace[i].error,
                id: generateGuid()
            });
        }
        const end = getEndInterviewInfo(debugData);
        if (end) {
            debugTraces.push(end);
        }
    }
    return debugTraces;
}

/**
 * Add the start time to Interview Started debug Info
 * @param {Object} debugData the debug interview response
 * @return {Object} start debug interview info
 */
function getStartInterviewInfo(debugData) {
    const startedInfo = debugData.debugTrace[0].lines.filter((e) => {
        return !!e;
    });
    startedInfo.push(format(LABELS.interviewStartedAt, formatDateHelper(debugData.startInterviewTime).dateAndTime));
    return {
        title: startedInfo[0],
        lines: startedInfo,
        id: generateGuid()
    };
}

/**
 * Adding additional trace that is not returned by backend.
 * Error/Finished Header, Interview finish time, Interview Duration
 * @param {Object} debugData the debug interview response
 * @return {Object} end debug interview info
 */
function getEndInterviewInfo(debugData) {
    let end;
    const duration = ((debugData.endInterviewTime.getTime() - debugData.startInterviewTime.getTime()) / 1000).toFixed(
        2
    );
    const dateTime = formatDateHelper(debugData.endInterviewTime);
    switch (debugData.interviewStatus) {
        case STATUS.FINISHED:
            end = {
                title: LABELS.interviewFinishHeader,
                lines: [format(LABELS.interviewFinishedAt, duration, dateTime.date, dateTime.time)],
                id: generateGuid()
            };
            break;
        case STATUS.ERROR:
            end = {
                title: LABELS.interviewError,
                lines: [format(LABELS.interviewErrorAt, dateTime.date, dateTime.time, duration)],
                id: generateGuid()
            };
            break;
        case STATUS.WAITING:
            end = {
                title: LABELS.interviewPausedHeader,
                lines: [LABELS.interviewPaused],
                id: generateGuid()
            };
            break;
        default:
            break;
    }
    return end;
}

/**
 * Formats dateTime ie: July 6, 2020, 8:58AM
 * @param dateTime Javascript Date object
 * @return {String} date in specified format in user default locale
 */
export function formatDateHelper(dateTime) {
    const dateAndTime = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    const date = { year: 'numeric', month: 'long', day: 'numeric' };
    const time = { hour: 'numeric', minute: 'numeric' };
    return {
        dateAndTime: dateTime.toLocaleDateString(undefined, dateAndTime),
        date: dateTime.toLocaleDateString(undefined, date),
        time: dateTime.toLocaleTimeString(undefined, time)
    };
}

/**
 * Format the title for the element debug card
 * eg: elementType: elementApiName
 *
 * corner case: element error card format doesn't need colon
 * eg: Error element <elementApiName> (<elementType>)
 */
export function makeElementTitle(debugTrace) {
    if (debugTrace.elementApiName && !debugTrace.elementType.includes(ELEMENT_ERR_TITLE)) {
        return debugTrace.elementType + ': ' + debugTrace.elementApiName;
    }
    if (!debugTrace.elementApiName && !debugTrace.elementType) {
        return '';
    }
    return debugTrace.elementType;
}
