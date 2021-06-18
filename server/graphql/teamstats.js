const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { team } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    type Teamstats {
      season: String!
      team: Team
      games: Int
      wins: Int
      loss: Int
      ties: Int
      points: Int
      goalsfor: Int
      goalsagainst: Int
      diff: Int
      winp: Float
      streak: String
      pp: Int
      ppg: Int
      pk: Int
      pkg: Int
      pim: Int
      shotsfor: Int
      shotsagainst: Int
    }
    extend type Query {
      teamstats(season: String!): [Teamstats]
    }
  `,
  resolvers: {
    Teamstats: {
      team: (parent) => team.load(parent.teamid)
    },
    Query: {
      teamstats: async (_, args) =>
        db('teamstats').where('season', args.season).select()
    }
  }
}
