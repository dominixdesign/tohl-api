const { SchemaDirectiveVisitor } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const requiredRole = this.args.requires
    const originalResolve = field.resolve || defaultFieldResolver
    field.resolve = async function (...args) {
      const context = args[2]
      const user = context.user || {}
      const roles = user.roles || []
      const isAuthorized = roles.includes(requiredRole)
      const data = await originalResolve.apply(this, args)
      if (!isAuthorized) {
        return null
      }
      return data
    }
  }
}

module.exports = AuthDirective
