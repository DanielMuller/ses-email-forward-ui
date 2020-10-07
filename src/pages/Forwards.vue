<template lang="pug">
  q-page(padding)
    div(v-if="domains.includes(domain)")
      .text-h4 Redirects for domain <em>{{ domain }}</em>
    div(v-else)
      div.justify-center
        q-banner.bg-negative.text-white.rounded-borders
          template(v-slot:avatar)
            q-icon(name="highlight_off")
          span You aren't allowed to manage the domain <em>{{ domain }}</em>
</template>

<script>
export default {
  name: 'Forwards',
  data () {
    return {
      domain: null,
      domains: []
    }
  },
  beforeMount () {
    this.domain = this.$route.params.domain.toLowerCase()
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.domains = user.attributes['custom:domains'].split(',').map(e => e.trim())
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  beforeRouteUpdate (to, from, next) {
    this.domain = to.params.domain
    next()
  }
}
</script>
