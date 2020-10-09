<template lang="pug">
.q-pa-md
  q-table(
    dense
    :title="title"
    :data="data"
    :columns="columns"
    :row-key="rowKey"
    :pagination.sync="initialPagination"
    hide-pagination
    :filter="filter"
    :blacklisted="blacklisted"
    :loading="loading"
  )
    template(v-slot:top-right)
      q-input(outlined dense debounce="300" v-model="filter" placeholder="Filter")
        q-icon(slot="append" name="search")
    template(v-slot:body-cell-destinations="props")
      q-td(:props="props")
        q-list(dense)
          q-item(v-for="destination in props.row.destinations" :key="destination")
            q-item-section(no-wrap)
              span {{ destination }}
                q-icon.q-pl-xs(
                  v-if="blacklisted.includes(destination)"
                  size="xs"
                  name="block"
                  color="negative"
                  dense
                )
    template(v-slot:body-cell-active="props")
      q-td(:props="props")
        q-icon(
          size="sm"
          :name="props.row.active ? 'check_circle_outline' : 'highlight_off'"
          :color="props.row.active ? 'positive' : 'negative'"
        )
    template(v-slot:body-cell-action="props")
      q-td(:props="props")
        q-btn-group(flat)
          q-btn(icon="edit" size="sm" @click="editAlias(props.row)")
            q-tooltip Edit
          q-btn(icon="delete" size="sm" text-color="negative" @click="deleteAlias(props.row)")
            q-tooltip Delete
</template>

<script>
export default {
  name: 'ForwardsList',
  data () {
    return {
      filter: '',
      initialPagination: {
        sortBy: this.rowKey,
        descending: false,
        page: 1,
        rowsPerPage: 0
        // rowsNumber: xx if getting data from a server
      }
    }
  },
  methods: {
    editAlias (item) {
      console.log('edit', item.alias)
    },
    deleteAlias (item) {
      console.log('delete', item.alias)
    }
  },
  props: [
    'title',
    'data',
    'rowKey',
    'blacklisted',
    'loading'
  ],
  computed: {
    columns () {
      return [
        {
          name: 'type',
          label: 'Type',
          required: true,
          align: 'left',
          field: row => row.type,
          sortable: true
        },
        {
          name: 'alias',
          label: 'Alias',
          required: true,
          align: 'left',
          field: row => row.alias,
          sortable: true
        },
        {
          name: 'destinations',
          label: 'Destinations',
          required: false,
          align: 'left',
          field: row => row.destinations,
          sortable: false
        },
        {
          name: 'active',
          label: 'Active',
          required: true,
          align: 'left',
          sortable: true
        },
        {
          name: 'action',
          label: 'Action',
          required: false,
          align: 'left',
          sortable: false
        }
      ]
    }
  }
}
</script>
