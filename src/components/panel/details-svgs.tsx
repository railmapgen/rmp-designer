import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setSvgValue } from '../../redux/param/param-slice';
import Svgs from '../svgs/svgs';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { t } = useTranslation();

    const p = param.svgs.map((s, i) => {
        const field: RmgFieldsField[] = [
            {
                label: 'x',
                type: 'input',
                value: s.x,
                onChange: value => dispatch(setSvgValue({ index: i, value: { ...s, x: value } })),
            },
            {
                label: 'y',
                type: 'input',
                value: s.y,
                onChange: value => dispatch(setSvgValue({ index: i, value: { ...s, y: value } })),
            },
        ];
        const F = Svgs[s.type].attrsComponent;
        return (
            <AccordionItem key={s.id}>
                <AccordionButton p={2}>
                    <Box as="span" flex="1" textAlign="left">
                        {Svgs[s.type].displayName}
                    </Box>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <RmgFields fields={field} />
                    <F
                        attrs={s.attrs}
                        id={s.id}
                        handleAttrsUpdate={(index, attrs) =>
                            dispatch(setSvgValue({ index: i, value: { ...s, attrs } }))
                        }
                    />
                </AccordionPanel>
            </AccordionItem>
        );
    });

    return (
        <Box width="100%">
            <Heading fontSize="x-large" p={2}>
                Svgs
            </Heading>
            <Accordion width="100%" allowMultiple>
                {...p}
            </Accordion>
        </Box>
    );
}
