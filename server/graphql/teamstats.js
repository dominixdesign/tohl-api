const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { team } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    input TeamstatsFilter {
      season: String
      team: String
      division: String
      conference: String
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
      teamstats(filter: TeamstatsFilter!, orderBy: [OrderBy]): [Teamstats]
    }
  `,
  resolvers: {
    Teamstats: {
      team: (parent) => team.load(parent.teamid)
    },
    Query: {
      teamstats: async (_, { filter, orderBy }) => {
        const where = {}
        if (filter.season) {
          where['teamstats.season'] = filter.season
        }
        if (filter.team) {
          where.teamid = filter.team
        }
        if (filter.division) {
          where['team.division'] = filter.division
        }
        if (filter.conference) {
          where['team.conference'] = filter.conference
        }
        return await db('teamstats')
          .where(where)
          .join(
            'team',
            function () {
              this.on('team.teamid', '=', 'teamstats.teamid')
              this.on('team.season', '=', 'teamstats.season')
            },
            'left'
          )
          .orderBy(orderBy || 'teamid')
          .select()
      }
    }
  }
}
