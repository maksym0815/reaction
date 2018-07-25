import store from "store";
import Logger from "/client/modules/logger";
import Random from "@reactioncommerce/random";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Tracker } from "meteor/tracker";
import { SubsManager } from "meteor/meteorhacks:subs-manager";
import { Accounts, Cart } from "/lib/collections";
import Reaction from "./main";

export const Subscriptions = {};

// Subscription Manager
// See: https://github.com/kadirahq/subs-manager
Subscriptions.Manager = new SubsManager();

Subscriptions.Account = Subscriptions.Manager.subscribe("Accounts");

/*
 * Reaction.session
 * Create persistent sessions for users
 * The server returns only one record, so findOne will return that record
 * Stores into client session all data contained in server session
 * supports reactivity when server changes `newSession`
 * Stores the server session id into local storage / cookies
 *
 * Also localStorage session could be set from the client-side. This could
 * happen when user flush browser's cache, for example.
 * @see https://github.com/reactioncommerce/reaction/issues/609#issuecomment-166389252
 */

/**
 * General Subscriptions
 */

// Primary shop subscription
Subscriptions.PrimaryShop = Subscriptions.Manager.subscribe("PrimaryShop");

// Additional shop subscriptions
Subscriptions.MerchantShops = Subscriptions.Manager.subscribe("MerchantShops");

// This Packages subscription is used for the Active shop's packages
Subscriptions.Packages = Subscriptions.Manager.subscribe("Packages");

// This packages subscription is used for the Primary Shop's packages
// The Packages publication defaults to returning the primaryShopId's packages,
// so this subscription shouldn't ever need to be changed
// TODO: Consider how to handle routes for several shops which are all active at once
Subscriptions.PrimaryShopPackages = Subscriptions.Manager.subscribe("Packages");

Subscriptions.Tags = Subscriptions.Manager.subscribe("Tags");

Subscriptions.Groups = Subscriptions.Manager.subscribe("Groups");

Subscriptions.BrandAssets = Subscriptions.Manager.subscribe("BrandAssets");

const cartSubCreated = new ReactiveVar(false);
Tracker.autorun(() => {
  const userId = Meteor.userId();
  if (!userId) return;

  const account = Accounts.findOne({ userId });
  if (account) {
    Subscriptions.Cart = Subscriptions.Manager.subscribe("Cart", account._id);
    cartSubCreated.set(true);
  }
});

/**
 * Subscriptions that need to reload on new sessions
 */
Tracker.autorun(() => {
  // we are trying to track both amplify and Session.get here, but the problem
  // is - we can't track amplify. It just not tracked. So, to track amplify we
  // are using dirty hack inside Accounts.loginWithAnonymous method.
  const sessionId = store.get("Reaction.session");
  let newSession;
  Tracker.nonreactive(() => {
    newSession = Random.id();
  });
  if (typeof sessionId !== "string") {
    store.set("Reaction.session", newSession);
    Session.set("sessionId", newSession);
  }
  if (typeof Session.get("sessionId") !== "string") {
    Session.set("sessionId", store.get("Reaction.session"));
  }
  Subscriptions.Sessions = Meteor.subscribe("Sessions", Session.get("sessionId"));
});

Tracker.autorun(() => {
  Subscriptions.UserProfile = Meteor.subscribe("UserProfile", Meteor.userId());
});

Tracker.autorun(() => {
  // Need to wait until we have a user ID because createCart calls mergeCart which requires logged in user.
  // Without this, we'll get errors right after logout.
  const userId = Meteor.userId();
  if (userId && cartSubCreated.get() && Subscriptions.Cart.ready()) {
    const cartCount = Cart.find({}).count();
    const sessionId = Session.get("sessionId");
    if (cartCount === 0 && sessionId) {
      Meteor.call("cart/createCart", sessionId, (error) => {
        // cart-found error can happen due to timing issues. We don't worry about it
        // and assume that the account cart will get published to us soon.
        if (error && error.error !== "cart-found") {
          Logger.error(error.message);
        }
      });
    } else if (cartCount > 1) {
      Logger.warn("Multiple carts received. Expected just one.");
    }
  }
});

Tracker.autorun(() => {
  // Reload Packages sub if shopId changes
  // We have a persistent subscription to the primary shop's packages,
  // so don't refresh sub if we're updating to primaryShopId sub
  const shopId = Reaction.getShopId();
  if (shopId && shopId !== Reaction.getPrimaryShopId()) {
    Subscriptions.Packages = Subscriptions.Manager.subscribe("Packages", shopId);
  }
});
