const { gql, UserInputError } = require('apollo-server-express')
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
      mail: String @auth(requires: GM)
      roles: String @auth(requires: ADMIN)
    }

    extend type Query {
      currentManager: Manager
      managers: [Manager]
      findManagers(filter: ManagerInput): [Manager]
      manager(id: ID!): Manager
    }

    extend type Mutation {
      updateUserdata(username: String, mail: String): Manager
        @auth(requires: GM)
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
    },
    Mutation: {
      updateUserdata: async (_, { username, mail }, { user }) => {
        const re = /\S+@\S+\.\S+/
        if (!re.test(mail)) {
          throw new UserInputError('Invalid email address')
        }
        await db('manager').where('id', user.userid).update({
          username,
          mail
        })
        return await db('manager').where('id', user.userid).select()
      }
    }
  }
}
