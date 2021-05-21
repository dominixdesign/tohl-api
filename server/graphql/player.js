const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input PlayerFilter {
      fname: String
      lname: String
    }
    type Player {
      id: String!
      fname: String
      lname: String
      display_fname: String
      display_lname: String
      height: Int
      weight: Int
      hand: String
    }
    extend type Query {
      players: [Player]
      findPlayers(filter: PlayerFilter): [Player]
      player(id: ID!): Player
    }
  `,
  resolvers: {
    Query: {
      players: async () => db('player').select(),
      findPlayers: async (_, args) => db('player').where(args.filter).select(),
      player: async (_, args) => db('player').where('id', args.id).select()
    }
  }
}
