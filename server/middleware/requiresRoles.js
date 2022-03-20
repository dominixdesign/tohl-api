module.exports = (roles) => async (resolve, parent, args, context, info) => {
  const { user } = context
  const resolved = await resolve(parent, args, context, info)
  if (user && user.roles && roles.every((role) => user.roles.includes(role))) {
    return resolved
  }
  return null
}
