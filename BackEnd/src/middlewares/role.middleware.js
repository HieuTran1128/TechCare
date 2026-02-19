module.exports = (...roles) => {
  return (req, res, next) => {
    console.log('[RoleMiddleware] Checking authorization');
    console.log('[RoleMiddleware] Required roles:', roles);
    const userRole = req.user?.role?.toLowerCase();
    const normalizedRoles = roles.map(r => (typeof r === 'string' ? r.toLowerCase() : r));
    console.log('[RoleMiddleware] User role (normalized):', userRole);
    console.log('[RoleMiddleware] Normalized required roles:', normalizedRoles);
    
    if (!normalizedRoles.includes(userRole)) {
      console.log('[RoleMiddleware] DENIED - role not in allowed list');
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.log('[RoleMiddleware] ALLOWED - role matches');
    next();
  };
};