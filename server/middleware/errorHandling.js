module.exports = {
  requestDidStart() {
    return {
      didEncounterErrors({ errors, context }) {
        const isAdmin =
          context.user &&
          context.user.roles &&
          context.user.roles.includes('ADMIN')
        errors.forEach((error) => {
          const msg = error.message
          error.message = {
            isAdmin,
            toString: () => msg
          }
        })
      }
    }
  }
}
