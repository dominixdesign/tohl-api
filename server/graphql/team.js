const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { manager } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    input TeamFilter {
      teamid: String
      teamsim: String
    }
    type Team {
      teamid: String!
      season: String
      teamsim: String
      manager: Manager
      full_name: String
    }
    extend type Query {
      teams: [Team]
      findTeams(filter: TeamFilter): [Team]
      team(teamid: ID!): Team
      myTeam: Team
    }
    extend type Mutation {
      updateTeam(teamid: String, full_name: String): Team @ownTeam
    }
  `,
  resolvers: {
    Team: {
      manager: (parent) => manager.load(parent.manager)
    },
    Query: {
      teams: async () => db('team').select(),
      findTeams: async (_, args) => db('team').where(args.filter).select(),
      team: async (_, args) => db('team').where('teamid', args.teamid).select(),
      myTeam: async (_, _args, { validTeams }) =>
        db('team').where('teamid', validTeams[0]).first()
    },
    Mutation: {
      updateTeam: async (_, { teamid, full_name }) => {
        await db('team').where('teamid', teamid).update({
          full_name
        })
        return await db('team').where('teamid', teamid).first()
      }
    }
  }
}
