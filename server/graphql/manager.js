const { gql, UserInputError } = require('apollo-server-express')
const db = require('../helpers/db')
const { team } = require('../helpers/dataLoaders')

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
      teams: [Team]
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
    Manager: {
      teams: async (parent) => {
        const teams = await db('manager_x_team')
          .select('teamid')
          .where('managerid', parent.id)
          .whereRaw('valid_from < now() and valid_to > now()')
        return team.loadMany(teams.map((t) => t.teamid))
      }
    },
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
