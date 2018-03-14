import React, { Component } from "react";
import PropTypes from "prop-types";
import { Components, registerComponent } from "@reactioncommerce/reaction-components";

class AddressBook extends Component {
  static propTypes = {
    account: PropTypes.object, // might only need the accountId
    addressBook: PropTypes.array, // array of address objects
    heading: PropTypes.object, // { defaultValue: String, i18nKey: String, checkout: Object }
    removeAddress: PropTypes.func, // remove address reducer calls meteor method
    updateAddress: PropTypes.func // update address reducer calls meteor method
  }

  state = {
    entryMode: (this.props.addressBook.length === 0), // no address enable the form
    editAddress: {} // address to be edited.
  }

  componentWillReceiveProps(nextProps) {
    const { addressBook } = nextProps;
    const { entryMode } = this.state;

    if (addressBook.length === 0 && !entryMode) {
      this.setState({ entryMode: true });
    }
  }

  /**
   * @method findAddres
   * @summary using the provided _id finds an address object from the addressBook array.
   * @since 2.0.0
   * @param {String} _id - address object _id
   * @return {Object} - address object.
   */
  findAddress(_id) {
    const { addressBook } = this.props;
    return addressBook.find((addy) => addy._id === _id);
  }

  // Address Actions

  /**
   * @method onSelect
   * @summary updating an address if it's been selected as the default shipping or billing address.
   * @since 2.0.0
   * @param {String} _id - address object _id
   * @param {String} usage - the address usage "shipping" or "billing"
   * @return {Object} - contains the component for updating a user's address.
   */
  onSelect = (_id, usage) => {
    const { updateAddress } = this.props;
    const address = this.findAddress(_id);
    switch (usage) {
      case "shipping":
        updateAddress(address, "isShippingDefault");
        break;
      case "billing":
        updateAddress(address, "isBillingDefault");
        break;
      default:
        return;
    }
  }

  /**
   * @method onRemove
   * @summary using the provided _id to call the removeAddress reducer that removes an address.
   * @since 2.0.0
   * @param {String} _id - address object _id
   */
  onRemove = (_id) => {
    const { removeAddress } = this.props;
    removeAddress(_id);
  }

  // Address Book Actions

  /**
   * @method toggleEntryMode
   * @summary toggles the entryMode state.
   * @since 2.0.0
   */
  toggleEntryMode = () => {
    console.log("toggle entry mode")
    const { entryMode } = this.state;
    this.setState({ entryMode: !entryMode });
  }

  onEdit = (_id) => {
    console.log("on edit", _id);
    const editAddress = this.findAddress(_id);
    this.setState({ editAddress });
    this.toggleEntryMode();
  }

  // Address Book JSX

  // rendering the checkout step icon
  renderCheckoutIcon() {
    const { checkout: { icon, position } } = this.props.heading;
    return <i className={`checkout-step-badge ${icon}`} >{position}</i>;
  }

  // rendering the address book heading
  // this content will change based on where
  // in the app this component is being used
  renderHeading() {
    const { heading } = this.props;
    return (
      <div className="panel-heading">
        {heading.checkout ? this.renderCheckoutIcon() : ""}
        <h2 className="panel-title">
          <Components.Translation {...heading} />
        </h2>
      </div>
    );
  }

  // rendering the address book control bar
  renderControlBar() {
    const { entryMode, editAddress } = this.state;

    let controlBarContent;
    if (entryMode && Object.keys(editAddress).length === 0) {
      controlBarContent = (<span>Add a new address entry</span>);
    } else if (entryMode && Object.keys(editAddress).length !== 0) {
      controlBarContent = (<span>Editing this addres entry</span>);
    } else {
      controlBarContent = (
        <button className="btn btn-default" onClick={this.toggleEntryMode}>
          <i className="fa fa-plus fa-lg address-icons" />
          <span data-i18n="addressBookGrid.addAddress">Add Address</span>
        </button>
      );
    }

    return (
      <div className="panel-control-bar">
        {controlBarContent}
      </div>
    );
  }

  // render address book content
  renderContent() {
    const { addressBook } = this.props;
    const { editAddress, entryMode } = this.state;

    return (
      <div className="panel-body panel-content">
        {
          (entryMode) ? <Components.AddressBookForm editAddress={editAddress} /> : <Components.AddressBookGrid addressBook={addressBook} select={this.onSelect} remove={this.onRemove} edit={this.onEdit} />
        }
      </div>
    );
  }

  render() {
    console.log("React AddressBookContainer", this.props, this.state);
    return (
      <div className="panel panel-default panel-address-book">
        {this.renderHeading()}
        <div className="address-book">
          {this.renderControlBar()}
          {this.renderContent()}
        </div>
      </div>
    );
  }
}

registerComponent("AddressBook", AddressBook);

export default AddressBook;
