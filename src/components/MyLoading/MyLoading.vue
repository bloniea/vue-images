<template>
  <div class="my-loading">
    <el-image :src="config.loading_url"></el-image>
  </div>
</template>

<script lang="ts" setup>
import { config } from '@/utils/config'
</script>

<style lang="stylus" scoped>
@import './MyLoading.styl'
</style>
