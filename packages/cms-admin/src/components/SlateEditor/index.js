import React from 'react';
import { SlateEditor, SlateToolbar, SlateContent } from 'slate-editor';
import { BoldPlugin, BoldButton } from '@slate-editor/bold-plugin';

import { ImagePlugin, ImageButton } from '../../../packages/cloudinary-image-plugin';

const plugins = [ImagePlugin(), BoldPlugin()];
// https://471417893385355:9L0ILe9lSoMwtNhOarFYLLu1z5o@api.cloudinary.com/v1_1/repn/resources/image

const SlateRichTextEditor = () => (
  <SlateEditor plugins={plugins}>
    <SlateToolbar>
      <BoldButton />
      <ImageButton
        signingUrl={process.env.CLOUDINARY_URL + process.env.CLOUDINARY_ENDPOINT}
        signingUrlHeaders={{ 'Access-Control-Allow-Origin': '*' }} />
    </SlateToolbar>

    <SlateContent />
  </SlateEditor>
);

export default SlateRichTextEditor;
