const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    type Lines {
      season: String!
      gameday: Int
      team: Team
      lines_json: String
    }
    extend type Query {
      lines(season: String!, gameday: Int, team: String!): Lines
    }
  `,
  resolvers: {
    Lines: {
      team: (parent, _, { loader: { team } }) => team.load(parent.team)
    },
    Query: {
      lines: async (_, { season, gameday, team }) =>
        db('line')
          .where({ season, team })
          .where(function () {
            if (gameday) {
              this.where({ gameday })
            } else {
              this.where(
                'gameday',
                db('game')
                  .where('season', season)
                  .whereNotNull('goalshome')
                  .whereNotNull('goalsaway')
                  .select(db.raw('max(`gameday`) as lastgameday'))
                  .first()
              )
            }
          })
          .select()
          .first()
    }
  }
}
