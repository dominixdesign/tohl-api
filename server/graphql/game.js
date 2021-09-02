const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { team } = require('../helpers/dataLoaders')
// const { manager, player } = require('../helpers/dataLoaders')

module.exports = {
  typeDefs: gql`
    input GameFilter {
      home: String
      away: String
      gameday: Int
    }

    type Game {
      game: Int!
      gameday: Int
      season: String!
      home: Team
      away: Team
      goalshome: Int
      goalsaway: Int
      overtimes: Int
      winner: Team
      loser: Team
      pphome: Int
      ppaway: Int
      ppghome: Int
      pphaway: Int
      shotshome: Int
      shotsaway: Int
      gamedata: String
    }
    extend type Query {
      games(season: String!, filter: GameFilter): [Game]
      gamesByTeam(team: String!, season: String!, filter: GameFilter): [Game]
      game(gamenumber: Int!, season: String!): Game
      lastGameday(season: String!): [Game]
      nextGameday(season: String!): [Game]
    }
  `,
  resolvers: {
    Game: {
      home: (parent) => team.load(parent.home),
      away: (parent) => team.load(parent.away),
      winner: (parent) => parent.winner && team.load(parent.winner),
      loser: (parent) => parent.loser && team.load(parent.loser)
    },
    Query: {
      games: async (_, args) =>
        db('game')
          .where('season', args.season)
          .modify((queryBuilder) => {
            if (args.filter) {
              queryBuilder.where(args.filter)
            }
          })
          .select(),
      gamesByTeam: async (_, args) =>
        db('game')
          .where('season', args.season)
          .where(function () {
            this.where('home', args.team).orWhere('away', args.team)
          })
          .modify((queryBuilder) => {
            if (args.filter) {
              queryBuilder.where(args.filter)
            }
          })
          .select(),
      game: async (_, args) =>
        db('game')
          .where('game', args.gamenumber)
          .where('season', args.season)
          .select()
          .first(),
      nextGameday: async (_, args) =>
        db('game')
          .where('season', args.season)
          .where(function () {
            this.where(
              'gameday',
              db('game')
                .where('season', args.season)
                .where('goalshome', null)
                .where('goalsaway', null)
                .min('gameday', { as: 'nextgameday' })
                .first()
            )
          })
          .select(),
      lastGameday: async (_, args) =>
        db('game')
          .where('season', args.season)
          .where(function () {
            this.where(
              'gameday',
              db('game')
                .where('season', args.season)
                .where('goalshome', null)
                .where('goalsaway', null)
                .select(db.raw('min(`gameday`) - 1 as lastgameday'))
                .first()
            )
          })
          .select()
    }
  }
}
