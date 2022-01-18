const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    type Penalty {
      season: String
      game: Game
      player: Player
      team: Team
      period: Int
      minutes: Int
      seconds: Int
      length: Int
      offense: String
      tags: String
    }
    extend type Query {
      penaltiesByGame(season: String!, game: Int!): [Penalty]
    }
  `,
  resolvers: {
    Penalty: {
      team: (parent, _, { loader: { team } }) => team.load(parent.team),
      game: (parent, _, { loader: { game } }) =>
        game.load(`${parent.season}-${parent.game}`),
      player: (parent, _, { loader: { player } }) => player.load(parent.player)
    },
    Query: {
      penaltiesByGame: async (_, args) =>
        db('penalty')
          .where('season', args.season)
          .where('game', args.game)
          .select()
    }
  }
}
