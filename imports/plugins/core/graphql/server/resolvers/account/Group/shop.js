/**
 * @name shop
 * @method
 * @summary gets the shop object for the provided group
 * @param {Object} group - result of the parent resolver, which is a Group object in GraphQL schema format
 * @param {Object} args - an object of all arguments that were sent by the client
 * @param {Object} context - an object containing the per-request state
 * @return {Promise<Object>} The shop having ID group.shopId, in GraphQL schema format
 */
export default async function shop(group, _, context) {
  const { shopId } = group;
  if (!shopId) return null;

  return context.queries.shopById(context, shopId);
}
