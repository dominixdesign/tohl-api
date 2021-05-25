const { SchemaDirectiveVisitor } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')

class TeamDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const originalResolve = field.resolve || defaultFieldResolver
    field.resolve = function (...args) {
      const { teamid } = args[1]
      const { ownTeam } = args[2]

      if (ownTeam !== teamid) {
        throw new Error(`you are not allowed to manipulate team "${teamid}"`)
      }
      return originalResolve.apply(this, args)
    }
  }
}

module.exports = TeamDirective
