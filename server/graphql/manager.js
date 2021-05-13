const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input ManagerInput {
      username: String
      mail: String
    }
    type Manager {
      id: Int!
      username: String
      mail: String
      roles: String
    }
    extend type Query {
      currentManager: Manager
      managers: [Manager]
      findManagers(filter: ManagerInput): [Manager]
      manager(id: ID!): Manager
    }
  `,
  resolvers: {
    Query: {
      currentManager: async (_parent, _args, { user }) => {
        if (!user.mail) return null
        return await db('manager').where('mail', user.mail).first()
      },
      managers: async () => db('manager').select(),
      findManagers: async (_, args) =>
        db('manager').where(args.filter).select(),
      manager: async (_, args) => db('manager').where('id', args.id).first()
    }
  }
}
