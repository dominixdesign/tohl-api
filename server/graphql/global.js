const { gql } = require('apollo-server-express')

module.exports = {
  typeDefs: gql`
    directive @auth(requires: Role!) on FIELD_DEFINITION
    directive @ownTeam on FIELD_DEFINITION

    enum Role {
      ADMIN
      SIMULATOR
      GM
    }

    type Query {
      roles: [Role]
    }

    type Mutation {
      roles: Role
    }
  `,
  resolvers: {}
}
