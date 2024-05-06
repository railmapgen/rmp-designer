import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setId, setType } from '../../redux/param/param-slice';

export function Settings() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { t } = useTranslation();

    const field: RmgFieldsField[] = [
        {
            label: 'Class name (BjsubwayBasic, GzmtrBasic)',
            type: 'input',
            value: param.id,
            onChange: value => dispatch(setId(value)),
        },
        {
            label: 'Type',
            type: 'select',
            options: { MiscNode: 'MiscNode', Station: 'Station' },
            value: param.type,
            onChange: value => dispatch(setType(value as 'MiscNode' | 'Station')),
        },
    ];

    return <RmgFields fields={field} />;
}
