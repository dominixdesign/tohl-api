const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input PlayerstatsFilter {
      season: String
      player: String
      team: String
    }

    type Playerstats {
      season: String!
      player: Player!
      team: Team
      total_teams: [Team]
      currentTeam: Team
      games: Int
      goals: Int
      assists: Int
      points: Int
      plusminus: Int
      pim: Int
      shots: Int
      shotspercentage: Float
      hits: Int
      icetime: Int
      itg: Float
      evg: Int
      eva: Int
      ppg: Int
      ppa: Int
      shg: Int
      sha: Int
      gwg: Int
      streak_goals_current: Int
      streak_goals_longest: Int
      streak_points_current: Int
      streak_points_longest: Int
      fightswon: Int
      fightslose: Int
      fightsdraw: Int
      suspension: Int
      enforcerpoints: Int
      injuries: Int
      ejections: Int
      minutes: Int
      saves: Int
      shotsfaced: Int
      savepercentage: Float
      gaa: Float
      goalsagainst: Int
      shutout: Int
      first_stars: Int
      second_stars: Int
      third_stars: Int
      farm_goals: Int
      farm_assists: Int
      farm_points: Int
    }

    extend type Query {
      playerstats(
        where: JSON
        orderBy: [OrderBy]
        limit: Int
        offset: Int
      ): [Playerstats]
    }
  `,
  resolvers: {
    Playerstats: {
      team: (parent, _, { loader: { team } }) => team.load(parent.team),
      total_teams: (parent, _, { loader: { team } }) =>
        parent.total_teams && team.loadMany(parent.total_teams.split(',')),
      currentTeam: (parent, _, { loader: { team } }) =>
        team.load(parent.teamid),
      player: (parent, _, { loader: { player } }) => player.load(parent.player)
    },
    Query: {
      playerstats: async (_, { orderBy, limit, offset, where }) => {
        return await db('playerstats')
          .join(
            'playerdata',
            function () {
              this.on('playerdata.playerid', '=', 'playerstats.player')
              this.on('playerdata.season', '=', 'playerstats.season')
            },
            'left'
          )
          .modify((queryBuilder) => {
            if (where) {
              for (const entry of JSON.parse(where)) {
                if (entry[2].includes('SELECT')) {
                  queryBuilder.where(
                    db.raw(`${entry[0]} ${entry[1]} ${entry[2]}`)
                  )
                } else {
                  queryBuilder.where(entry[0], entry[1], entry[2])
                }
              }
            }
          })
          .orderBy(orderBy || 'player')
          .limit(limit || 100)
          .offset(offset || 0)
          .select([
            '*',
            db.raw(
              '50*fightswon + 20*fightslose + 40*fightsdraw + 30*ejections + pim as enforcerpoints'
            ),
            db.raw('goals - ppg - shg as evg'),
            db.raw('assists - ppa - sha as eva'),
            db.raw('farm_goals + farm_assists as farm_points'),
            db.raw('ROUND((saves / shotsfaced)*100, 2) as savepercentage'),
            db.raw('ROUND((goals / shots)*100, 2) as shotspercentage'),
            db.raw('ROUND((icetime / games), 2) as itg'),
            db.raw('ROUND(goalsagainst / (minutes / 60),2) as gaa')
          ])
      }
    }
  }
}
