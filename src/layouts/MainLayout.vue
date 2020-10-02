<template lang="pug">
  q-layout(view="hHh lpR fFf")
    q-header.bg-primary.text-white(elevated)
      q-toolbar
        q-btn(dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen")
        q-toolbar-title
          q-avatar
            img(src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg")
          span.q-ml-sm Email Forwards Manager

    q-drawer(show-if-above v-model="leftDrawerOpen" side="left" bordered)
    q-page-container
      router-view
</template>

<script>

export default {
  name: 'MainLayout',
  data () {
    return {
      leftDrawerOpen: false
    }
  }
}
</script>
