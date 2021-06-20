const { gql } = require('apollo-server-express')
const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')

module.exports = {
  typeDefs: gql`
    directive @auth(requires: Role!) on FIELD_DEFINITION
    directive @ownTeam on FIELD_DEFINITION
    directive @managedTeam on FIELD_DEFINITION

    scalar Date

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
    })
  }
}
