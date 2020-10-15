<template lang="pug">
  q-dialog(v-model="showDetailLocal" persistent @hide="onHide")
    q-card(style="width:100%;max-width:100vw")
      q-card-section.row.items-center.q-pb-none
        .text-h6 {{ destination }}
        q-space
        q-btn(icon="close" flat round dense v-close-popup)
      q-card-section
        q-markup-table(dense flat)
          thead
            tr
              th.text-left {{ $t('creation') }}
              th.text-left {{ $t('validUntil') }}
              th.text-left {{ $t('reason') }}
              th.text-left {{ $t('actions') }}
              th.text-left {{ $t('type') }}
              th.text-left {{ $t('subType') }} / {{ $t('arrivalDate') }}
              th.text-left {{ $t('status') }} / {{ $t('feedbackId') }}
              th.text-left {{ $t('detail') }} / {{ $t('userAgent') }}
          tbody
            tr.vertical-top(v-for="item in data" :key="item.createdAt")
              td {{ dateFormat(item.createdAt) }}
              td {{ dateFormat(item.validUntil) }}
              td {{ item.type }}
              td {{ item.type === 'bounce' ? item.action : item.complaintFeedbackType }}
              td {{ item.bounceType }}
              td {{ item.type === 'bounce' ? item.bounceSubType : item.arrrivalDate }}
              td {{ item.type === 'bounce' ? item.status : item.feedbackId }}
              td
                pre.q-pa-none.q-ma-none {{ item.type === 'bounce' ? item.diagnosticCode : item.userAgent }}
      q-separator
      q-card-actions(align="right")
        q-btn(color="primary" @click="restore") {{ $t('restore') }}
</template>

<script>
import { date } from 'quasar'

export default {
  name: 'BlacklistedDetail',
  data () {
    return {
      showDetailLocal: false
    }
  },
  props: [
    'destination',
    'data',
    'showDetail'
  ],
  watch: {
    showDetail: function (newVal, oldVal) {
      this.showDetailLocal = newVal
    }
  },
  methods: {
    onHide: function () {
      this.$emit('hide', true)
    },
    dateFormat: function (ts) {
      return date.formatDate(ts * 1000, 'YYYY-MM-DD HH:mm:ss ZZ')
    },
    restore: function () {
      this.$emit('restore', this.destination)
    }
  }
}
</script>
