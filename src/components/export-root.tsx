import React from 'react';
import { Preview } from './panel/preview';

const ExportRoot = () => {
    return <Preview isOpen={true} onClose={() => {}} exportMode={true} />;
};

export default ExportRoot;
