'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require('@slate-editor/utils');

var _ImageUtils = require('./ImageUtils');

var ImageKeyboardShortcut = function ImageKeyboardShortcut(event, change, editor) {
  if (_utils.keyboardEvent.isMod(event) && event.shiftKey && event.key === 'i') {
    return (0, _ImageUtils.forceClickUploadButton)(editor);
  }
  return;
};

exports.default = ImageKeyboardShortcut;