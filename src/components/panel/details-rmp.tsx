import {
    RmgFields,
    RmgFieldsField,
    RmgLabel,
    RmgSidePanel,
    RmgSidePanelBody,
    RmgSidePanelFooter,
    RmgSidePanelHeader,
} from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setColor, setComponentValue } from '../../redux/param/param-slice';
import { IconButton } from '@chakra-ui/react';
import ColourUtil from './colour-util';
import { MdCircle } from 'react-icons/md';
import { openPaletteAppClip } from '../../redux/runtime/runtime-slice';
import React from 'react';

export function RmpDetails() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { output },
    } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();

    const field: RmgFieldsField[] = param.components.map((c, index) => {
        const { id, label, type, defaultValue, value } = c;
        if (type === 'number' || type === 'text') {
            return {
                label: label,
                type: 'input',
                value: value ?? defaultValue,
                onChange: v => dispatch(setComponentValue({ index: index, value: { ...c, value: v } })),
            };
        } else if (type === 'switch') {
            return {
                label: label,
                type: 'switch',
                isChecked: (value ?? defaultValue) === 'true',
                onChange: v =>
                    dispatch(setComponentValue({ index: index, value: { ...c, value: v ? 'true' : 'false' } })),
            };
        } else if (type === 'textarea') {
            return {
                label: label,
                type: 'textarea',
                value: value ?? defaultValue,
                onChange: v => dispatch(setComponentValue({ index: index, value: { ...c, value: v } })),
            };
        } else {
            return {
                type: 'input',
                label: 'undefined',
                value: 'none',
            };
        }
    });

    const [isThemeRequested, setIsThemeRequested] = React.useState(false);
    React.useEffect(() => {
        if (isThemeRequested && output) {
            dispatch(setColor({ ...param.color!, value: output }));
            setIsThemeRequested(false);
        }
    }, [output?.toString()]);

    const color = param.color?.value ?? param.color?.defaultValue;

    return (
        <RmgSidePanel isOpen={true} header="Dummy header">
            <RmgSidePanelHeader onClose={() => {}}>{t('panel.details.header')}</RmgSidePanelHeader>
            <RmgSidePanelBody>
                <RmgFields fields={field} />
                {param.color ? (
                    <RmgLabel label={param.color.label}>
                        <IconButton
                            aria-label={t('Color')}
                            color={color[3]}
                            bg={color[2]}
                            size="md"
                            _hover={{ bg: ColourUtil.fade(color[2], 0.7) }}
                            icon={<MdCircle />}
                            onClick={() => {
                                setIsThemeRequested(true);
                                dispatch(openPaletteAppClip(color));
                            }}
                        />
                    </RmgLabel>
                ) : undefined}
            </RmgSidePanelBody>
            <RmgSidePanelFooter> 1234 </RmgSidePanelFooter>
        </RmgSidePanel>
    );
}