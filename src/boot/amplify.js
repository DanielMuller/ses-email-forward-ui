import Vue from 'vue'
import Amplify from 'aws-amplify'
import '@aws-amplify/ui-vue'
import awsconfig from '../aws-exports'
Amplify.configure(awsconfig)

import localesAvail from '../i18n'
Object.keys(localesAvail).forEach(lang => {
  import(`../i18n/${lang}/amplify`).then(({ default: messages }) => {
    Amplify.I18n.putVocabulariesForLanguage(lang.substring(0, 2).toLowerCase(), messages)
  })
    .catch(err => {}) // eslint-disable-line node/handle-callback-err
})

Vue.prototype.$Amplify = Amplify
