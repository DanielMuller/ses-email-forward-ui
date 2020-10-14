<template lang="pug">
q-page(padding)
  div.q-pa-md(v-if="!loading")
    .text-h6 Blacklisted Addresses
    div(v-if="blacklisted.length>0")
      q-banner.bg-warning.q-pa-lg.q-mb-md(rounded)
        template(v-slot:avatar)
          q-icon(name="warning")
        .text-h6 Before deleting, make sure that the destination will accept the message
        div If your messages are being rejected again, you are taking the risk of having your account suspended
      q-markup-table
        thead
          tr
            th.text-left Address
            th.text-left Last Updated
            th.text-left Valid Until
            th.text-left Actions
        tbody
          tr(v-for="item in blacklistedSummary" :key="item.destination")
            td {{ item.destination }}
            td {{ dateFormat(item.lastUpdated) }}
            td {{ dateFormat(item.validUntil) }}
            td
              q-btn(round flat color="primary" @click="blacklistDetails(item.destination)" icon="info")
                q-tooltip Info
      blacklisted-detail(:showDetail="showDetail" :destination="destinationDetail" :data="dataDetail" @hide="showDetail=false" @restore="restore")
    div(v-else)
      q-banner.bg-positive.q-pa-lg(rounded)
        template(v-slot:avatar)
          q-icon(name="thumb_up" color="white")
        .text-h6 You are all good
        div No addresses on the blacklist
</template>

<script>
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { date } from 'quasar'
import BlacklistedDetail from 'components/BlacklistedDetail'
import RestoreBlacklisted from 'src/mixins/restoreBlacklisted'

export default {
  name: 'blacklisted',
  components: {
    BlacklistedDetail
  },
  mixins: [
    RestoreBlacklisted
  ],
  data () {
    return {
      blacklisted: [],
      dynamodb: null,
      tableBounces: `${process.env.TABLE_PREFIX}-bounces`,
      tableRegion: process.env.TABLE_REGION,
      loading: true,
      destinationDetail: null,
      dataDetail: null,
      showDetail: false
    }
  },
  beforeMount () {
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.$Amplify.Auth.currentCredentials().then(creds => {
            const params = {
              region: this.tableRegion,
              credentials: this.$Amplify.Auth.essentialCredentials(creds)
            }
            this.dynamodb = new DynamoDB(params)
            this.getBlacklisted()
          })
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  methods: {
    getBlacklisted: async function () {
      this.blacklisted = []
      const params = {
        TableName: this.tableBounces
      }
      let items
      do {
        items = await this.dynamodb.scan(params)
        items.Items.forEach((item) => {
          this.blacklisted.push(unmarshall(item))
        })
        params.ExclusiveStartKey = items.LastEvaluatedKey
      } while (typeof items.LastEvaluatedKey !== 'undefined')
      this.blacklisted.sort((a, b) => {
        return b.createdAt - a.createdAt
      })
      this.loading = false
    },
    dateFormat: function (ts) {
      return date.formatDate(ts * 1000, 'YYYY-MM-DD HH:mm:ss ZZ')
    },
    blacklistDetails: function (destination) {
      this.destinationDetail = destination
      this.dataDetail = this.blacklisted.filter(el => el.destination === destination)
      this.showDetail = true
    },
    restore: function (destination) {
      this.showDetail = false
      this.deleteBlacklisted(this.dynamodb, this.dataDetail)
      this.blacklisted = this.blacklisted.filter(e => e.destination !== destination)
    }
  },
  computed: {
    blacklistedSummary: function () {
      const byDestination = {}
      this.blacklisted.forEach(item => {
        if (item.destination in byDestination) {
          byDestination[item.destination].lastUpdated = Math.max(byDestination[item.destination].lastUpdated, item.createdAt)
          byDestination[item.destination].validUntil = Math.max(byDestination[item.destination].validUntil, item.validUntil)
        } else {
          byDestination[item.destination] = {
            lastUpdated: item.createdAt,
            validUntil: item.validUntil
          }
        }
      })
      const formatted = []
      for (const [key, value] of Object.entries(byDestination)) {
        formatted.push({
          destination: key,
          ...value
        })
      }
      formatted.sort((a, b) => {
        return b.lastUpdated - a.lastUpdated
      })
      return formatted
    }
  }
}
</script>
