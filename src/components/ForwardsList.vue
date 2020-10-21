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
    :domain="domain"
  )
    template(v-slot:top-right)
      q-btn.q-mx-md(icon="add" round color="positive" text-color="black" @click="createAlias")
        q-tooltip {{ $t('newRedirection') }}
      q-input(outlined dense debounce="300" v-model="filter" :placeholder="$t('filter')")
        q-icon.cursor-pointer(v-if="filter !== ''" name="close" @click="filter = ''" slot="append")
        q-icon(slot="append" name="search")
    template(v-slot:body-cell-destinations="props")
      q-td(:props="props")
        q-list(dense)
          q-item(v-for="destination in props.row.destinations" :key="destination")
            q-item-section(no-wrap)
              span {{ destination }}
                q-icon.q-pl-xs.cursor-pointer(
                  v-if="blacklisted.includes(destination)"
                  size="xs"
                  name="block"
                  color="negative"
                  dense
                  @click="blacklistDetails(destination)"
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
            q-tooltip {{ $t('edit') }}
          q-btn(icon="delete" size="sm" text-color="negative" @click="confirmDeleteAlias(props.row)")
            q-tooltip {{ $t('delete') }}
  q-dialog(v-model="confirm" persistent)
    q-card
      q-card-section(class="row items-center")
        q-avatar(icon="delete" color="negative" text-color="white")
        span.q-ml-sm Are you sure you want to delete {{ aliasToDelete }} ?

      q-card-actions(align="right")
        q-btn(flat label="Cancel" color="primary" v-close-popup)
        q-btn(flat label="Delete" color="primary" @click="deleteAlias")

  q-dialog(v-model="editDialog" persistent)
    q-card(style="min-width: 400px; max-width:400px")
      q-card-section.row.items-center.q-pb-none
        .text-h6(v-if="!editItem.domain") {{ $t('createNewForward') }}
        .text-h6(v-else) {{ $t('editForward') }}
        q-space
        q-btn(icon="close" flat round dense v-close-popup)
      q-card-section.q-gutter-md
        q-checkbox(v-model="editItem.active" :label="$t('active')")
        q-select(outlined v-model="editItem.type" :options="itemTypeOptions" :label="$t('type')" emit-value :display-value="$t(editItem.type)" :rules="[val => !!val || $t('fieldRequired')]")
        q-input(:readonly="!!editItem.domain" outlined v-model="editItem.alias" type="email" :suffix="'@' + domain" :label="$t('alias')" :rules="[val => !!val || $t('fieldRequired'), val => /^[0-9A-Za-z]+$/.test(val) || $t('invalid_field')]")
        q-select(
          outlined
          v-model="editItem.destinations"
          use-input
          use-chips
          multiple
          input-debouce="0"
          @new-value="destinationsCreateValue"
          :options="destinationsFilterOptions"
          @filter="destinationsFilterFn"
          :rules="[val => !!val || $t('fieldRequired')]"
        )
          template(v-slot:hint)
            div {{ $t('hint_destination') }}
      q-card-actions(align="right")
        q-btn(flat :label="$t('save')" color="primary" @click="saveAlias" :disable="!canSaveAlias")
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
      },
      confirm: false,
      itemToDelete: null,
      editDialog: false,
      editItem: {},
      itemTypeOptions: [
        { label: this.$t('person'), value: 'person' },
        { label: this.$t('group'), value: 'group' },
        { label: this.$t('function'), value: 'function' },
        { label: this.$t('external'), value: 'external' }
      ],
      destinationsFilterOptions: this.availableDests
    }
  },
  methods: {
    editAlias (item) {
      this.editItem = { ...item }
      this.editDialog = true
    },
    confirmDeleteAlias (item) {
      this.confirm = true
      this.itemToDelete = item
    },
    deleteAlias () {
      this.$emit('delete-item', this.itemToDelete)
      this.itemToDelete = null
      this.confirm = false
    },
    saveAlias () {
      if (!this.editItem.domain) {
        this.editItem.domain = this.domain
      }
      this.$emit('put-item', this.editItem)
      this.editItem = {}
      this.editDialog = false
    },
    createAlias () {
      this.editItem = { active: true }
      this.editDialog = true
    },
    destinationsCreateValue (val, done) {
      if (val.length > 0) {
        if (!this.availableDests.includes(val)) {
          this.availableDests.push(val)
        }
        done(val, 'toggle')
      }
    },
    destinationsFilterFn (val, update) {
      update(() => {
        if (val === '') {
          this.destinationsFilterOptions = this.availableDests
        } else {
          const needle = val.toLowerCase()
          this.destinationsFilterOptions = this.availableDests.filter(
            v => v.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    },
    blacklistDetails (destination) {
      this.$emit('display-blacklist-details', destination)
    }
  },
  props: [
    'title',
    'data',
    'rowKey',
    'blacklisted',
    'loading',
    'domain'
  ],
  computed: {
    columns () {
      return [
        {
          name: 'type',
          label: this.$t('type'),
          required: true,
          align: 'left',
          field: row => row.type,
          sortable: true
        },
        {
          name: 'alias',
          label: this.$t('alias'),
          required: true,
          align: 'left',
          field: row => row.alias,
          sortable: true
        },
        {
          name: 'destinations',
          label: this.$t('destinations'),
          required: false,
          align: 'left',
          field: row => row.destinations,
          sortable: false
        },
        {
          name: 'active',
          label: this.$t('active'),
          required: true,
          align: 'left',
          sortable: true
        },
        {
          name: 'action',
          label: this.$t('actions'),
          required: false,
          align: 'left',
          sortable: false
        }
      ]
    },
    aliasToDelete () {
      if (this.itemToDelete) {
        return `${this.itemToDelete.alias}@${this.itemToDelete.domain}`
      } else {
        return ''
      }
    },
    availableDests () {
      return this.data.map(e => { return e.alias })
    },
    canSaveAlias () {
      const aliasValid = (this.editItem.alias && typeof this.editItem.alias === 'string' && this.editItem.alias.trim() !== '')
      const typeValid = (this.editItem.type && typeof this.editItem.type === 'string' && this.editItem.type.trim() !== '')
      const destinationsValid = (this.editItem.destinations && Array.isArray(this.editItem.destinations) && this.editItem.destinations.length > 0)
      return aliasValid && typeValid && destinationsValid
    }
  }
}
</script>
