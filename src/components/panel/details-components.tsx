import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setComponentValue } from '../../redux/param/param-slice';
import { ComponentsType, ComponentsTypeOptions } from '../../constants/constants';

export function DetailsComponents() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { t } = useTranslation();

    const getType = (type: ComponentsType) => {
        switch (type) {
            case 'number':
                return 'number';
            case 'switch':
                return 'boolean';
            case 'textarea' || 'text':
                return 'string';
        }
        return undefined;
    };

    const p = param.components.map((c, index) => {
        const { id, label, type, defaultValue, value } = c;
        const field: RmgFieldsField[] = [
            {
                label: 'Label',
                type: 'input',
                value: label,
                onChange: v => dispatch(setComponentValue({ index: index, value: { ...c, label: v } })),
            },
            {
                label: 'Type',
                type: 'select',
                options: ComponentsTypeOptions,
                value: type,
                onChange: v =>
                    dispatch(setComponentValue({ index: index, value: { ...c, type: v as ComponentsType } })),
            },
            {
                label: 'Default value',
                type: 'input',
                value: defaultValue,
                onChange: v => dispatch(setComponentValue({ index: index, value: { ...c, defaultValue: v } })),
            },
        ];

        return (
            <AccordionItem key={id}>
                <AccordionButton p={2}>
                    <Box as="span" flex="1" textAlign="left">
                        {label}
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <RmgFields fields={field} />
                </AccordionPanel>
            </AccordionItem>
        );
    });

    return (
        <Box width="100%">
            <Heading fontSize="x-large" p={2}>
                Variables
            </Heading>
            <Accordion width="100%" allowMultiple>
                {...p}
            </Accordion>
        </Box>
    );
}
