import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from 'react-fontawesome';
// import ReactCloudinaryUploader from './ReactCloudinaryUploader'
import Cloudinary from 'cloudinary';
import { Button } from '@slate-editor/components';

import { insertInlineImage } from './ImageUtils';

class ImageButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
    };
  }

  openCloudinaryWidget() {
    var widget = cloudinary.openUploadWidget({ 
      cloud_name: 'repn', upload_preset: 'jdkgdrgj'}, (error, result) => { 
        console.log('cloudinary widget result: ', result, '\n - err; ', error);
      });
  }
  render() {
    const { value, onChange, className, style, signingUrl, signingUrlHeaders, outerState, type } = this.props;
    return (
      <div style={{ display: 'inline-block' }}>
        <Button
          id={`slate-image-plugin-button-${outerState.uid}`}
          type={type}
          style={{ position: 'relative', ...style }}
          className={className}
          onClick={this.openCloudinaryWidget}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${this.state.progress}%`,
              opacity: 0.4,
              backgroundColor: !this.state.error ? '#000' : '#92063E',
            }}
          />
          <FontAwesome name="image" />
        </Button>
      </div>
    );
  }
}

export default ImageButton;
