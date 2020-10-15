<template lang="pug">
  q-layout(view="hHh lpR fFf")
    q-header.bg-primary.text-white(elevated)
      q-toolbar
        q-btn(dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen")
        q-toolbar-title
          q-icon(name="forward_to_inbox" size="lg")
          span.q-ml-sm {{ $t('appName') }}
        q-space
        language-switcher
        q-btn.q-ml-md(v-if="isLoggedIn" dense flat round icon="logout" @click="logout")

    q-drawer(show-if-above v-model="leftDrawerOpen" side="left" bordered)
      .q-pa-sm
        .text-h6 {{ $t('redirects') }}
        q-list(dense)
          q-item(v-for="domain in domains" :key="domain" clickable v-ripple :to="{ name: 'forwards', params: {domain: domain }}")
            q-item-section {{ domain }}
        .text-h6 {{ $t('blockedAddresses') }}
        q-list(dense)
          q-item(clickable v-ripple :to="{name:'blacklisted'}")
            q-item-section {{ $t('blacklisted') }}
          q-item(clickable v-ripple :to="{name:'sessuppressed'}")
            q-item-section {{ $t('sesSuppressed') }}
    q-page-container
      router-view
</template>

<script>
import LanguageSwitcher from 'components/LanguageSwitcher'

export default {
  name: 'MainLayout',
  data () {
    return {
      leftDrawerOpen: false,
      isLoggedIn: false,
      domains: null
    }
  },
  components: {
    LanguageSwitcher
  },
  beforeCreate () {
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.isLoggedIn = true
          this.domains = user.attributes['custom:domains'].split(',').map(e => e.trim())
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  methods: {
    logout: function () {
      this.$Amplify.Auth.signOut()
      this.$router.replace({ name: 'auth' }).catch(err => {}) // eslint-disable-line handle-callback-err
    }
  },
  computed: {
    lang () {
      return this.$q.lang.getLocale()
    },
    iso () {
      return this.$q.lang.isoName
    }
  }
}
</script>
