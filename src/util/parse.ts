import { roundToNearestN } from './helper';

export const calcFunc = (str: string, ...rest: string[]) => new Function(...rest, `return ${str}`);

export const updateTransformString = (transform: string, dx: number, dy: number): string => {
    let translateX = 0,
        translateY = 0,
        rotate = 0,
        scaleX = 1,
        scaleY = 1,
        skewX = 0,
        skewY = 0;

    // Match existing transform values
    const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
    if (translateMatch) {
        translateX = parseFloat(translateMatch[1]);
        translateY = parseFloat(translateMatch[2]);
    }

    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
        rotate = parseFloat(rotateMatch[1]);
    }

    const scaleMatch = transform.match(/scale\(([^,]+)(?:,([^)]+))?\)/);
    if (scaleMatch) {
        scaleX = parseFloat(scaleMatch[1]);
        scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
    }

    const skewXMatch = transform.match(/skewX\(([^)]+)\)/);
    if (skewXMatch) {
        skewX = parseFloat(skewXMatch[1]);
    }

    const skewYMatch = transform.match(/skewY\(([^)]+)\)/);
    if (skewYMatch) {
        skewY = parseFloat(skewYMatch[1]);
    }

    translateX = roundToNearestN(translateX + dx, 1);
    translateY = roundToNearestN(translateY + dy, 1);

    return `1"translate(${translateX}, ${translateY}) rotate(${rotate}) scale(${scaleX}${scaleX !== scaleY ? `, ${scaleY}` : ''}) skewX(${skewX}) skewY(${skewY})"`;
};
