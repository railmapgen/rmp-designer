import { Badge, IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import React, { useState } from 'react';
import { MdDownload, MdOutput, MdSave } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRootSelector } from '../../redux';
import { downloadAs } from '../../util/helper';
import { Preview } from '../panel/preview';

export default function ExportActions() {
    const { t } = useTranslation();
    const param = useRootSelector(state => state.param);

    const [openExport, setOpenExport] = useState(false);

    return (
        <>
            <Menu id="download">
                <MenuButton as={IconButton} size="sm" variant="ghost" icon={<MdDownload />} />
                <MenuList>
                    <MenuItem
                        icon={<MdSave />}
                        onClick={() => {
                            downloadAs(
                                `RMP-Designer_${new Date().valueOf()}.json`,
                                'application/json',
                                JSON.stringify(param)
                            );
                        }}
                    >
                        {t('header.export.download')}
                    </MenuItem>
                    <MenuItem icon={<MdOutput />} onClick={() => setOpenExport(true)}>
                        {t('header.export.export')}
                        <Badge ml="1" colorScheme="green">
                            RMP
                        </Badge>
                    </MenuItem>
                </MenuList>
            </Menu>
            <Preview isOpen={openExport} onClose={() => setOpenExport(false)} />
        </>
    );
}
