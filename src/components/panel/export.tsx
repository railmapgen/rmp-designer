import React from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Param } from '../../constants/constants';
import svgs from '../svgs/svgs';

export const Export = (props: { isOpen: boolean; onClose: () => void; param: Param }) => {
    const { isOpen, onClose, param } = props;
    const { t } = useTranslation();

    const [code, setCode] = React.useState('');
    React.useEffect(() => {
        if (isOpen) {
            setCode(generateCode(param));
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text as="b" fontSize="xl">
                        Export
                    </Text>
                    <ModalCloseButton />
                </ModalHeader>

                <ModalBody>
                    <Textarea value={code} readOnly fontFamily="monospace" fontSize="xs" />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const imports =
    "import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';\nimport { MonoColour } from '@railmapgen/rmg-palette-resources';\nimport React from 'react';\nimport { useTranslation } from 'react-i18next';\nimport { AttrsProps, CityCode } from '../../../constants/constants';\nimport { MiscNodeType, Node, NodeComponentProps } from '../../../constants/nodes';\nimport { AttributesWithColor, ColorField } from '../../panels/details/color-field';";

const generateCode = (param: Param) => {
    const ClassName = param.id.charAt(0).toUpperCase() + param.id.slice(1);
    const className = param.id.charAt(0).toLowerCase() + param.id.slice(1);

    const variableGet = param.components
        .map(c => `\n        ${c.id} = default${ClassName}Attributes.${c.id},`)
        .concat(param.color ? `\n        color = default${ClassName}Attributes.color,` : '');
    // @ts-expect-error type
    const Svgs = String(param.svgs.map(s => '            ' + svgs[s.type].output(s)));

    return imports
        .concat(
            `\n\n const ${ClassName} = (props: NodeComponentProps<${ClassName}Attributes>) => {\n    const { id, x, y, attrs, handlePointerDown, handlePointerMove, handlePointerUp } = props;\n    const {`,
            ...variableGet,
            `\n    } = attrs ?? default${ClassName}Attributes;\n\n    const onPointerDown = React.useCallback(\n        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, e),\n        [id, handlePointerDown]\n    );\n    const onPointerMove = React.useCallback(\n        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, e),\n        [id, handlePointerMove]\n    );\n    const onPointerUp = React.useCallback(\n        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, e),\n        [id, handlePointerUp]\n    );\n\n    return (\n        <g\n            id={id}\n            transform={\`translate(\${x},\${y})\`}\n            onPointerDown={onPointerDown}\n            onPointerMove={onPointerMove}\n            onPointerUp={onPointerUp}\n            style={{ cursor: 'move' }}\n        >\n`,
            ...Svgs,
            `        </g>\n    );\n};\n`
        )
        .concat(
            `export interface ${ClassName}Attributes ${param.color ? 'extends AttributesWithColor' : ''} {`,
            ...param.components.map(c => `\n    ${c.id}: ${c.type};`),
            '\n}\n\n',
            `const default${ClassName}Attributes: ${ClassName}Attributes = {`,
            ...param.components.map(c => `\n    ${c.id}: ${c.defaultValue},`),
            param.color
                ? `\n    color: [${String().concat(...(param.color.defaultValue as string[]).map(s => `'${s}'`).join(', '))}],`
                : '',
            '\n};\n\n',
            `const attrsComponent = (props: AttrsProps<${ClassName}Attributes>) => {\n`,
            '    const { id, attrs, handleAttrsUpdate } = props;\n    const { t } = useTranslation();\n\n    const field: RmgFieldsField[] = [\n',
            ...param.components.map(
                c =>
                    `        {\n            type: '${c.type}',\n            label: '${c.label}',\n            value: attrs.${c.id}.toString(),\n            onChange: value => {\n                attrs.${c.id} = ${c.type === 'number' ? 'Number(value)' : 'value'};\n                handleAttrsUpdate(id, attrs);\n            },\n        },\n`
            ),
            param.color
                ? `        {\n            type: 'custom',\n            label: t('color'),\n            component: <ColorField type={MiscNodeType.${ClassName}} defaultTheme={default${ClassName}Attributes.color} />,\n        },\n`
                : '',
            '    ];\n    return <RmgFields fields={field} minW="full" />;\n};\n'
        );
};
