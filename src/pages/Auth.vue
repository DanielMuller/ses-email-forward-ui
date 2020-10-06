<template lang="pug">
  q-page.flex.flex-center
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
        this.$router.replace({ name: 'home' }).catch()
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
