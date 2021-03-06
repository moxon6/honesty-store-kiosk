import React, {Component} from 'react';
import './SuccessPage.css';
import Hand from './../Hand/Hand';
import PropTypes from 'prop-types';

class SuccessPage extends Component {
  componentDidMount() {
    this.timeout = setTimeout(() => this.props.history.replace('/'), 10000);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  goHomeAndClearTimeout = () => {
    clearTimeout(this.timeout);
    this.props.history.replace('/');
  };

  render() {
    return (
      <div className="page" onClick={this.goHomeAndClearTimeout}>
        <div id="success-message" className="text text-remindersent">
          Reminder sent!
        </div>
        <Hand snack={this.props.storeList[this.props.actualItem].image} />
      </div>
    );
  }
}
SuccessPage.propTypes = {
  history: PropTypes.object.isRequired,
  actualItem: PropTypes.string.isRequired,
  storeList: PropTypes.object.isRequired
};

export default SuccessPage;
