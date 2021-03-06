const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    input TeamFilter {
      teamid: String
      teamsim: String
    }
    type Team {
      teamid: String!
      season: String
      teamsim: String
      conference: String
      divivison: String
      manager: Manager
      full_name: String
      roster(season: ID!): [Player]
    }
    extend type Query {
      teams: [Team]
      findTeams(filter: TeamFilter): [Team]
      team(teamid: ID!): Team
      myTeam: Team
      teamterms: [Managerterm]
    }
    extend type Mutation {
      updateTeam(teamid: String, full_name: String): Team @ownTeam
    }
  `,
  resolvers: {
    Team: {
      manager: (parent, _, { loader: { manager } }) =>
        manager.load(parent.manager),
      roster: async (parent, { season }, { loader: { player } }) =>
        player.loadMany(
          await db('playerdata')
            .where('teamid', parent.teamsim)
            .where('season', season)
            .select('playerid')
            .then((rows) => rows.map((r) => r.playerid))
        )
    },
    Query: {
      teams: async () => db('team').select(),
      findTeams: async (_, args) => db('team').where(args.filter).select(),
      team: async (_, args) => db('team').where('teamid', args.teamid).select(),
      myTeam: async (_, _args, { ownTeam }) =>
        db('team').where('teamid', ownTeam).first(),
      teamterms: async (_, _args, { ownTeam }) =>
        db('manager_x_team').where('teamid', ownTeam).select()
    },
    Mutation: {
      updateTeam: async (_, { teamid, full_name }) => {
        await db('team').where('teamid', teamid).update({
          full_name
        })
        return await db('team').where('teamid', teamid).first()
      }
    }
  }
}
