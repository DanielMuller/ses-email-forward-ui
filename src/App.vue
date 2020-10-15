<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'App',
  meta () {
    return {
      title: this.$t('appName')
    }
  }
}
</script>
