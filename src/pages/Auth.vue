<template lang="pug">
  q-page.bg-grey-6.flex.flex-center
    amplify-authenticator(
      handleAuthStateChange=""
      )
      amplify-sign-in(
        slot="sign-in"
        hide-sign-up
      )
      amplify-sign-out
</template>

<script>
import { onAuthUIStateChange } from '@aws-amplify/ui-components'
export default {
  name: 'Auth',
  created () {
    onAuthUIStateChange((authState, authData) => {
      this.authState = authState
      this.user = authData
      if (this.authState === 'signedin' && this.user) {
        this.$router.replace({ name: 'home' }).catch(err => {}) // eslint-disable-line handle-callback-err
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
