/**
 * Utils for drawing svg paths
 */

export interface Location {
    x: number;
    y: number;
}
export interface Geometry {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface SvgInfo {
    geometry: Geometry;
    path: string;
}

export type Offset = [number, number];

export interface SvgPathParams {
    start: Location;
    offsets: Offset[];
}

/**
 * Creates a segment of an svg path
 *
 * @param start - The start location
 * @param offset - The offset to move to
 * @param nextOffset - The offset following the prior one
 * @param curveRadius - The curve radius
 * @returns A string that represents an svg path segment
 */
function createSegment(start: Location, offset: Offset, nextOffset: Offset = [0, 0]): string {
    const end = createOffsetLocation(start, offset);

    const [dx, dy] = offset;
    const [, nextDy] = nextOffset;

    if (dx !== 0 && dy !== 0) {
        if (Math.abs(dx) !== Math.abs(dy)) {
            throw Error('Invalid offsets for curve');
        }

        let curveDirection;
        const curveRadius = Math.abs(dx);

        if (dy > 0) {
            if (nextDy > 0) {
                curveDirection = dx < 0 ? 0 : 1;
            } else {
                curveDirection = dx < 0 ? 1 : 0;
            }
        } else {
            if (nextDy > 0) {
                curveDirection = dx < 0 ? 1 : 0;
            } else {
                curveDirection = dx < 0 ? 0 : 1;
            }
        }

        return `A ${curveRadius} ${curveRadius} 0 0 ${curveDirection}, ${end.x}, ${end.y}`;
    } else {
        return `L ${end.x}, ${end.y}`;
    }
}

/**
 * Creates a geometry object for an svg.
 *
 * An svg's element dimensions need to be adjusted to account for the stroke
 * of the paths being drawn, which can "bleed out". For example drawing a line from [0,0] to [0, 100]
 * with a stroke width of 6 will result in a "rectangle" drawn with x in the range of [-3, 3]
 * and y [0, 100].
 *
 * @param width - The width of the svg
 * @param height - The height of the svg
 * @param offset - The offset to apply
 * @returns A Geometry for the svg
 */
function createSvgGeometry(width: number, height: number, offset: Offset): Geometry {
    const [dx, dy] = offset;

    return {
        x: dx === 0 ? 0 : -dx,
        y: dy === 0 ? 0 : -dy,
        w: width + 2 * dx,
        h: height + 2 * dy
    };
}

/**
 * Creates a location that is offset from a specified location
 * @param location - The location to offset
 * @param offset - The location offset
 * @returns An offsetted location
 */
function createOffsetLocation(location: Location, offset: Offset): Location {
    const [dx, dy] = offset;
    return { x: location.x + dx, y: location.y + dy };
}

/**
 * Creates an svg path
 *
 * @param pathParams - The svg path params
 * @param startOffset - The offset for the start location
 * @returns A string that represents an svg path
 */
function createSvgPath(pathParams: SvgPathParams, startOffset: Offset = [0, 0]): string {
    const { start, offsets } = pathParams;
    let location = createOffsetLocation(start, startOffset);
    const segments = [`M ${location.x}, ${location.y}`];

    for (let i = 0; i < offsets.length; i++) {
        segments.push(createSegment(location, offsets[i], offsets[i + 1]));
        location = createOffsetLocation(location, offsets[i]);
    }

    return segments.join('\n');
}

/**
 * Creates an SvgInfo (path and geometry) for an svg
 *
 * @param width - The width of the svg
 * @param height - The height of the svg
 * @param svgPathParams  - The path params
 * @param offset - The offset to account for path "bleeding"
 */
function createSvgInfo(svgPathParams: SvgPathParams, offset: Offset = [0, 0]): SvgInfo {
    const [width, height] = svgPathParams.offsets.reduce(([prevDx, prevDy], [dx, dy]) => [prevDx + dx, prevDy + dy], [
        0,
        0
    ]);

    return {
        geometry: createSvgGeometry(Math.abs(width), Math.abs(height), offset),
        path: createSvgPath(svgPathParams, offset)
    };
}

export { createSvgInfo, createSvgPath, createOffsetLocation };
