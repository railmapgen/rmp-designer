import pako from 'pako';
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

export const compressToBase64 = (input: string): string => {
    const uint8Array = new TextEncoder().encode(input);
    const compressed = pako.deflate(uint8Array);
    return btoa(String.fromCharCode(...new Uint8Array(compressed.buffer)));
};

export const createHash = async (data: string, algorithm = 'SHA-256') => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(algorithm, encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export const readFileAsText = (file: File) => {
    return new Promise((resolve: (text: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(file);
    });
};
