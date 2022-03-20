const requiresRoles = require('./requiresRoles')

const validMiddlewares = {
  requiresGM: requiresRoles(['GM'])
}

module.exports = (permissions) => {
  return permissions
    .filter((m) => m)
    .map((modules) => {
      if (modules.Mutation)
        for (const mutation of Object.keys(modules.Mutation)) {
          modules.Mutation[mutation] =
            validMiddlewares[modules.Mutation[mutation]]
        }
      if (modules.Query)
        for (const query of Object.keys(modules.Query)) {
          modules.Query[query] = validMiddlewares[modules.Query[query]]
        }
      return modules
    })
}
