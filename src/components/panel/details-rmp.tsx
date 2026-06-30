import {
    RmgFields,
    RmgFieldsField,
    RmgSidePanel,
    RmgSidePanelBody,
    RmgSidePanelHeader,
} from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setComponentValue } from '../../redux/param/param-slice';
import { backupParam, openPaletteAppClip } from '../../redux/runtime/runtime-slice';
import { getComponentDisplayName } from '../../util/attr-binding';
import { defaultColorTheme, normalizeTheme } from '../../constants/constants';
import ThemeButton from './theme-button';
import { getComponentOptionValues, normalizeComponentOptionValue } from '../../constants/components';

const optionValuesToSelectOptions = (options: string[]): Record<string, string> =>
    Object.fromEntries(options.map(option => [option, option]));

export function RmpDetails(props: { isOpen: boolean; onClose: () => void }) {
    const { isOpen, onClose } = props;
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { output },
    } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();
    const requestedColorIndexRef = React.useRef<number>();
    const paramRef = React.useRef(param);

    React.useEffect(() => {
        paramRef.current = param;
    }, [param]);

    React.useEffect(() => {
        const requestedColorIndex = requestedColorIndexRef.current;
        if (requestedColorIndex !== undefined && output) {
            requestedColorIndexRef.current = undefined;
            const currentParam = paramRef.current;
            const component = currentParam.components[requestedColorIndex];
            if (component?.type === 'color') {
                dispatch(backupParam(currentParam));
                dispatch(
                    setComponentValue({
                        index: requestedColorIndex,
                        value: { ...component, value: output },
                    })
                );
            }
        }
    }, [dispatch, output?.toString()]);

    const field: RmgFieldsField[] = param.components.map((c, index) => {
        const { type, defaultValue, value } = c;
        const label = getComponentDisplayName(c);
        if (type === 'number' || type === 'text') {
            return {
                label: label,
                type: 'input',
                value: value ?? defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    const nextValue = type === 'number' && v !== '' ? Number(v) : v;
                    dispatch(setComponentValue({ index: index, value: { ...c, value: nextValue } }));
                },
            };
        } else if (type === 'switch') {
            return {
                label: label,
                type: 'switch',
                isChecked: value !== undefined ? !!value : defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, value: v } }));
                },
            };
        } else if (type === 'textarea') {
            return {
                label: label,
                type: 'textarea',
                value: value ?? defaultValue,
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, value: v } }));
                },
            };
        } else if (type === 'option') {
            const options = getComponentOptionValues(c);
            return {
                label,
                type: 'select',
                options: optionValuesToSelectOptions(options),
                value: normalizeComponentOptionValue(value ?? defaultValue, options),
                onChange: v => {
                    dispatch(backupParam(param));
                    dispatch(setComponentValue({ index: index, value: { ...c, value: v } }));
                },
            };
        } else if (type === 'color') {
            const theme = normalizeTheme(value ?? defaultValue, defaultColorTheme);
            return {
                label,
                type: 'custom',
                component: (
                    <ThemeButton
                        theme={theme}
                        onClick={() => {
                            requestedColorIndexRef.current = index;
                            dispatch(openPaletteAppClip(theme));
                        }}
                    />
                ),
            };
        } else {
            return {
                type: 'input',
                label: 'undefined',
                value: 'none',
            };
        }
    });

    return (
        <RmgSidePanel isOpen={isOpen} header="Dummy header" alwaysOverlay>
            <RmgSidePanelHeader onClose={onClose}>{t('panel.details.header')}</RmgSidePanelHeader>
            <RmgSidePanelBody>
                <RmgFields fields={field} minW={300} />
            </RmgSidePanelBody>
        </RmgSidePanel>
    );
}
