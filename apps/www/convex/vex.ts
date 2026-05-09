import { mutationApi, queryApi } from "@vexcms/core/server"

import config from "~/vex.config"

import { mutation, query } from "./_generated/server"

export const { find, get, search } = queryApi(config, query)
export const { create, update, remove } = mutationApi(config, mutation)
