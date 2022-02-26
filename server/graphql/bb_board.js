const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const post = require('./bb_post')

module.exports = {
  typeDefs: gql`
    type Board {
      id: ID
      title: String
      parent: Board
      children: [Board]
      postCount: Int
      posts(limit: Int): [Post]
    }
    extend type Query {
      boards: [Board]
      board(board: ID!): Board
    }
  `,
  resolvers: {
    Board: {
      parent: (parent, _, { loader: { board } }) =>
        parent.parent && board.load(parent.parent),
      posts: async (parent, { limit }) =>
        post.resolvers.Query.posts(undefined, { board: parent.id, limit }),
      postCount: async (parent) => {
        const count = await db('bb_post')
          .where({ board: parent.id })
          .count('id as postCount')
        return count.postCount
      }
    },
    Query: {
      boards: async () => db('bb_board').select(),
      board: async (_, { board }) =>
        db('bb_board').where({ id: board }).select().first()
    }
  }
}
