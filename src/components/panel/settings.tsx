import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setColor, setLabel, setType } from '../../redux/param/param-slice';
import { colorComponents } from '../../constants/components';

export function Settings() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { t } = useTranslation();

    const field: RmgFieldsField[] = [
        {
            label: t('panel.common.label'),
            type: 'input',
            value: param.label,
            onChange: value => dispatch(setLabel(value)),
        },
        {
            label: t('panel.common.type'),
            type: 'select',
            options: { MiscNode: 'MiscNode', Station: 'Station' },
            value: param.type,
            onChange: value => dispatch(setType(value as 'MiscNode' | 'Station')),
            minW: 100,
        },
        {
            label: t('color'),
            type: 'switch',
            isChecked: !!param.color,
            onChange: value => dispatch(setColor(value ? colorComponents : undefined)),
        },
    ];

    return <RmgFields fields={field} />;
}
