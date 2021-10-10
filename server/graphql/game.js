const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const { resolvers } = require('./lineup')
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
      lineup(where: [[String]], orderBy: [OrderBy]): [Lineup]
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
      home: (parent, _, { loader: { team } }) => team.load(parent.home),
      away: (parent, _, { loader: { team } }) => team.load(parent.away),
      winner: (parent, _, { loader: { team } }) =>
        parent.winner && team.load(parent.winner),
      loser: (parent, _, { loader: { team } }) =>
        parent.loser && team.load(parent.loser),
      lineup: (parent, args) =>
        resolvers.Query.lineup(undefined, {
          ...args,
          filter: { season: parent.season, game: parent.game }
        })
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
          .debug()
          .where(function () {
            this.where(
              'gameday',
              db('game')
                .where('season', args.season)
                .whereNotNull('goalshome')
                .whereNotNull('goalsaway')
                .select(db.raw('max(`gameday`) as lastgameday'))
                .first()
            )
          })
          .select()
    }
  }
}
