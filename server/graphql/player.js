const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input PlayerFilter {
      fname: String
      lname: String
    }

    type Playerdata {
      season: String!
      team: Team
      number: Int
      pos: String
      cd: String
      ij: String
      it: Int
      sp: Int
      st: Int
      en: Int
      du: Int
      di: Int
      sk: Int
      pa: Int
      pc: Int
      df: Int
      sc: Int
      ex: Int
      ld: Int
      ov: Int
      rookie: Boolean
      age: Int
      salary: Int
      contract: Int
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
      data: [Playerdata]
    }
    extend type Query {
      players: [Player]
      findPlayers(filter: PlayerFilter): [Player]
      player(id: ID!): Player
    }
  `,
  resolvers: {
    Player: {
      data: (parent) => db('playerdata').where('playerid', parent.id).select()
    },
    Query: {
      players: async () => db('player').select(),
      findPlayers: async (_, args) => db('player').where(args.filter).select(),
      player: async (_, args) => db('player').where('id', args.id).first()
    }
  }
}
