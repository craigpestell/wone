import { Editor, getEventRange, getEventTransfer } from 'slate-react';
import { Block, Value } from 'slate';
import Html from 'slate-html-serializer'

import React from 'react';
import initialValueMock from './value.json';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import styled from 'react-emotion';
import { Button, Icon, Toolbar } from '../../components';


const BLOCK_TAGS = {
  blockquote: 'quote',
  p: 'paragraph',
  pre: 'code',
};

// Add a dictionary of mark tags.
const MARK_TAGS = {
  em: 'italic',
  strong: 'bold',
  u: 'underline',
}
const rules = [
  {
    deserialize(el, next) {
      const type = BLOCK_TAGS[el.tagName.toLowerCase()]
      if (type) {
        return {
          object: 'block',
          type: type,
          data: {
            className: el.getAttribute('class'),
          },
          nodes: next(el.childNodes),
        }
      }
    },
    serialize(obj, children) {
      if (obj.object == 'block') {
        switch (obj.type) {
          case 'code':
            return (
              <pre>
                <code>{children}</code>
              </pre>
            )
          case 'paragraph':
            return <p className={obj.data.get('className')}>{children}</p>
          case 'quote':
            return <blockquote>{children}</blockquote>
        }
      }
    },
  },
  // Add a new rule that handles marks...
  {
    deserialize(el, next) {
      const type = MARK_TAGS[el.tagName.toLowerCase()]
      if (type) {
        return {
          object: 'mark',
          type: type,
          nodes: next(el.childNodes),
        }
      }
    },
    serialize(obj, children) {
      if (obj.object == 'mark') {
        switch (obj.type) {
          case 'bold':
            return <strong>{children}</strong>
          case 'italic':
            return <em>{children}</em>
          case 'underline':
            return <u>{children}</u>
        }
      }
    },
  },
]

// Create a new serializer instance with our `rules` from above.
const html = new Html({ rules })

// Define a React component renderer for our code blocks.
function CodeNode(props) {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
}

/**
 * A styled image block component.
 *
 * @type {Component}
 */

const Image = styled('img')`
  display: block;
  max-width: 100%;
  max-height: 20em;
  box-shadow: ${props => (props.selected ? '0 0 0 2px blue;' : 'none')};
`;

/*
 * A function to determine whether a URL has an image extension.
 *
 * @param {String} url
 * @return {Boolean}
 */

function isImage(url) {
  return !!imageExtensions.find(url.endsWith);
}

/**
 * A change function to standardize inserting images.
 *
 * @param {Change} change
 * @param {String} src
 * @param {Range} target
 */

function insertImage(change, src, target) {
  if (target) {
    change.select(target);
  }

  change.insertBlock({
    type: 'image',
    data: { src },
  });
}

/**
 * The editor's schema.
 *
 * @type {Object}
 */

const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (change, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph');
          return change.insertNodeByKey(node.key, node.nodes.size, paragraph);
        }
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
  },
};


// Load the initial value from Local Storage or a default.
const initialValue = localStorage.getItem('content') || initialValueMock;

/**
 * The images example.
 *
 * @type {Component}
 */

class Images extends React.Component {
  /**
   * Deserialize the raw initial value.
   *
   * @type {Object}
   */

  state = {
    value: html.deserialize(initialValue),
  };

  /**
   * Store a reference to the `editor`.
   *
   * @param {Editor} editor
   */

  ref = editor => {
    this.editor = editor;
  };

  /**
   * Render the app.
   *
   * @return {Element} element
   */

  render() {
    console.log('props: ', this.props);
    const St = styled('pre')`
      background-color: grey;
`;

    return (
      <div>
        <Toolbar>
          <Button onMouseDown={this.onClickImage}>
            <Icon>image</Icon>
          </Button>
        </Toolbar>
        <Editor
          placeholder="Enter some text..."
          ref={this.ref}
          value={this.state.value}
          schema={schema}
          onChange={this.onChange}
          onDrop={this.onDropOrPaste}
          onPaste={this.onDropOrPaste}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          onKeyDown={this.onKeyDown}
        />
        <St>{JSON.stringify(this.state.value, undefined, 2)}</St>
      </div>
    );
  };

  /**
   * Render a Slate node.
   *
   * @param {Object} props
   * @return {Element}
   */

  renderNode = (props, next) => {
    const { node } = props;
    switch (props.node.type) {
      case 'code':
        return (
          <pre {...props.attributes}>
            <code>{props.children}</code>
          </pre>
        )
      case 'paragraph':
        return (
          <p {...props.attributes} className={node.data.get('className')}>
            {props.children}
          </p>
        )
      case 'quote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>
      default:
        return next()
    }
  }
  // Add a `renderMark` method to render marks.
  renderMark = (props, next) => {
    const { mark, attributes } = props
    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{props.children}</strong>
      case 'italic':
        return <em {...attributes}>{props.children}</em>
      case 'underline':
        return <u {...attributes}>{props.children}</u>
      default:
        return next()
    }
  }
  /**
   * On change.
   *
   * @param {Change} change
   */

  onChange = ({ value }) => {
    // When the document changes, save the serialized HTML to Local Storage.
    if (value.document != this.state.value.document) {
      const string = html.serialize(value)
      localStorage.setItem('content', string)
    }

    this.setState({ value })
  };

  /**
   * On clicking the image button, prompt for an image and insert it.
   *
   * @param {Event} event
   */

  onClickImage = event => {
    event.preventDefault();
    const src = window.prompt('Enter the URL of the image:');
    if (!src) return;
    this.editor.change(insertImage, src);
  };

  onKeyDown = (event, change, next) => {
    console.log('onKeyDown');
    if (event.key != '`' || !event.ctrlKey) return next();
    event.preventDefault();
    // Determine whether any of the currently selected blocks are code blocks.
    const isCode = change.value.blocks.some(block => block.type == 'code');

    // Toggle the block type depending on `isCode`.
    change.setBlocks(isCode ? 'paragraph' : 'code');
    return true;
  };

  /**
   * On drop, insert the image wherever it is dropped.
   *
   * @param {Event} event
   * @param {Change} change
   * @param {Function} next
   */

  onDropOrPaste = (event, change, next) => {
    const { editor } = change;
    const target = getEventRange(event, editor);
    if (!target && event.type === 'drop') return next();

    const transfer = getEventTransfer(event);
    const { type, text, files } = transfer;

    if (type === 'files') {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split('/');
        if (mime !== 'image') continue;

        reader.addEventListener('load', () => {
          editor.change(c => {
            c.call(insertImage, reader.result, target);
          });
        });

        reader.readAsDataURL(file);
      }
      return;
    }

    if (type === 'text') {
      if (!isUrl(text)) return next();
      if (!isImage(text)) return next();
      change.call(insertImage, text, target);
      return;
    }

    next();
  };
}

/**
 * Export.
 */

export default Images;
