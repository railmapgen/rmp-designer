import { customAlphabet } from 'nanoid';
import { Param } from '../constants/constants';

export const getMousePosition = (e: React.MouseEvent) => {
    const bbox = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bbox.left;
    const y = e.clientY - bbox.top;
    return { x, y };
};

export const pointerPosToSVGCoord = (
    x: number,
    y: number,
    svgViewBoxZoom: number,
    svgViewBoxMin: { x: number; y: number }
) => ({ x: (x * svgViewBoxZoom) / 100 + svgViewBoxMin.x, y: (y * svgViewBoxZoom) / 100 + svgViewBoxMin.y });

export const roundToNearestN = (x: number, n: number) => Math.round(x / n) * n;

export const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export const mapRecord = <K extends string, V, R>(
    record: Record<K, V>,
    callback: (key: K, value: V) => R
): Record<K, R> => {
    return Object.entries(record).reduce(
        (acc, [key, value]) => {
            acc[key as K] = callback(key as K, value as V);
            return acc;
        },
        {} as Record<K, R>
    );
};

export const isMacClient = navigator.platform.startsWith('Mac');

export const getErrorList = (globalAlerts: Map<string, string>, param: Param): Array<string[]> => {
    const list: Array<string[]> = [];
    if (param.type === 'Station' && !param.core) {
        list.push(['Configuration', 'A station need to be connected.']);
    }
    globalAlerts.forEach((val, key) => {
        list.push([key, val]);
    });
    return list;
};

export const downloadAs = (filename: string, type: string, data: any) => {
    const blob = new Blob([data], { type });
    downloadBlobAs(filename, blob);
};

const downloadBlobAs = (filename: string, blob: Blob) => {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
