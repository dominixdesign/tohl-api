const { gql } = require('apollo-server-express')
const db = require('../helpers/db')

module.exports = {
  typeDefs: gql`
    union ParentType = Post | Player | Game

    type Comment {
      id: ID
      parent: ParentType
      timestamp: Date
      content: String
      karma: Int
      manager: Manager
    }
    extend type Query {
      comments(parent: ID!, parentType: String, limit: Int): [Comment]
    }
  `,
  resolvers: {
    Comment: {
      parent: (parent, _, { loader: { post } }) => {
        if (parent.parent_type === 'post') {
          return post.load(parent.parent)
        }
      },
      manager: (parent, _, { loader: { manager } }) =>
        manager.load(parent.manager)
    },
    Query: {
      comments: async (_, { parent, parentType, limit }) =>
        db('bb_comment')
          .where({ parent, parent_type: parentType })
          .orderBy('timestamp', 'asc')
          .limit(limit || 20)
          .select()
    }
  }
}
