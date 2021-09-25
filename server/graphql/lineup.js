const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input LineupFilter {
      team: String
      player: String
      gameday: Int
      game: Int
      season: String
    }

    type Lineup {
      season: String!
      game: Int!
      player: Player
      team: Team
      goals: Int
      assists: Int
      points: Int
      plusminus: Int
      pim: Int
      shots: Int
      hits: Int
      icetime: Int
      fightswon: Int
      fightslose: Int
      fightsdraw: Int
      injured: String
      ejected: String
      minutes: Int
      saves: Int
      shotsfaced: Int
      goalsagainst: Int
      star: String
      line: String
    }
    extend type Query {
      lineup(
        filter: LineupFilter!
        where: [[String]]
        orderBy: [OrderBy]
        limit: Int
        offset: Int
      ): [Lineup]
    }
  `,
  resolvers: {
    Lineup: {
      team: (parent, _, { loader: { team } }) => team.load(parent.team),
      player: (parent, _, { loader: { player } }) => player.load(parent.player)
    },
    Query: {
      lineup: async (_, { filter, orderBy, limit, offset, where }) =>
        db('lineup')
          .modify((queryBuilder) => {
            if (filter) {
              queryBuilder.where(filter)
            }
            if (where) {
              for (const entry of where) {
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
