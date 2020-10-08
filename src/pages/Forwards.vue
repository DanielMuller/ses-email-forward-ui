<template lang="pug">
  q-page(padding)
    div(v-if="domains.includes(domain)")
      .text-h4 Redirects for domain <em>{{ domain }}</em>
      div Fetch from {{ tableName }} in {{ tableRegion }}
      pre {{ data }}
    div(v-else)
      div.justify-center
        q-banner.bg-negative.text-white.rounded-borders
          template(v-slot:avatar)
            q-icon(name="highlight_off")
          span You aren't allowed to manage the domain <em>{{ domain }}</em>
</template>

<script>
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

export default {
  name: 'Forwards',
  data () {
    return {
      domain: null,
      domains: [],
      data: null,
      loading: false,
      tableName: process.env.TABLE_NAME,
      tableRegion: process.env.TABLE_REGION
    }
  },
  beforeMount () {
    this.domain = this.$route.params.domain.toLowerCase()
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.domains = user.attributes['custom:domains'].split(',').map(e => e.trim())
          this.getData()
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  beforeRouteUpdate (to, from, next) {
    this.domain = to.params.domain
    this.getData()
    next()
  },
  methods: {
    getData: function () {
      this.data = null
      if (this.domains.includes(this.domain)) {
        this.loading = true
        this.$Amplify.Auth.currentCredentials().then(creds => {
          const client = new DynamoDB({
            region: this.tableRegion,
            credentials: this.$Amplify.Auth.essentialCredentials(creds)
          })
          const params = {
            TableName: this.tableName,
            KeyConditionExpression: '#domain = :domain',
            ExpressionAttributeValues: {
              ':domain': {
                S: this.domain
              }
            },
            ExpressionAttributeNames: {
              '#domain': 'domain'
            }
          }
          client.query(params).then(data => {
            this.data = unmarshall(data.Item)
            this.loading = false
          })
        })
      }
    }
  }
}
</script>
