export function dashboardPath(role) {
  if (role === "VENDOR") return "/vendor";
  if (role === "SUPERADMIN") return "/admin";
  return "/";
}
