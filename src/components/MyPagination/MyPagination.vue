<template>
  <div class="my-page">
    <el-pagination
      small
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :pager-count="pagerCount"
      @current-change="currentChange"
      :current-page="currentPage"
      :hide-on-single-page="true"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps({
  total: {
    type: Number,
    require: true
  },
  pageSize: {
    type: Number,
    define: 9
  },
  pagerCount: {
    type: Number,
    define: 5
  },
  currentPage: {
    type: Number,
    define: 1
  }
})
const emit = defineEmits(['currentChange'])
const currentChange = (page: number) => {
  emit('currentChange', page)
}
</script>

<style lang="stylus" scoped>
@import './MyPagination.styl'
</style>
