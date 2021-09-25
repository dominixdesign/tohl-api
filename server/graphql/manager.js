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
      teams: [Team]
    }

    type Managerterm {
      manager: Manager
      team: Team
      valid_from: Date
      valid_to: Date
      type: String
    }

    extend type Query {
      currentManager: Manager
      managers: [Manager]
      findManagers(filter: ManagerInput): [Manager]
      manager(id: ID!): Manager
      myTerms: [Managerterm]
    }

    extend type Mutation {
      updateUserdata(username: String, mail: String): Manager
        @auth(requires: GM)
      addReplacement(
        userid: ID!
        teamid: ID!
        valid_from: Date!
        valid_to: Date!
      ): String @auth(requires: ADMIN) @ownTeam
    }
  `,
  resolvers: {
    Manager: {
      teams: async (parent, _, { loader: { team } }) => {
        const teams = await db('manager_x_team')
          .select('teamid')
          .where('managerid', parent.id)
          .whereRaw('valid_from < now() and valid_to > now()')
        return team.loadMany(teams.map((t) => t.teamid))
      }
    },
    Managerterm: {
      manager: (parent, _, { loader: { manager } }) =>
        manager.load(parent.managerid),
      team: (parent, _, { loader: { team } }) => team.load(parent.teamid)
    },
    Query: {
      currentManager: async (_parent, _args, { user }) => {
        if (!user.mail) return null
        return await db('manager').where('mail', user.mail).first()
      },
      managers: async () => db('manager').select(),
      findManagers: async (_, args) =>
        db('manager').where(args.filter).select(),
      manager: async (_, args) => db('manager').where('id', args.id).first(),
      myTerms: async (_, _args, { user }) =>
        db('manager_x_team').where('managerid', user.userid).select()
    },
    Mutation: {
      addReplacement: async (_, { userid, valid_from, valid_to, teamid }) => {
        try {
          await db('manager_x_team').insert({
            managerid: userid,
            teamid,
            valid_from,
            valid_to
          })
          return 'OK'
        } catch (e) {
          return e.code
        }
      },
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
