<template lang="pug">
  q-btn-toggle(
    dense
    flat
    :color="color"
    :toggle-color="toggleColor"
    v-model="locale"
    @input="setLocale"
    :options="langOptions"
  )
</template>

<script>
export default {
  name: 'LanguageSwitcher',
  data () {
    return {
      locale: this.$i18n.locale,
      langOptions: [
        { value: 'en-us', label: 'En' },
        { value: 'fr', label: 'Fr' }
      ]
    }
  },
  methods: {
    setLocale (locale) {
      this.$i18n.locale = locale
      this.$Amplify.I18n.setLanguage(locale.substring(0, 2).toLowerCase())
      this.$q.localStorage.set('locale', locale)
      // load the Quasar language pack dynamically
      import(`quasar/lang/${locale}`).then(({ default: messages }) => {
        this.$q.lang.set(messages)
      })
    }
  },
  props: {
    color: {
      type: String,
      default: 'white'
    },
    toggleColor: {
      type: String,
      default: 'amber-6'
    }
  },
  created () {
    const locale = this.$q.localStorage.getItem('locale') || 'en-us'
    this.setLocale(locale)
    this.locale = locale
  }
}
</script>
