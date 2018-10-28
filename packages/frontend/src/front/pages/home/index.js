// @flow

// #region imports
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import compose from 'recompose/compose';
import Home from './Home';
import withEnterAnimation from '../../hoc/withEnterAnimation';
import auth from '../../services/auth';
import { authActions } from '../../redux/modules/auth';

// #endregion

// #region redux map state and dispatch to props
const mapStateToProps = ({ auth }) => ({
  auth,
});

const mapDispatchToProps = dispatch => {
  return bindActionCreators({ authActions }, dispatch);
};
// #endregion

export default compose(
  withEnterAnimation(/* no option yet */),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(Home);
