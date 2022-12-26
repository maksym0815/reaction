/**
 * @summary Performs migration up from previous data version
 * @param {Object} context Migration context
 * @param {Object} context.db MongoDB `Db` instance
 * @param {Function} context.progress A function to report progress, takes percent
 *   number as argument.
 * @return {undefined}
 */
async function up({ db, progress }) {
  const affectedGroups = [
    "owner",
    "shop manager"
  ];

  const newShopPermissions = [
    "reaction:legacy:promotions/create",
    "reaction:legacy:promotions/read",
    "reaction:legacy:promotions/update",
    "reaction:legacy:promotions/preview"
  ];

  await db.collection("Groups").updateMany({
    slug: { $in: affectedGroups }
  }, {
    $addToSet: { permissions: { $each: newShopPermissions } }
  });

  progress(100);
}

export default {
  down: "impossible",
  up
};
