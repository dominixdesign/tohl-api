const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
input ManagerInput {
    username: String,
    mail: String
}
type Manager {
    id: Int!,
    username: String,
    mail: String
}
extend type Query {
  managers: [Manager]
  findManagers(filter: ManagerInput): [Manager]
  manager(id: ID!): Manager
}

`,
  resolvers: {
    Query: {
      managers: async () => db('manager').select('id','username','mail'),
      findManagers: async (_, args) => db('manager').where(args.filter).select('id','username','mail'),
      manager: async (_, args) => db('manager').where('id', args.id).select('id','username','mail')
    }
  }
}