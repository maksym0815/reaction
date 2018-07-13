import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  injectStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
  PostalCodeElement
} from "react-stripe-elements";
import { Meteor } from "meteor/meteor";
import { i18next, Router } from "client/api";

class CardForm extends Component {
  static propTypes = {
    cartId: PropTypes.string,
    postal: PropTypes.string,
    stripe: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = {
      cardNumberErrorMessage: "",
      CVVErrorMessage: "",
      errorMessage: "",
      expDateErrorMessage: "",
      postal: props.postal,
      postalErrorMessage: "",
      submitMessage: "Complete your order",
      submitting: false
    };

    /* eslint-disable camelcase */
    this.errorCodes = {
      card_declined: i18next.t("checkout.errorMessages.cardDeclined"),
      country_unsupported: i18next.t("checkout.errorMessages.countryUnsupported"),
      expired_card: i18next.t("checkout.errorMessages.expiredCard"),
      incomplete_cvc: i18next.t("checkout.errorMessages.incompleteCVC"),
      incomplete_expiry: i18next.t("checkout.errorMessages.incompleteExpiry"),
      incomplete_number: i18next.t("checkout.errorMessages.incompleteNumber"),
      incomplete_zip: i18next.t("checkout.errorMessages.incompleteZIP"),
      incorrect_cvc: i18next.t("checkout.errorMessages.incorrectCVC"),
      incorrect_number: i18next.t("checkout.errorMessages.incorrectNumber"),
      incorrect_zip: i18next.t("checkout.errorMessages.incorrectZIP"),
      invalid_cvc: i18next.t("checkout.errorMessages.invalidCVC"),
      invalid_expiry_month: i18next.t("checkout.errorMessages.invalidExpiryMonth"),
      invalid_expiry_year: i18next.t("checkout.errorMessages.invalidExpiryYear"),
      invalid_expiry_month_past: i18next.t("checkout.errorMessages.incompleteExpiryMonthPast"),
      invalid_expiry_year_past: i18next.t("checkout.errorMessages.incompleteExpiryYearPast"),
      invalid_number: i18next.t("checkout.errorMessages.invalidNumber"),
      postal_code_invalid: i18next.t("checkout.errorMessages.postalCodeInvalid"),
      state_unsupported: i18next.t("checkout.errorMessages.stateUnsupported"),
      whoops: i18next.t("checkout.errorMessages.whoops")
    };
  }

  handleSubmit = (ev) => {
    const { cardNumberErrorMessage, expDateErrorMessage, CVVErrorMessage, postalErrorMessage } = this.state;
    const { stripe, cartId } = this.props;
    const resubmitMessage = "Resubmit payment";
    ev.preventDefault();

    if (cardNumberErrorMessage || expDateErrorMessage || CVVErrorMessage || postalErrorMessage) {
      return;
    }

    this.setState({
      submitMessage: "Submitting...",
      submitting: true
    });
    if (stripe) {
      stripe.createToken().then((payload) => {
        if (payload.error) {
          this.setState({
            errorMessage: "",
            submitMessage: resubmitMessage,
            submitting: false
          });
          // Do not duplicate field validation errors
          if (payload.error.type !== "validation_error") {
            this.setState({ errorMessage: payload.error.message });
          }
          return;
        }
        Meteor.apply("stripe/payment/createCharges", ["authorize", payload.token, cartId], {
          wait: true,
          onResultReceived: (error, result) => {
            if (error || (result && result.error)) {
              this.setState({
                errorMessage: this.errorCodes[result.error.code] ? this.errorCodes[result.error.code] : result.error.whoops,
                submitMessage: resubmitMessage,
                submitting: false
              });
            } else {
              Router.go("cart/completed", {}, {
                _id: cartId
              });
            }
          }
        });
        return;
      }).catch(() => {
        this.setState({
          errorMessage: "Something went wrong. Please try again.",
          submitMessage: resubmitMessage,
          submitting: false
        });
        return;
      });
    }
    return;
  };

  changeHasError = (change) => (change && change.error);

