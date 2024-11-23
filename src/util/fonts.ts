import rmgRuntime from '@railmapgen/rmg-runtime';

export type FontFaceConfig = {
    source: string;
    descriptors?: FontFaceDescriptors;
};

const IdentityFont: FontFaceConfig = {
    source: 'url("./fonts/LTAIdentity-Medium.woff")',
    descriptors: { display: 'swap' },
};
const MPLUS2: FontFaceConfig = { source: 'url("./fonts/Mplus2-Medium.otf")', descriptors: { display: 'swap' } };
const Roboto: FontFaceConfig = { source: 'url("./fonts/Roboto-Bold.ttf")', descriptors: { display: 'swap' } };
const MontaguSlab: FontFaceConfig = { source: 'url("./fonts/MontaguSlab.ttf")', descriptors: { display: 'swap' } };
const Railway: FontFaceConfig = { source: 'url("./fonts/Railway-PlyE.otf")', descriptors: { display: 'swap' } };

const cssFont: Record<string, FontFaceConfig | undefined> = {
    'MyriadPro-Semibold': undefined,
    'Vegur-Bold': undefined,
    'GenYoMinTW-SB': undefined,
    IdentityFont,
    'M PLUS 2': MPLUS2,
    Roboto,
    MontaguSlab,
    Railway,
};
const cssName = ['fonts_mtr', 'fonts_mrt', 'fonts_jreast', 'fonts_berlin', 'fonts_tokyo', 'fonts_tube'];

const loadedFonts: string[] = [];
export const loadFontCss = async () => {
    await Promise.all(
        Object.entries(cssFont).map(([font, config]) => rmgRuntime.loadFont(font, config && { configs: [config] }))
    );
    cssName.forEach(name => {
        if (!loadedFonts.includes(name)) {
            loadedFonts.push(name);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.id = name;
            link.href = import.meta.env.BASE_URL + `styles/${name}.css`;
            document.head.append(link);
        }
    });
};
