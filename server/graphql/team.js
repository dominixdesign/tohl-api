const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const managerLoader = require('../helpers/loaders/managerLoader')

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
      manager: (parent) => managerLoader.load(parent.manager)
    },
    Query: {
      teams: async () => db('team').select(),
      findTeams: async (_, args) => db('team').where(args.filter).select(),
      team: async (_, args) => db('team').where('teamid', args.teamid).select()
    }
  }
}
