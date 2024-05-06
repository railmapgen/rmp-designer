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
import { setComponentValue } from '../../redux/param/param-slice';

export function RmpDetails() {
    const param = useRootSelector(store => store.param);
    const dispatch = useRootDispatch();
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

    return (
        <RmgSidePanel isOpen={true} header="Dummy header">
            <RmgSidePanelHeader onClose={() => {}}>{t('panel.details.header')}</RmgSidePanelHeader>
            <RmgSidePanelBody>
                <RmgFields fields={field} />
            </RmgSidePanelBody>
            <RmgSidePanelFooter> 1234 </RmgSidePanelFooter>
        </RmgSidePanel>
    );
}
