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
      post(post: ID!): Post
    }

    extend type Mutation {
      addPost(title: String, board: ID, comment: String): String
    }
  `,
  permissions: {
    Query: {
      posts: 'requiresGM',
      post: 'requiresGM'
    },
    Mutation: {
      addPost: 'requiresGM'
    }
  },
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
          .select(),
      post: async (_, { post }) =>
        db('bb_post').where({ id: post }).select().first()
    },
    Mutation: {
      addPost: async (_, { title, board, comment }, { user }) => {
        try {
          console.log(user)
          const timestamp = new Date().toISOString()
          const parent = await db('bb_post').insert({
            title,
            board,
            manager: user.userid
          })
          const newId = parent.pop()
          await db('bb_comment').insert({
            parent: newId,
            timestamp,
            content: comment,
            manager: user.userid
          })
          console.log(newId.toString())
          return newId.toString()
        } catch (e) {
          console.log(e)
          return e
        }
      }
    }
  }
}
