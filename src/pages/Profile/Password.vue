<template lang="pug">
q-page(padding)
  q-card(style="max-width:350px")
    q-card-section
      .text-h6 {{ $t('change_password') }}
    q-card-section.q-gutter-md
      q-input(outlined v-model="oldPassword" type="password" :label="$t('old_password')")
      q-input(outlined v-model="newPassword" type="password" :label="$t('new_password')")
      q-input(outlined v-model="newPasswordRepeat" type="password" :label="$t('new_password_repeat')")
    q-card-actions(align="right")
        q-btn(flat :label="$t('update')" color="primary" @click="savePwd" :disable="!canSavePwd")
</template>

<script>
// - Auth.currentAuthenticatedUser()
// -     .then(user => {
// -         return Auth.changePassword(user, 'oldPassword', 'newPassword');
// -     })
// -     .then(data => console.log(data))
// -     .catch(err => console.log(err));
export default {
  name: 'Password',
  data () {
    return {
      oldPassword: null,
      newPassword: null,
      newPasswordRepeat: null
    }
  },
  methods: {
    savePwd () {
      this.$Amplify.Auth.currentAuthenticatedUser()
        .then(user => {
          return this.$Amplify.Auth.changePassword(user, this.oldPassword, this.newPassword)
        })
        .then(data => {
          this.$q.notify({
            color: 'positive',
            position: 'center',
            message: this.$t('pwd_updated')
          })
          this.$router.replace({ name: 'home' }).catch(err => {}) // eslint-disable-line node/handle-callback-err
        })
        .catch(err => {
          this.$q.notify({
            color: 'negative',
            position: 'center',
            html: true,
            multiline: true,
            message: '<strong>' + this.$t('change_password_error') + '</strong>:<br>' + err.message
          })
        })
    }
  },
  computed: {
    canSavePwd () {
      return (!!this.oldPassword && !!this.newPassword && !!this.newPasswordRepeat && this.newPassword === this.newPasswordRepeat)
    }
  }
}
</script>
