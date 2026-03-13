/**
 * Sets req.tenantModels for database-per-tenant.
 * Run AFTER isLogin (admin) or auth middleware that sets req.userAuth.
 * When req.userAuth.schoolDbName exists, tenant models point to that school's database.
 * When missing (legacy admins), tenant models fall back to default connection for backward compatibility.
 */
const { getTenantModels } = require("../utils/tenantConnection");

function setTenantModels(req, res, next) {
  const schoolDbName = req.userAuth?.schoolDbName;
  if (schoolDbName) {
    req.tenantModels = getTenantModels(schoolDbName);
    req.schoolDbName = schoolDbName;
  } else {
    req.tenantModels = null;
    req.schoolDbName = null;
  }
  next();
}

module.exports = setTenantModels;
