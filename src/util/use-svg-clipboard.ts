import React from 'react';
import { Id } from '../constants/constants';
import { setSvgs } from '../redux/param/param-slice';
import { useRootDispatch, useRootSelector } from '../redux';
import { backupParam, clearGlobalAlerts, setSelected } from '../redux/runtime/runtime-slice';
import {
    createPastedSvgElems,
    createSvgElementClipboardText,
    findSelectedSvgElems,
    parseSvgElementClipboardText,
} from './svg-clipboard';

const getClipboard = () => (typeof navigator === 'undefined' ? undefined : navigator.clipboard);

export const useSvgClipboardActions = () => {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const selected = useRootSelector(store => store.runtime.selected);
    const svgCursorPosition = useRootSelector(store => store.runtime.svgCursorPosition);

    const selectedElems = React.useMemo(() => {
        if (selected.size === 0) return [];
        return findSelectedSvgElems(param.svgs, selected);
    }, [param.svgs, selected]);

    const copySelectedSvg = React.useCallback(async () => {
        const clipboard = getClipboard();
        if (selectedElems.length === 0 || !clipboard?.writeText) return false;

        try {
            await clipboard.writeText(createSvgElementClipboardText(selectedElems));
            return true;
        } catch {
            return false;
        }
    }, [selectedElems]);

    const pasteSvg = React.useCallback(async () => {
        const clipboard = getClipboard();
        if (!clipboard?.readText) return false;

        let text = '';
        try {
            text = await clipboard.readText();
        } catch {
            return false;
        }

        const payload = parseSvgElementClipboardText(text);
        if (!payload) return false;
        const pasted = createPastedSvgElems(payload.elements, param.components, svgCursorPosition);
        dispatch(backupParam(param));
        dispatch(setSvgs([...param.svgs, ...pasted]));
        dispatch(clearGlobalAlerts());
        dispatch(setSelected(new Set<Id>(pasted.map(elem => elem.id))));
        return true;
    }, [dispatch, param, svgCursorPosition]);

    return {
        canCopy: selectedElems.length > 0,
        copySelectedSvg,
        pasteSvg,
    };
};
