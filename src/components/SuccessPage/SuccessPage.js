import React from 'react';
import './SuccessPage.css';
import Logo from './../Logo/Logo';
import Hand from './../Hand/Hand';
import PropTypes from 'prop-types';

const SuccessPage = props => {
  return (
    <div className="page" onClick={() => props.history.replace('/')}>
      <Logo />
      <div className="text text-remindersent">Reminder sent!</div>
      <div className="success-hand">
        <Hand snack={props.storeList[props.actualItem].image} />
      </div>
    </div>
  );
};

SuccessPage.propTypes = {
  history: PropTypes.object.isRequired,
  actualItem: PropTypes.string.isRequired,
  storeList: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default SuccessPage;
