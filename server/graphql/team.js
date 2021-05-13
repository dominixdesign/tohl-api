const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

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
    }
    extend type Query {
      teams: [Team]
      findTeams(filter: TeamFilter): [Team]
      team(teamid: ID!): Team
    }
  `,
  resolvers: {
    Team: {
      manager: (parent) => db('manager').where('id', parent.manager).first()
    },
    Query: {
      teams: async () => db('team').select(),
      findTeams: async (_, args) => db('team').where(args.filter).select(),
      team: async (_, args) => db('team').where('teamid', args.teamid).select()
    }
  }
}
