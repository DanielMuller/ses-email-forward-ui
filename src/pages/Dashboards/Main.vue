<template lang="pug">
q-page(padding)
  .text-h6 {{ $t('overviewDashboard') }}
  div.row.justify-end
    div(style="max-width:300px")
      q-select(outlined dense options-dense v-model="interval" :label="$t('interval')" :options="intervalOptions" @input="getMetrics")
  div(v-if="metricsReady===3")
    bar-chart(:chart-data="datacollection" :options="options")
</template>

<script>
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { colors } from 'quasar'
const { getPaletteColor } = colors
import BarChart from 'components/BarChart'

export default {
  name: 'Dashboard',
  data () {
    return {
      cw: null,
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
              type: 'time',
              stacked: true,
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
            label: 'Pass',
            backgroundColor: getPaletteColor('green-5'),
            fill: true,
            data: null,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            barThinkness: 20,
            lineTension: 0
          },
          {
            label: 'Bounce',
            backgroundColor: getPaletteColor('red-5'),
            fill: true,
            data: null,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            barThinkness: 20,
            lineTension: 0
          },
          {
            label: 'Spam',
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
            this.getMetrics()
          })
        }
      })
      .catch(err => {}) // eslint-disable-line handle-callback-err
  },
  methods: {
    getMetrics () {
      const now = Date.now() / 1000 | 0
      const endTime = Math.ceil(now / this.interval.period) * this.interval.period
      const startTime = endTime - this.interval.value

      const wantedMetrics = [
        'pass',
        'bounce',
        'spam'
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
        this.apexseries = []
        this.cw.getMetricStatistics(params).then(res => {
          const i = wantedMetrics.lastIndexOf(metric)
          const data = res.Datapoints.map(e => { return { x: e.Timestamp.toISOString(), y: e.Sum } })
          for (let i = startTime; i <= endTime; i += this.interval.period) {
            const test = data.filter(el => { return el.x === new Date(i * 1000).toISOString() })
            if (test.length === 0) {
              data.push({ x: new Date(i * 1000).toISOString(), y: null })
            }
          }
          data.sort((a, b) => { return (a.x < b.x) ? 1 : -1 })
          this.datacollection.datasets[i].data = data

          this.apexseries.push({
            name: metric,
            data: data
          })

          this.metricsReady++
        })
      })
    }
  }
}
</script>
