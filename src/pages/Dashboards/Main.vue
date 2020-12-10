<template lang="pug">
q-page(padding)
  .text-h6 {{ $t('overviewDashboard') }}
  div.row.justify-end
    div(style="max-width:300px;min-width:120px")
      q-select(outlined dense options-dense v-model="interval" :label="$t('interval')" :options="intervalOptions" @input="getDashboardData")
    q-btn.q-ml-sm(round icon="cached" @click="getDashboardData")
  div.q-mb-md(v-if="metricsReady >= wantedMetrics.length")
    div.row
      div.col.gt-xs
      div.col
        pie-chart(:chart-data="passspam" :options="pieoptions")
      div.col
        pie-chart(:chart-data="sentbounce" :options="pieoptions")
      div.col.gt-xs

  div.q-mb-md(v-if="metricsReady >= wantedMetrics.length")
    bar-chart(:chart-data="datacollection" :options="options")
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="4")
            .text-h6 {{ $t('rejected') }}
        tr.bg-grey-4
          th.text-left {{ $t('timestamp') }}
          th.text-left {{ $t('reason') }}
          th.text-left {{ $t('rule') }}
          th.text-left {{ $t('score') }}
          th.text-left {{ $t('from') }}
          th.text-left {{ $t('recipient') }}
      tbody
        tr(v-if="rejectedLogs.length===0")
          td(colspan="4") {{ $t('no_messages') }}
        tr(v-for="msg in rejectedLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.reason}}
          td.text-left {{msg.rule}}
          td.text-left {{msg.score}}
          td.text-left {{msg.from}}
          td.text-left {{msg.recipient}}
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="2")
            .text-h6 {{ $t('bounces') }}
        tr.bg-grey-4
          th.text-left {{ $t('timestamp') }}
          th.text-left {{ $t('reason') }}
          th.text-left {{ $t('from') }}
          th.text-left {{ $t('recipient') }}
      tbody
        tr(v-if="bouncesLogs.length===0")
          td(colspan="2") {{ $t('no_messages') }}
        tr(v-for="msg in bouncesLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.reason}}
          td.text-left {{msg.from}}
          td.text-left {{msg.recipient}}
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="3")
            .text-h6 {{ $t('sent') }}
        tr.bg-grey-4
          th.text-left {{ $t('timestamp') }}
          th.text-left {{ $t('from') }}
          th.text-left {{ $t('recipient') }}
      tbody
        tr(v-if="sentLogs.length===0")
          td(colspan="3") {{ $t('no_messages') }}
        tr(v-for="msg in sentLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.from}}
          td.text-left {{msg.recipient}}
  div.q-mb-lg
    q-markup-table
      thead
        tr
          th.text-left(colspan="3")
            .text-h6 {{ $t('error') }}
        tr.bg-grey-4
          th.text-left {{ $t('timestamp') }}
          th.text-left {{ $t('from') }}
          th.text-left {{ $t('recipient') }}
      tbody
        tr(v-if="errorLogs.length===0")
          td(colspan="3") {{ $t('no_messages') }}
        tr(v-for="msg in errorLogs" :key="msg.timestamp")
          td.text-left {{msg.timestamp}}
          td.text-left {{msg.from}}
          td.text-left {{msg.recipient}}
</template>

<script>
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'
import BarChart from 'components/BarChart'
import PieChart from 'components/PieChart'

const datasetsCommon = {
  fill: true,
  data: null,
  barPercentage: 1.0,
  categoryPercentage: 1.0
}

export default {
  name: 'Dashboard',
  data () {
    return {
      cw: null,
      logs: null,
      rejectedLogs: [],
      bouncesLogs: [],
      sentLogs: [],
      errorLogs: [],
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
          label: `12 ${this.$t('hours')}`,
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
        },
        legend: {
          labels: {
            boxWidth: 12
          }
        }
      },
      wantedMetrics: [
        'reject-spam',
        'reject-spamassassin',
        'reject-virus',
        'reject-nomx',
        'reject-dkim',
        'reject-spf',
        'reject-dmarc',
        'bounce-noexist',
        'bounce-blacklisted',
        'delivered-success',
        'delivered-failure'
      ],
      datacollection: {
        datasets: [
          {
            label: this.$t('reject-spam'),
            backgroundColor: '#bc2d02',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-spamassassin'),
            backgroundColor: '#bc2d02',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-virus'),
            backgroundColor: '#a80000',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-nomx'),
            backgroundColor: '#bc2d02',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-dkim'),
            backgroundColor: '#d15a04',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-spf'),
            backgroundColor: '#e68706',
            ...datasetsCommon
          },
          {
            label: this.$t('reject-dmarc'),
            backgroundColor: '#fbb509',
            ...datasetsCommon
          },
          {
            label: this.$t('bounce-noexist'),
            backgroundColor: '#0a84ff',
            ...datasetsCommon
          },
          {
            label: this.$t('bounce-blacklisted'),
            backgroundColor: '#0a16ff',
            ...datasetsCommon
          },
          {
            label: this.$t('delivered-success'),
            backgroundColor: '#009408',
            ...datasetsCommon
          },
          {
            label: this.$t('delivered-failure'),
            backgroundColor: '#bd00b0',
            ...datasetsCommon
          }
        ]
      },
      passspam: {
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            '#2ca02c',
            '#d62728'
          ]
        }],
        labels: [
          'Passed',
          'Rejected'
        ]
      },
      sentbounce: {
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            '#2ca02c',
            '#0a84ff'
          ]
        }],
        labels: [
          'Delivered',
          'Bounced'
        ]
      },
      pieoptions: {
        tooltips: {
          callbacks: {
            label: this.labels
          }
        },
        legend: {
          labels: {
            boxWidth: 12
          }
        }
      }
    }
  },
  components: {
    BarChart,
    PieChart
  },
  beforeMount () {
    const interval = this.$q.localStorage.getItem('dashboardInterval') || 7 * 86400

    this.interval = this.intervalOptions.filter(e => e.value === interval)[0]
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
            this.getDashboardData()
          })
        }
      })
      .catch(err => {}) // eslint-disable-line node/handle-callback-err
  },
  methods: {
    getDashboardData () {
      this.$q.localStorage.set('dashboardInterval', Math.floor(this.interval.value))
      const now = Date.now() / 1000 | 0
      const endTime = Math.ceil(now / this.interval.period) * this.interval.period
      const startTime = endTime - this.interval.value
      this.getMetrics(startTime, endTime)
      this.getLogs(startTime, endTime)
    },
    getMetrics (startTime, endTime) {
      this.options.scales.xAxes[0].ticks.min = new Date(startTime * 1000).toISOString()
      this.options.scales.xAxes[0].ticks.max = new Date(endTime * 1000).toISOString()

      this.wantedMetrics.forEach(metric => {
        const params = {
          StartTime: new Date(startTime * 1000),
          EndTime: new Date(endTime * 1000),
          Namespace: 'SES-Forward',
          MetricName: metric,
          Period: this.interval.period,
          Statistics: ['Sum']
        }
        this.metricsReady = 0
        this.passspam.datasets[0].data = [0, 0]
        this.sentbounce.datasets[0].data = [0, 0]

        this.cw.getMetricStatistics(params).then(res => {
          const i = this.wantedMetrics.lastIndexOf(metric)
          const data = res.Datapoints.map(e => { return { x: e.Timestamp.toISOString(), y: e.Sum } })
          const sum = data.map(e => { return parseInt(e.y) }).reduce((a, b) => a + b, 0)
          for (let j = startTime; j <= endTime; j += this.interval.period) {
            const test = data.filter(el => { return el.x === new Date(j * 1000).toISOString() })
            if (test.length === 0) {
              data.push({ x: new Date(j * 1000).toISOString(), y: null })
            }
          }
          data.sort((a, b) => { return (a.x < b.x) ? 1 : -1 })
          this.datacollection.datasets[i].data = data

          if (metric.startsWith('reject')) {
            this.passspam.datasets[0].data[1] += sum
          } else {
            this.passspam.datasets[0].data[0] += sum
            if (metric.startsWith('delivered')) {
              this.sentbounce.datasets[0].data[0] += sum
            } else {
              this.sentbounce.datasets[0].data[1] += sum
            }
          }
          this.metricsReady++
        })
      })
    },
    sleep (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    async getLogs (startTime, endTime) {
      this.sentLogs = []
      this.errorLogs = []
      this.rejectedLogs = []
      this.bouncesLogs = []

      const logQueries = [
        {
          name: 'rejected',
          logGroupNames: ['/aws/lambda/sesEmailForward-spam', '/aws/lambda/sesEmailForward-spamassassin'],
          queryString: 'fields @timestamp as timestamp,reason,rule,score,from,recipient | filter _logLevel=\'info\' and msg=\'reject\' | sort @timestamp desc | limit 1000'
        },
        {
          name: 'bounces',
          logGroupName: '/aws/lambda/sesEmailForward-process',
          queryString: 'fields @timestamp as timestamp,reason,from,recipient | filter _logLevel=\'info\' and msg=\'bounce\' | sort @timestamp desc | limit 1000'
        },
        {
          name: 'sent',
          logGroupName: '/aws/lambda/sesEmailForward-process',
          queryString: 'fields @timestamp as timestamp,from,recipient| filter _logLevel=\'info\' and msg=\'sendMessage\' and reason=\'success\'| sort @timestamp desc| limit 1000'
        },
        {
          name: 'error',
          logGroupName: '/aws/lambda/sesEmailForward-process',
          queryString: 'fields @timestamp as timestamp,from,recipient| filter _logLevel=\'info\' and msg=\'sendMessage\' and reason=\'failure\'| sort @timestamp desc| limit 1000'
        }
      ]
      logQueries.forEach(async q => {
        const params = {
          startTime,
          endTime,
          queryString: q.queryString,
          limit: 400
        }
        if (q.logGroupNames) {
          params.logGroupNames = q.logGroupNames
        } else {
          params.logGroupName = q.logGroupName
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
    },
    labels (tooltipItem, data) {
      const dataset = data.datasets[tooltipItem.datasetIndex]
      const label = data.labels[tooltipItem.index]
      const total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
        return previousValue + currentValue
      })
      const currentValue = dataset.data[tooltipItem.index]
      const percentage = ((currentValue / total) * 100).toFixed(2)

      return `${label}: ${currentValue} (${percentage}%)`
    }
  }
}
</script>
