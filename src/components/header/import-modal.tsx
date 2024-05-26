import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SvgsAttrs, SvgsType } from '../../constants/svgs';
import svgs from '../svgs/svgs';
import { Id, SvgsElem } from '../../constants/constants';
import { nanoid, roundToNearestN } from '../../util/helper';
import { addSvg } from '../../redux/param/param-slice';
import { useRootDispatch } from '../../redux';

export const ImportFromSvg = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const dispatch = useRootDispatch();

    const [svgString, setSvgString] = React.useState('');
    const field: RmgFieldsField[] = [
        {
            label: 'SVG',
            type: 'textarea',
            value: '',
            onChange: v => setSvgString(v),
        },
    ];

    const handleImport = () => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        for (const svgTag of Object.values(SvgsType)) {
            const elems = svgDoc.getElementsByTagName(svgTag);
            for (let i = 0; i < elems.length; i++) {
                const elem = elems[i];
                const id: Id = `id_${nanoid(10)}`;
                const x = elem.getAttribute(svgTag === 'circle' ? 'cx' : 'x') ?? '0';
                const y = elem.getAttribute(svgTag === 'circle' ? 'cy' : 'y') ?? '0';
                const attr = svgs[svgTag].inputFromSvg(elem);
                console.log(attr);
                const newElem: SvgsElem<SvgsAttrs[keyof SvgsAttrs]> = {
                    id,
                    type: svgTag,
                    x,
                    y,
                    attrs: attr,
                };
                dispatch(addSvg(newElem));
            }
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Import from SVG</ModalHeader>
                <ModalCloseButton />

                <ModalBody paddingBottom={10}>
                    <RmgFields fields={field} minW="full" />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button colorScheme="red" mr="1" onClick={handleImport}>
                        {t('apply')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}