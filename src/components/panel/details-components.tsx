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
    IconButton,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField, RmgLabel } from '@railmapgen/rmg-components';
import React from 'react';
import { MdArrowDownward, MdArrowUpward, MdCircle, MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../../redux';
import {
    addComponent,
    deleteComponent,
    setColor,
    setComponents,
    setComponentValue,
} from '../../redux/param/param-slice';
import { ComponentsType, ComponentsTypeOptions } from '../../constants/components';
import { openPaletteAppClip } from '../../redux/runtime/runtime-slice';
import { nanoid } from '../../util/helper';
import ColourUtil from './colour-util';

export function DetailsComponents() {
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { output },
    } = useRootSelector(state => state.runtime);
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

    const handleAddNewComponent = () => {
        dispatch(
            addComponent({
                id: nanoid(),
                label: nanoid(),
                type: 'text',
                defaultValue: 'text',
            })
        );
    };

    const handleMove = (index: number, d: number) => {
        const dest = index + d;
        if (dest >= 0 && dest < param.components.length) {
            dispatch(
                setComponents(
                    param.components
                        .filter((s, i) => i < Math.min(index, dest))
                        .concat(param.components[Math.max(index, dest)])
                        .concat(
                            param.components.filter((s, i) => i > Math.min(index, dest) && i < Math.max(index, dest))
                        )
                        .concat(param.components[Math.min(index, dest)])
                        .concat(param.components.filter((s, i) => i > Math.max(index, dest)))
                )
            );
        }
    };

    const p = param.components.map((c, index) => {
        const { id, label, type, defaultValue, value } = c;
        const field: RmgFieldsField[] = [
            {
                label: 'Label',
                type: 'input',
                value: label,
                onChange: v =>
                    dispatch(setComponentValue({ index: index, value: { ...c, label: v.replaceAll(' ', '') } })),
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
            {
                label: '',
                type: 'custom',
                oneLine: true,
                component: (
                    <>
                        <Button size="md" onClick={() => handleMove(index, -1)}>
                            <MdArrowUpward />
                        </Button>
                        <Button size="md" onClick={() => handleMove(index, 1)}>
                            <MdArrowDownward />
                        </Button>
                        <Button size="md" onClick={() => dispatch(deleteComponent(index))}>
                            <MdClose />
                        </Button>
                    </>
                ),
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

    const [isThemeRequested, setIsThemeRequested] = React.useState(false);
    React.useEffect(() => {
        if (isThemeRequested && output) {
            dispatch(setColor({ ...param.color!, defaultValue: output }));
            setIsThemeRequested(false);
        }
    }, [output?.toString()]);

    return (
        <Box width="100%">
            <Flex p={2}>
                <Heading p={2} fontSize="x-large" width="100%">
                    Variables
                </Heading>
                <Button onClick={handleAddNewComponent}>+</Button>
            </Flex>
            <Accordion width="100%" allowMultiple>
                {...p}
                {param.color ? (
                    <AccordionItem key="color">
                        <AccordionButton p={2}>
                            <Box as="span" flex="1" textAlign="left">
                                {param.color.label}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                            <RmgLabel label="Default Color">
                                <IconButton
                                    aria-label={t('Color')}
                                    color={param.color.defaultValue[3]}
                                    bg={param.color.defaultValue[2]}
                                    size="md"
                                    _hover={{ bg: ColourUtil.fade(param.color.defaultValue[2], 0.7) }}
                                    icon={<MdCircle />}
                                    onClick={() => {
                                        setIsThemeRequested(true);
                                        dispatch(openPaletteAppClip(param.color?.defaultValue));
                                    }}
                                />
                            </RmgLabel>
                        </AccordionPanel>
                    </AccordionItem>
                ) : undefined}
            </Accordion>
        </Box>
    );
}
