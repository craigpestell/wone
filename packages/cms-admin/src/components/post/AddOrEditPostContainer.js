import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import toastr from 'toastr';
import * as postAction from '../../store/actions/PostAction';
import * as authorAction from '../../store/actions/AuthorAction';
import PostForm from './PostForm'; // eslint-disable-line import/no-named-as-default
import SlateEditor from '../SlateEditor';
import { authorsFormattedForDropdown } from '../../store/selectors/selectors'; // eslint-disable-line import/no-named-as-default

export class AddOrEditPostContainer extends React.Component {
  constructor() {
    super();
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentDidMount() {
    this.props.action.getPostAction(this.props.match.params.id).catch(error => {
      toastr.error(error);
    });

    this.props.action.getAuthorsAction().catch(error => {
      toastr.error(error);
    });
  }

  handleSave(values) {
    const post = {
      id: values.id,
      title: values.name,
      watchHref: '/post/' + values._id,
      authorId: values.authorId,
      length: values.length,
      category: values.category,
    };

    this.props.action
      .savePostAction(post)
      .then(() => {
        toastr.success('Post saved');
        this.props.history.push('/posts');
      })
      .catch(error => {
        toastr.error(error);
      });
  }

  handleCancel(event) {
    event.preventDefault();
    this.props.history.replace('/posts');
  }

  render() {
    const { initialValues } = this.props;
    const heading = initialValues && initialValues.id ? 'Edit' : 'Add';
  console.log('initialValues: ', initialValues);
    return (
      <div className="container">
        <PostForm
          heading={heading}
          authors={this.props.authors}
          handleSave={this.handleSave}
          handleCancel={this.handleCancel}
          initialValues={this.props.initialValues}
        />
        {initialValues && <SlateEditor values={initialValues} />}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const postId = ownProps.match.params.id; //from the path '/post/:id'

  if (postId && state.selectedPostReducer.post && postId === state.selectedPostReducer.post._id) {
    return {
      initialValues: state.selectedPostReducer.post,
      authors: authorsFormattedForDropdown(state.authorReducer.authors),
    };
  } else {
    return {
      authors: authorsFormattedForDropdown(state.authorReducer.authors),
    };
  }
};

const mapDispatchToProps = dispatch => ({
  action: bindActionCreators({ ...authorAction, ...postAction }, dispatch),
});

AddOrEditPostContainer.propTypes = {
  action: PropTypes.object.isRequired,
  history: PropTypes.object,
  authors: PropTypes.array,
  initialValues: PropTypes.object,
  match: PropTypes.object.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(AddOrEditPostContainer);