  handleCardNumberChange = (change) => {
    if (this.changeHasError(change)) {
      this.setState({ cardNumberErrorMessage: this.errorCodes[change.error.code] ? this.errorCodes[change.error.code] : change.error.message });
    } else {
      this.setState({ cardNumberErrorMessage: "" });
    }
  }

  handleExpDateChange = (change) => {
    if (this.changeHasError(change)) {
      this.setState({ expDateErrorMessage: this.errorCodes[change.error.code] ? this.errorCodes[change.error.code] : change.error.message });
    } else {
      this.setState({ expDateErrorMessage: "" });
    }
  }

  handleCVVChange = (change) => {
    if (this.changeHasError(change)) {
      this.setState({ CVVErrorMessage: this.errorCodes[change.error.code] ? this.errorCodes[change.error.code] : change.error.message });
    } else {
      this.setState({ CVVErrorMessage: "" });
    }
  }

  handlePostalChange = (change) => {
    if (change && change.value !== undefined) {
      this.setState({ postal: change.value });
    }
    if (this.changeHasError(change)) {
      this.setState({ postalErrorMessage: this.errorCodes[change.error.code] ? this.errorCodes[change.error.code] : change.error.message });
    } else {
      this.setState({ postalErrorMessage: "" });
    }
  }

  displayErrorMessage = () => {
    const { errorMessage } = this.state;
    if (errorMessage) {
      return (<div className="alert alert-danger">{errorMessage}</div>);
    }
    return null;
  }

  render() {
    const style = {
      base: {
        "fontSize": "14px",
        "color": "#595959",
        "fontFamily": "'Source Sans Pro', sans-serif",
        "fontWeight": "400",
        "lineHeight": "1.42857143",
        "::placeholder": {
          color: "#999999"
        }
      },
      invalid: {
        color: "#eb4d5c"
      }
    };
    const {
      cardNumberErrorMessage,
      expDateErrorMessage,
      CVVErrorMessage,
      postal,
      postalErrorMessage,
      submitMessage,
      submitting
    } = this.state;

    return (
      <form onSubmit={this.handleSubmit}>
        {/* eslint-disable jsx-a11y/label-has-for */}
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label
                className={cardNumberErrorMessage ? "stripe-label-error" : ""}
                data-i18n="checkout.formLabels.cardNumber"
              >
                Card number
              </label>
              <CardNumberElement
                style={style}
                placeholder="XXXX XXXX XXXX XXXX"
                className="stripe-card-element"
                onChange={this.handleCardNumberChange}
              />
              <span className="help-block stripe-help-block">{cardNumberErrorMessage}</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-6">
            <div className="form-group">
              <label
                className={expDateErrorMessage ? "stripe-label-error" : ""}
                data-i18n="checkout.formLabels.expDate"
              >
                Expiry date
              </label>
              <CardExpiryElement
                style={style}
                className="stripe-card-element"
                onChange={this.handleExpDateChange}
              />
              <span className="help-block stripe-help-block">{expDateErrorMessage}</span>
            </div>
          </div>
          <div className="col-xs-6">
            <div className="form-group">
              <label
                className={CVVErrorMessage ? "stripe-label-error" : ""}
                data-i18n="checkout.formLabels.CVV"
              >
                CVV
              </label>
              <CardCVCElement
                style={style}
                placeholder="CVV"
                className="stripe-card-element"
                onChange={this.handleCVVChange}
              />
              <span className="help-block stripe-help-block">{CVVErrorMessage}</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <label
                className={postalErrorMessage ? "stripe-label-error" : ""}
                data-i18n="checkout.formLabels.postalCode"
              >
                Postal code
              </label>
              <PostalCodeElement
                style={style}
                className="stripe-card-element"
                onChange={this.handlePostalChange}
                value={postal}
              />
              <span className="help-block stripe-help-block">{postalErrorMessage}</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            { this.displayErrorMessage() }
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <button className="rui btn btn-lg btn-cta btn-block btn-complete-order" disabled={submitting}>
              { submitMessage }
            </button>
          </div>
        </div>
      </form>
    );
  }
}

export default injectStripe(CardForm);
