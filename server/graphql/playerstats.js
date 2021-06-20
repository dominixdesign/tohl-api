const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { team, player } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    input PlayerstatsFilter {
      season: String
      player: String
      team: String
    }

    type Playerstats {
      season: String!
      player: Player!
      team: Team!
      games: Int
      goals: Int
      assists: Int
      pointsplusminus: Int
      pim: Int
      shots: Int
      hits: Int
      icetime: Int
      ppg: Int
      ppa: Int
      shg: Int
      sha: Int
      streak_goals_current: Int
      streak_goals_longest: Int
      streak_points_current: Int
      streak_points_longest: Int
      fightswon: Int
      fightslose: Int
      fightsdraw: Int
      injuries: String
      ejections: String
      minutes: Int
      saves: Int
      shotsfaced: Int
      goalsagainst: Int
      first_stars: Int
      second_stars: Int
      third_stars: Int
    }

    extend type Query {
      playerstats(
        filter: PlayerstatsFilter!
        orderBy: [OrderBy]
        limit: Int
        offset: Int
      ): [Playerstats]
    }
  `,
  resolvers: {
    Playerstats: {
      team: (parent) => team.load(parent.team),
      player: (parent) => player.load(parent.player)
    },
    Query: {
      playerstats: async (_, { filter, orderBy, limit, offset }) => {
        const where = {}
        if (filter.season) {
          where.season = filter.season
        }
        if (filter.team) {
          where.team = filter.team
        }
        if (filter.player) {
          where.player = filter.player
        }
        return await db('playerstats')
          .where(filter)
          .orderBy(orderBy || 'player')
          .limit(limit || 100)
          .offset(offset || 0)
          .select()
      }
    }
  }
}
