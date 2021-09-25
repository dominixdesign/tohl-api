const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

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
      points: Int
      plusminus: Int
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
        where: JSON
        orderBy: [OrderBy]
        limit: Int
        offset: Int
      ): [Playerstats]
    }
  `,
  resolvers: {
    Playerstats: {
      team: (parent, _, { loader: { team } }) => team.load(parent.team),
      player: (parent, _, { loader: { player } }) => player.load(parent.player)
    },
    Query: {
      playerstats: async (_, { orderBy, limit, offset, where }) => {
        return await db('playerstats')
          .join(
            'playerdata',
            function () {
              this.on('playerdata.playerid', '=', 'playerstats.player')
              this.on('playerdata.season', '=', 'playerstats.season')
            },
            'left'
          )
          .modify((queryBuilder) => {
            if (where) {
              for (const entry of JSON.parse(where)) {
                queryBuilder.where(entry[0], entry[1], entry[2])
              }
            }
          })
          .orderBy(orderBy || 'player')
          .limit(limit || 100)
          .offset(offset || 0)
          .select()
      }
    }
  }
}
