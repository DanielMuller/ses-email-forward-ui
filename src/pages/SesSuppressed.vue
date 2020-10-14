<template lang="pug">
q-page(padding)
  div.q-pa-md(v-if="suppressed")
    .text-h6 Adresses suppressed by AWS SES
    div(v-if="suppressed.length>0")
      q-banner.bg-red-3.q-pa-lg.q-mb-md(rounded)
        template(v-slot:avatar)
          q-icon(name="warning" color="red-10")
        .text-h6 Before deleting, make sure that the destination will accept the message
        div If your messages are being rejected again, you are taking the risk of having your account suspended
      q-markup-table
        thead
          tr
            th.text-left Address
            th.text-left Last Updated
            th.text-left Reason
            th.text-left Actions
        tbody
          tr(v-for="item in suppressed" :key="item.EmailAddress")
            td {{ item.EmailAddress }}
            td {{ dateFormat(item.LastUpdateTime) }}
            td {{ item.Reason }}
            td
              q-btn(:loading="loading[item.EmailAddress]" round flat color="negative" @click="restore(item.EmailAddress)" icon="restore_from_trash")
                q-tooltip Restore Address
    div(v-else)
      q-banner.bg-positive.q-pa-lg(rounded)
        template(v-slot:avatar)
          q-icon(name="thumb_up" color="white")
        .text-h6 You are all good
        div No addresses on the AWS SES suppression list
</template>

<script>
import { SESv2 } from '@aws-sdk/client-sesv2'
import { date } from 'quasar'

export default {
  name: 'SesSuppressed',
  data () {
    return {
      suppressed: null,
      loading: {}
    }
  },
  beforeMount () {
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.$Amplify.Auth.currentCredentials().then(creds => {
            const params = {
              region: process.env.TABLE_REGION,
              credentials: this.$Amplify.Auth.essentialCredentials(creds)
            }
            this.ses = new SESv2(params)
            this.getSuppressed()
          })
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  methods: {
    getSuppressed: async function () {
      if (this.ses) {
        this.suppressed = []
        let items
        do {
          items = await this.ses.listSuppressedDestinations({})
          this.suppressed = [...this.suppressed, ...items.SuppressedDestinationSummaries]
        } while (items.NextToken)
        this.suppressed.sort((a, b) => {
          return b.LastUpdateTime - a.LastUpdateTime
        })
      }
    },
    dateFormat: function (ts) {
      const timeStamp = new Date(ts * 1000)
      const formattedString = date.formatDate(timeStamp, 'YYYY-MM-DD HH:mm:ss ZZ')
      const unit = 'days'
      const today = Date.now()

      const diff = date.getDateDiff(today, formattedString, unit)
      let ago = ''
      switch (diff) {
        case (0):
          ago = 'today'
          break
        case (1):
          ago = 'yesterday'
          break
        default:
          ago = `${diff} days ago`
          break
      }
      return `${formattedString} (${ago})`
    },
    restore (address) {
      const loading = {}
      loading[address] = true
      this.loading = { ...loading }

      this.ses.deleteSuppressedDestination({ EmailAddress: address }).then(res => {
        loading[address] = false
        this.loading = { ...loading }
        if (res) {
          this.suppressed = this.suppressed.filter(el => el.EmailAddress !== address)
        }
      }).catch(err => { // eslint-disable-line handle-callback-err
        this.$q.notify({
          type: 'negative',
          message: 'Unable to suppress the address',
          position: 'center',
          timeout: 2500
        })
        loading[address] = false
        this.loading = { ...loading }
        this.suppressed = this.suppressed.filter(el => el.EmailAddress !== address)
      })
    }
  }
}
</script>
