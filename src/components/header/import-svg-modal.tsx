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
import { defaultTransform, SvgsElem } from '../../constants/constants';
import { nanoid } from '../../util/helper';
import { useRootDispatch } from '../../redux';
import { setLabel, setSvgs, setTransform } from '../../redux/param/param-slice';

export const loadSvgs = (svgString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    function convertStyleStringToObject(style: any): Record<string, string> {
        if (typeof style === 'object') {
            return style;
        } else if (typeof style === 'string') {
            const styleObj: Record<string, string> = {};
            const styleArray = style.split(';');
            styleArray.forEach(item => {
                const [property, value] = item.split(':');
                if (property && value) {
                    const trimmedProperty = property.trim();
                    const trimmedValue = value.trim();
                    const camelCaseProperty = trimmedProperty.replace(/-([a-z])/g, (match, letter) =>
                        letter.toUpperCase()
                    );
                    styleObj[camelCaseProperty] = trimmedValue;
                }
            });
            return styleObj;
        }
        return {};
    }

    const dfs = (element: Element): SvgsElem => {
        const attributes: Record<string, string> = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name === 'style') {
                attributes[attr.name] = `3${JSON.stringify(convertStyleStringToObject(attr.value))}`;
            } else {
                attributes[attr.name] = `1"${attr.value.trim()}"`;
            }
        });

        if (element.tagName !== 'g' && element.textContent) {
            attributes['_rmp_children_text'] = `1"${element.textContent.trim()}"`;
        }

        const children: SvgsElem[] = [];
        Array.from(element.children).forEach(child => {
            children.push(dfs(child));
        });

        return {
            id: `id_${nanoid(10)}`,
            type: element.tagName,
            label: nanoid(5),
            attrs: attributes,
            children: children.length === 0 ? undefined : children,
        };
    };

    const svgRoot = doc.documentElement;
    const svgElements = dfs(svgRoot);
    console.log(svgElements);

    return svgElements.children ?? [];
};

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
        dispatch(setSvgs(loadSvgs(svgString)));
        dispatch(setLabel(`SVG ${nanoid(5)}`));
        dispatch(setTransform(defaultTransform));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('header.import.pasteSVG')}</ModalHeader>
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
};
