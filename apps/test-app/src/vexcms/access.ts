import { defineAccess } from "@vexcms/core"

import {
  TABLE_SLUG_ARTICLES,
  TABLE_SLUG_CATEGORIES,
  TABLE_SLUG_POSTS,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"
import { articles, categories, media, posts, users } from "~/vexcms/collections"

export const access = defineAccess({
  permissions: {
    admin: {
      articles: true,
      categories: true,
      media: true,
      posts: true,
      user: true,
    },
    user: {
      [TABLE_SLUG_ARTICLES]: {
        create: true,
        delete: ({ data: article, user }) => {
          return article.name === user.name
        },
        read: ({ data: article, user }) => {
          return article.name === user.name
        },
        update: ({ data: article, user }) => {
          return article.name === user.name
        },
      },
      [TABLE_SLUG_CATEGORIES]: {
        create: ({ data: category, user }) => {
          return category.name === user.name
        },
      },
      [TABLE_SLUG_POSTS]: {
        create: true,
        delete: ({ data: post, user }) => {
          return post.title === user.name
        },
        read: ({ data: post, user }) => {
          return post.title === user.name
        },
        update: ({ data: post, user }) => {
          return post.title === user.name
        },
      },
      [TABLE_SLUG_USERS]: {
        create: false,
        delete: false,
        read: ({ data: targetUser, user }) => {
          return targetUser.name === user.name
        },
        update: ({ data: targetUser, user }) => {
          return targetUser._id === user._id
        },
      },
    },
  },
  resources: [articles, posts, categories, users, media],
  roles: [USER_ROLES.user, USER_ROLES.admin],
  userCollection: users,
})
