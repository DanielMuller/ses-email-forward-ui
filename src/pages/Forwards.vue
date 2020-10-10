<template lang="pug">
  q-page(padding)
    div(v-if="domains.includes(domain)")
      forwards-list(
        :title="title"
        :data="definitions"
        rowKey="alias",
        :blacklisted="blacklisted"
        :loading="loading"
        :domain="domain"
        @put-item="putItem"
        @delete-item="deleteItem"
      )
    div(v-else)
      div.justify-center
        q-banner.bg-negative.text-white.rounded-borders
          template(v-slot:avatar)
            q-icon(name="highlight_off")
          span You aren't allowed to manage the domain <em>{{ domain }}</em>
</template>

<script>
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import ForwardsList from 'components/ForwardsList'

export default {
  name: 'Forwards',
  components: {
    ForwardsList
  },
  data () {
    return {
      domain: null,
      domains: [],
      definitions: [],
      loading: false,
      blacklisted: [],
      dynamodb: null,
      tableDefinitions: `${process.env.TABLE_PREFIX}-definitions`,
      tableBounces: `${process.env.TABLE_PREFIX}-bounces`,
      tableRegion: process.env.TABLE_REGION
    }
  },
  beforeMount () {
    this.domain = this.$route.params.domain.toLowerCase()
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.domains = user.attributes['custom:domains'].split(',').map(e => e.trim())
          if (this.domains.includes(this.domain)) {
            this.$Amplify.Auth.currentCredentials().then(creds => {
              const params = {
                region: this.tableRegion,
                credentials: this.$Amplify.Auth.essentialCredentials(creds)
              }
              this.dynamodb = new DynamoDB(params)
              this.getData()
              this.getBlacklisted()
            })
          }
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
    getData: async function () {
      this.definitions = []

      if (this.domains.includes(this.domain)) {
        this.loading = true
        const params = {
          TableName: this.tableDefinitions,
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
        let items
        do {
          items = await this.dynamodb.query(params)
          items.Items.forEach((item) => {
            this.definitions.push(unmarshall(item))
          })
          params.ExclusiveStartKey = items.LastEvaluatedKey
        } while (typeof items.LastEvaluatedKey !== 'undefined')
        this.loading = false
      }
    },
    getBlacklisted: async function () {
      if (this.domains.includes(this.domain)) {
        const params = {
          TableName: this.tableBounces
        }
        let items
        do {
          items = await this.dynamodb.scan(params)
          items.Items.forEach((item) => {
            const destination = unmarshall(item).destination
            if (!this.blacklisted.includes(destination)) {
              this.blacklisted.push(destination)
            }
          })
          params.ExclusiveStartKey = items.LastEvaluatedKey
        } while (typeof items.LastEvaluatedKey !== 'undefined')
      }
    },
    putItem: function (item) {
      item.alias = item.alias.toLowerCase().trim()
      item.type = item.type.toLowerCase().trim()
      item.domain = item.domain.toLowerCase().trim()
      item.destinations = item.destinations.map(item => { return item.toLowerCase().trim() }).filter(item => item !== '')

      this.dynamodb.putItem({ TableName: this.tableDefinitions, Item: marshall(item) })
      this.definitions = this.definitions.filter(e => (e.alias !== item.alias || e.domain !== item.domain))
      this.definitions.push(item)
    },
    deleteItem: function (item) {
      var params = {
        Key: marshall({ alias: item.alias, domain: item.domain }),
        TableName: this.tableDefinitions
      }
      this.dynamodb.deleteItem(params)
      this.definitions = this.definitions.filter(e => (e.alias !== item.alias || e.domain !== item.domain))
    }
  },
  computed: {
    title () {
      return `Redirects for ${this.domain}`
    }
  }
}
</script>
