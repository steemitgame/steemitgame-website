<template>
  <div class='userInfoContainer'>
    <span v-if='$store.state.loggedIn'>
      <avatar :account='accountName'></avatar> <span class='user-name'>{{accountName}}</span>
      <router-link class="fa fa-cog fa-2x fa-fw profile" :to="{name: 'userProfile'}" tag="i" title="Profile"></router-link>
      <el-button class='logout'  @click='logout'>Log out</el-button>
    </span>
    <a class='nav-link loginLink' v-if='!$store.state.loggedIn' @click="loginInfoVisible = true">Log In</a>
    <el-dialog
      title="Login with SteemConnect"
      :visible.sync="loginInfoVisible"
      width="30%">
      <span class="login-tip">You will be redirected to SteemConnect to authenticate to the Steem blockchain. SteemConnect is developed and maintained by Steemit, Inc. and Busy.org.
        Steemgg.com will never access your private keys.By clicking 'Login with SteemConnect', I agree to steemgg's <span class="policyLink" @click="goto('termsOfService')">Terms of Service</span>, <span class="policyLink" @click="goto('privacy')" tag="a">Privacy Policy</span> and <span class="policyLink" @click="goto('cookiePolicy')" tag="a">Cookie Policy</span>.</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="loginInfoVisible = false">Close</el-button>
    <el-button type="primary" @click="login">Login with SteemConnect</el-button>
  </span>
    </el-dialog>
  </div>
</template>
<script>
  import Avatar from '../shared/Avatar'
  import GameService from '../../service/game.service'
  const gameService = new GameService()

  export default {
    components: {
      Avatar
    },
    name: 'UserInfo',
    data () {
      return {
        loggedIn: false,
        loading: false,
        testMode: false,
        loginInfoVisible: false
      }
    },
    methods: {
      logout () {
        if (this.testMode) {
          this.$store.commit('deleteUser')
          this.loggedIn = false
        } else {
          this.loading = true
          gameService.logout().then(response => {
            this.$message.success('log out successfully')
            this.$store.commit('deleteUser')
          }).finally(() => {
            this.loading = false
          })
        }
      },
      goto (name) {
        this.loginInfoVisible = false
        this.$router.push({
          name: name
        })
      },
      login () {
        this.loginInfoVisible = false
        window.location.href = 'https://steemconnect.com/oauth2/authorize?client_id=' + process.env.APP_ID + '&redirect_uri=' + encodeURIComponent((process.env.API_SERVER_URL.endsWith('/') ? process.env.API_SERVER_URL.slice(0, -1) : process.env.API_SERVER_URL) + '/callback') + '&scope=login,vote,comment,delete_comment,comment_options,custom_json,claim_reward_balance&state=' + window.location.href
      }
    },
    mounted () {
      if (this.testMode) {
        this.$store.commit('setUser', {
          'id': 15,
          'account': 'stg.admin',
          'userid': 729275,
          'role': 2,
          'status': 1,
          'created': '2018-0202T08:41:28Z'
        })
        this.loggedIn = true
      } else {
        this.loading = true
        gameService.fetchUser().then(response => {
          console.log('user logged in')
          this.$store.commit('setUser', response.data)
          this.loggedIn = true
          this.loading = false
        }).catch(error => {
          this.loggedIn = false
          console.log(error.response)
          this.$store.commit('deleteUser')
          this.loading = false
        })
      }
    },
    computed: {
      accountName () {
        return this.$store.getters.user.account
      }
    }
  }
</script>
<style scoped lang='scss'>
  .userInfoContainer {
    margin-left: 20px;
    color: white;
    .loginLink {
      cursor: pointer;
      font-size: 14px;
    }
    .avatar {
      margin-right: 15px;
    }
    .user-name {
      font-size: 16px;
      font-weight: bold;
    }
    .logout {
      margin-left: 20px;
    }

    .profile {
      cursor: pointer;
    }
  }
  .policyLink {
    color: #007bff;
    &:hover {
      color: #0056b3;
      cursor: pointer;
      text-decoration: underline;
    }
  }
  .login-tip {
    display: inline;
  }
</style>
