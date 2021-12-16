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
      roster: String
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
      nation: String
      data: [Playerdata]
      seasondata(season: ID): Playerdata
    }
    extend type Query {
      players: [Player]
      roster(teamsim: String!, season: ID!): [Player]
      findPlayers(filter: PlayerFilter): [Player]
      player(id: ID!): Player
    }
  `,
  resolvers: {
    Player: {
      data: (parent) => db('playerdata').where('playerid', parent.id).select(),
      seasondata: async (parent, { season }, { loader: { latestSeason } }) => {
        if (!season) {
          season = await latestSeason(parent.id)
        }
        return db('playerdata')
          .where('playerid', parent.id)
          .where('season', season)
          .first()
      }
    },
    Playerdata: {
      team: (parent, _, { loader: { team } }) => team.load(parent.teamid)
    },
    Query: {
      players: async () => db('player').select(),
      roster: async (_, { season, teamsim }) =>
        db('player')
          .innerJoin(
            'playerdata',
            function () {
              this.on('playerdata.playerid', '=', 'player.id')
            },
            'left'
          )
          .where('playerdata.teamid', teamsim)
          .where('playerdata.season', season)
          .select(),
      findPlayers: async (_, args) => db('player').where(args.filter).select(),
      player: async (_, args) => db('player').where('id', args.id).first()
    }
  }
}
