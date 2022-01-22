const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    type GameEvent {
      season: String
      game: Game
      player: Player
      team: Team
      player2: Player
      period: Int
      minutes: Int
      seconds: Int
      situation: String
      type: String
    }
    extend type Query {
      eventsByGame(season: String!, game: Int!): [GameEvent]
    }
  `,
  resolvers: {
    GameEvent: {
      team: (parent, _, { loader: { team } }) =>
        parent.team && team.load(parent.team),
      game: (parent, _, { loader: { game } }) =>
        game.load(`${parent.season}-${parent.game}`),
      player: (parent, _, { loader: { player } }) => player.load(parent.player),
      player2: (parent, _, { loader: { player } }) =>
        parent.player2 && player.load(parent.player2)
    },
    Query: {
      eventsByGame: async (_, args) =>
        db('game_event')
          .where('season', args.season)
          .where('game', args.game)
          .select()
    }
  }
}
