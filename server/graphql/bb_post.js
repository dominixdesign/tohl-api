const { gql } = require('apollo-server-express')
const db = require('../helpers/db')
const comment = require('./bb_comment')

module.exports = {
  typeDefs: gql`
    type Post {
      id: ID
      title: String
      board: Board
      manager: Manager
      comments(limit: Int): [Comment]
    }
    extend type Query {
      posts(board: ID!, limit: Int): [Post]
    }
  `,
  resolvers: {
    Post: {
      board: (parent, _, { loader: { board } }) => board.load(parent.parent),
      comments: async (parent, { limit }) =>
        comment.resolvers.Query.comments(undefined, {
          parent: parent.id,
          parentType: 'post',
          limit
        }),
      manager: (parent, _, { loader: { manager } }) =>
        manager.load(parent.manager)
    },
    Query: {
      posts: async (_, { board, limit }) =>
        db('bb_post')
          .where({ board })
          .limit(limit || 20)
          .select()
    }
  }
}
