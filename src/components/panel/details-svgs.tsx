import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Heading,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDownward, MdArrowUpward, MdClose, MdError } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import { removeGlobalAlert } from '../../redux/runtime/runtime-slice';
import { deleteSvg, setSvgs, setSvgValue } from '../../redux/param/param-slice';
import Svgs from '../svgs/svgs';

export function DetailsSvgs() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts } = useRootSelector(store => store.runtime);
    const { t } = useTranslation();

    const handleMove = (index: number, d: number) => {
        const dest = index + d;
        if (dest >= 0 && dest < param.svgs.length) {
            dispatch(
                setSvgs(
                    param.svgs
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(param.svgs[Math.max(index, dest)])
                        .concat(param.svgs.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest)))
                        .concat(param.svgs[Math.min(index, dest)])
                        .concat(param.svgs.filter((s, i) => i > Math.max(index, dest)))
                )
            );
        }
    };

    const p = param.svgs.toReversed().map((s, index) => {
        const i = param.svgs.length - index - 1; // reversed index
        const field: RmgFieldsField[] = [
            {
                label: 'x',
                type: 'input',
                value: s.x,
                onChange: value => {
                    dispatch(setSvgValue({ index: i, value: { ...s, x: value } }));
                    dispatch(removeGlobalAlert(s.id));
                },
            },
            {
                label: 'y',
                type: 'input',
                value: s.y,
                onChange: value => {
                    dispatch(setSvgValue({ index: i, value: { ...s, y: value } }));
                    dispatch(removeGlobalAlert(s.id));
                },
            },
            {
                label: '',
                type: 'custom',
                oneLine: true,
                component: (
                    <>
                        <Button size="md" onClick={() => handleMove(i, 1)}>
                            <MdArrowUpward />
                        </Button>
                        <Button size="md" onClick={() => handleMove(i, -1)}>
                            <MdArrowDownward />
                        </Button>
                        <Button
                            size="md"
                            onClick={() => {
                                dispatch(removeGlobalAlert(s.id));
                                dispatch(deleteSvg(i));
                            }}
                        >
                            <MdClose />
                        </Button>
                    </>
                ),
            },
        ];
        const F = Svgs[s.type].attrsComponent;
        return (
            <AccordionItem key={s.id}>
                <AccordionButton p={2}>
                    <Box as="span" flex="1" textAlign="left">
                        {Svgs[s.type].displayName}
                    </Box>
                    {globalAlerts.has(s.id) ? <MdError color="#D9534F" /> : ''}
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                    <RmgFields fields={field} />
                    <F
                        attrs={s.attrs}
                        id={s.id}
                        handleAttrsUpdate={(index, attrs) => {
                            dispatch(setSvgValue({ index: i, value: { ...s, attrs } }));
                            dispatch(removeGlobalAlert(s.id));
                        }}
                    />
                </AccordionPanel>
            </AccordionItem>
        );
    });

    return (
        <Box width="100%">
            <Flex p={2}>
                <Heading fontSize="x-large" p={2}>
                    Svgs
                </Heading>
            </Flex>
            <Accordion width="100%" allowMultiple>
                {...p}
            </Accordion>
        </Box>
    );
}
