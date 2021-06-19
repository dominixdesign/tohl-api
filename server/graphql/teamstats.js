const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { team } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    input TeamstatsFilter {
      season: String
      team: String
    }

    input TeamstatsOrderBy {
      column: String
      order: String
    }

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
      teamstats(
        filter: TeamstatsFilter!
        orderBy: [TeamstatsOrderBy]
      ): [Teamstats]
    }
  `,
  resolvers: {
    Teamstats: {
      team: (parent) => team.load(parent.teamid)
    },
    Query: {
      teamstats: async (_, args) => {
        const filter = {}
        if (args.filter.season) {
          filter.season = args.filter.season
        }
        if (args.filter.team) {
          filter.teamid = args.filter.team
        }
        return await db('teamstats')
          .where(filter)
          .orderBy(args.orderBy || 'teamid')
          .select()
      }
    }
  }
}
