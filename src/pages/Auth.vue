<template lang="pug">
  q-page.bg-grey-6.column.items-center(padding)
    div.col
      div.q-mb-md.row.justify-center
        q-avatar(icon="forward_to_inbox" size="150px" color="white" text-color="grey-9")
      div.row.justify-center
        amplify-authenticator(
          :key="$q.lang.isoName"
          handleAuthStateChange=""
          style="--container-display:inline"
          )
          amplify-sign-in(
            slot="sign-in"
            hide-sign-up
          )
          amplify-sign-out
      div.row.justify-end
        language-switcher
</template>

<script>
import { onAuthUIStateChange } from '@aws-amplify/ui-components'
import LanguageSwitcher from 'components/LanguageSwitcher'

export default {
  name: 'Auth',
  components: {
    LanguageSwitcher
  },
  created () {
    onAuthUIStateChange((authState, authData) => {
      this.authState = authState
      this.user = authData
      if (this.authState === 'signedin' && this.user) {
        this.$router.replace({ name: 'home' }).catch(err => {}) // eslint-disable-line node/handle-callback-err
      }
    })
  },
  data () {
    return {
      user: undefined,
      authState: undefined
    }
  },
  beforeDestroy () {
    return onAuthUIStateChange
  }
}
</script>

<style lang="stylus">
:root
  --amplify-primary-color: $primary
  --amplify-primary-tint: lighten($primary, 10)
  --amplify-primary-shade: darken($primary, 15)
amplify-authenticator
  .hydrated
    --box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.8)
</style>
