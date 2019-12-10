// ShopSettings are public by default. Here we add a permission check.
export default {
  async defaultTaxCode(settings, args, context) {
    await context.validatePermissions("reaction:taxes", "read", {
      shopId: settings.shopId,
      legacyRoles: ["admin", "tax-settings/write", "tax-settings/read"]
    });
    return settings.defaultTaxCode;
  },
  async fallbackTaxServiceName(settings, args, context) {
    await context.validatePermissions("reaction:taxes", "read", {
      shopId: settings.shopId,
      legacyRoles: ["admin", "tax-settings/write", "tax-settings/read"]
    });
    return settings.fallbackTaxServiceName;
  },
  async primaryTaxServiceName(settings, args, context) {
    await context.validatePermissions("reaction:taxes", "read", {
      shopId: settings.shopId,
      legacyRoles: ["admin", "tax-settings/write", "tax-settings/read"]
    });
    return settings.primaryTaxServiceName;
  }
};
