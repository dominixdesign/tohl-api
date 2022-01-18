const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    type Goal {
      season: String
      game: Game
      goalscorer: Player
      primaryassist: Player
      secondaryassist: Player
      score: String
      scoringteam: Team
      concedingteam: Team
      period: Int
      minutes: Int
      seconds: Int
      situation: String
      tags: String
    }
    extend type Query {
      goalsByGame(season: String!, game: Int!): [Goal]
    }
  `,
  resolvers: {
    Goal: {
      scoringteam: (parent, _, { loader: { team } }) =>
        team.load(parent.scoringteam),
      concedingteam: (parent, _, { loader: { team } }) =>
        team.load(parent.concedingteam),
      game: (parent, _, { loader: { game } }) =>
        game.load(`${parent.season}-${parent.game}`),
      goalscorer: (parent, _, { loader: { player } }) =>
        player.load(parent.goalscorer),
      primaryassist: (parent, _, { loader: { player } }) =>
        player.load(parent.primaryassist),
      secondaryassist: (parent, _, { loader: { player } }) =>
        player.load(parent.secondaryassist)
    },
    Query: {
      goalsByGame: async (_, args) =>
        db('goal')
          .where('season', args.season)
          .where('game', args.game)
          .select()
    }
  }
}
