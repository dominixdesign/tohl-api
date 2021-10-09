const { gql } = require('apollo-server-express')
const { GraphQLScalarType } = require('graphql')
const GraphQLJSON = require('graphql-type-json')
const { Kind } = require('graphql/language')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    directive @auth(requires: Role!) on FIELD_DEFINITION
    directive @ownTeam on FIELD_DEFINITION
    directive @managedTeam on FIELD_DEFINITION

    scalar Date
    scalar JSON

    enum Role {
      ADMIN
      SIMULATOR
      GM
    }

    input OrderBy {
      column: String
      order: String
    }

    input Limit {
      limit: Int
      offset: Int
    }

    type Query {
      roles: [Role]
      seasons: [String]
    }

    type Mutation {
      roles: Role
    }
  `,
  resolvers: {
    Date: new GraphQLScalarType({
      name: 'Date',
      description: 'Date custom scalar type',
      parseValue(value) {
        return new Date(value) // value from the client
      },
      serialize(value) {
        return value.getTime() // value sent to the client
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
          return parseInt(ast.value, 10) // ast value is always in string format
        }
        return null
      }
    }),
    JSON: GraphQLJSON,
    Query: {
      seasons: async () =>
        db('team')
          .groupBy('season')
          .select('season')
          .then((rows) => rows.map((r) => r.season))
    }
  }
}
