<template>
  <div class="dynamic-popover">
    <el-popover
      ref="dynamic"
      placement="bottom"
      width="600"
      trigger="click">
      <el-table :data="comments" :empty-text="'None'">
        <el-table-column width="100" property="account" label="User"></el-table-column>
        <el-table-column width="150" label="Last Modified">
          <template slot-scope="scope">
            {{transformTime(scope.row.lastModified)}}
          </template>
        </el-table-column>
        <el-table-column width="300" property="comment" label="Comment"></el-table-column>
      </el-table>
    </el-popover>
    <el-button v-popover:dynamic>View History</el-button>
  </div>
</template>
<script>
  import moment from 'moment'
  export default {
    components: {
    },
    props: ['comments', 'actionLabel'],
    name: 'CommentPopover',
    data () {
      return {
      }
    },
    methods: {
      transformTime (time) {
        let result = moment(time).format('DD/MM/YYYY, h:mm')
        return result
      }
    },
    mounted () {
    },
    computed: {
    }
  }
</script>
<style scoped lang='scss'>
</style>
