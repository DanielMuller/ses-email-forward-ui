<template lang="pug">
q-page(padding)
  .text-h6 {{ $t('overviewDashboard') }}
  div.row.justify-end
    div(style="max-width:300px")
      q-select(outlined dense options-dense v-model="interval" :label="$t('interval')" :options="intervalOptions" @input="getDasboardData")
  div.q-mb-md(v-if="metricsReady===3")
    bar-chart(:chart-data="datacollection" :options="options")
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="4")
            .text-h6 {{ $t('rejected') }}
        tr.bg-grey-4
          th.text-left Timestamp
          th.text-left Reason
          th.text-left Source
          th.text-left Recipient
      tbody
        tr(v-if="rejectedLogs.length===0")
          td(colspan="4") {{ $t('no_messages') }}
        tr(v-for="msg in rejectedLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.reason}}
          td.text-left {{msg.source}}
          td.text-left {{msg.recipient}}
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="3")
            .text-h6 {{ $t('passed') }}
        tr.bg-grey-4
          th.text-left Timestamp
          th.text-left Source
          th.text-left Recipient
      tbody
        tr(v-if="passedLogs.length===0")
          td(colspan="3") No messages to display
        tr(v-for="msg in passedLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.source}}
          td.text-left {{msg.recipient}}
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="2")
            .text-h6 {{ $t('bounces') }}
        tr.bg-grey-4
          th.text-left Timestamp
          th.text-left Recipient
      tbody
        tr(v-if="bouncesLogs.length===0")
          td(colspan="2") No messages to display
        tr(v-for="msg in bouncesLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.recipient}}
</template>

<script>
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'
import { colors } from 'quasar'
const { getPaletteColor } = colors
import BarChart from 'components/BarChart'

export default {
  name: 'Dashboard',
  data () {
    return {
      cw: null,
      logs: null,
      rejectedLogs: [],
      bouncesLogs: [],
      passedLogs: [],
      metricsReady: 0,
      interval: null,
      intervalOptions: [
        {
          label: `1 ${this.$t('hour')}`,
          value: 3600,
          period: 60
        },
        {
          label: `6 ${this.$t('hours')}`,
          value: 6 * 3600,
          period: 60
        },
        {
          label: `12 ${this.$t('hour')}`,
          value: 12 * 3600,
          period: 300
        },
        {
          label: `1 ${this.$t('day')}`,
          value: 86400,
          period: 900
        },
        {
          label: `2 ${this.$t('days')}`,
          value: 2 * 86400,
          period: 900
        },
        {
          label: `1 ${this.$t('week')}`,
          value: 7 * 86400,
          period: 3600
        },
        {
          label: `2 ${this.$t('weeks')}`,
          value: 14 * 86400,
          period: 3 * 3600
        },
        {
          label: `4 ${this.$t('weeks')}`,
          value: 28 * 86400,
          period: 6 * 3600
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 6,
        scales: {
          xAxes: [
            {
              offset: true,
              stacked: true,
              type: 'time',
              time: {
                displayFormats: {
                  hour: 'ddd DD MMM HH:mm'
                }
              },
              ticks: {
                min: 0,
                max: 0
              }
            }
          ],
          yAxes: [
            {
              stacked: true,
              ticks: {
                suggestedMin: 0,
                stepSize: 1
              }
            }
          ]
        }
      },
      datacollection: {
        datasets: [
          {
            label: this.$t('passed'),
            backgroundColor: getPaletteColor('green-5'),
            fill: true,
            data: null,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: this.$t('rejected_spam'),
            backgroundColor: getPaletteColor('red-5'),
            fill: true,
            data: null,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: this.$t('rejected_dmarc'),
            backgroundColor: getPaletteColor('orange-5'),
            fill: true,
            data: null,
            barPercentage: 1.0
          }
        ]
      }
    }
  },
  components: {
    BarChart
  },
  beforeMount () {
    this.interval = this.intervalOptions.filter(e => e.value === 14 * 86400)[0]
    this.$Amplify.Auth.currentAuthenticatedUser()
      .then(user => {
        if (user) {
          this.$Amplify.Auth.currentCredentials().then(creds => {
            const params = {
              region: process.env.TABLE_REGION,
              credentials: this.$Amplify.Auth.essentialCredentials(creds)
            }
            this.cw = new CloudWatch(params)
            this.logs = new CloudWatchLogs(params)
            this.getDasboardData()
          })
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  methods: {
    getDasboardData () {
      const now = Date.now() / 1000 | 0
      const endTime = Math.ceil(now / this.interval.period) * this.interval.period
      const startTime = endTime - this.interval.value
      this.getMetrics(startTime, endTime)
      this.getLogs(startTime, endTime)
    },
    getMetrics (startTime, endTime) {
      const wantedMetrics = [
        'pass',
        'spam',
        'dmarc_reject'
      ]
      this.options.scales.xAxes[0].ticks.min = new Date(startTime * 1000).toISOString()
      this.options.scales.xAxes[0].ticks.max = new Date(endTime * 1000).toISOString()

      wantedMetrics.forEach(metric => {
        const params = {
          StartTime: new Date(startTime * 1000),
          EndTime: new Date(endTime * 1000),
          Namespace: 'SES-Forward',
          MetricName: metric,
          Period: this.interval.period,
          Statistics: ['Sum']
        }
        this.metricsReady = 0
        this.cw.getMetricStatistics(params).then(res => {
          const i = wantedMetrics.lastIndexOf(metric)
          const data = res.Datapoints.map(e => { return { x: e.Timestamp.toISOString(), y: e.Sum } })
          for (let j = startTime; j <= endTime; j += this.interval.period) {
            const test = data.filter(el => { return el.x === new Date(j * 1000).toISOString() })
            if (test.length === 0) {
              data.push({ x: new Date(j * 1000).toISOString(), y: null })
            }
          }
          data.sort((a, b) => { return (a.x < b.x) ? 1 : -1 })
          this.datacollection.datasets[i].data = data

          this.metricsReady++
        })
      })
    },
    sleep (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    async getLogs (startTime, endTime) {
      this.passedLogs = []
      this.rejectedLogs = []
      this.bouncesLogs = []
      const logQueries = [
        {
          name: 'rejected',
          logGroupName: '/aws/lambda/sesEmailForward-spam',
          queryString: 'fields @timestamp as timestamp, msg as reason , recipients.0 as recipient, source | filter _logLevel=\'info\' AND (msg=\'spam\' OR msg=\'dmarc-reject\') | sort @timestamp desc'
        },
        {
          name: 'bounces',
          logGroupName: '/aws/lambda/sesEmailForward-process',
          queryString: 'fields @timestamp as timestamp, originalRecipient as recipient | filter (_logLevel = \'warn\' AND msg = \'bounce\') | sort @timestamp desc'
        },
        {
          name: 'passed',
          logGroupName: '/aws/lambda/sesEmailForward-process',
          queryString: 'fields @timestamp as timestamp, Records.0.ses.mail.commonHeaders.from.0 as source, Records.0.ses.receipt.recipients.0 as recipient | filter (_logLevel == \'info\' AND msg=\'Event\') | sort @timestamp desc'
        }
      ]
      logQueries.forEach(async q => {
        const params = {
          logGroupName: q.logGroupName,
          startTime,
          endTime,
          queryString: q.queryString,
          limit: 400
        }
        const queryParam = await this.logs.startQuery(params)

        let res = {
          status: 'Running'
        }

        do {
          await this.sleep(2000)
          res = await this.logs.getQueryResults(queryParam)
        } while (res.status !== 'Complete')
        this[`${q.name}Logs`] = res.results.map(e => {
          const dataLine = {}
          e.forEach(dataEntry => {
            dataLine[dataEntry.field] = dataEntry.value
          })
          return dataLine
        })
      })
    }
  }
}
</script>
