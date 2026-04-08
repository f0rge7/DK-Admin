<template>
	<view class="page-body no-user-select">
		<view class="login-view">
			<!-- <image class="image" :src="vk.getVuex('$app.config.staticUrl.navBar.logo')" mode="aspectFit"></image> -->
			<text class="login-title">{{ isSetting ? '设 置' : '欢迎登录'}}</text>

			<el-form status-icon label-width="60px" class="form-view" v-if="!isSetting">
				<el-form-item label="工 号" prop="empno" class="form-item">
					<el-input class="input" type="text" v-model="empno" placeholder="请输入工号"></el-input>
				</el-form-item>
				<el-form-item label="密 码" prop="password" class="form-item">
					<el-input class="input" type="password" v-model="password" show-password placeholder="请输入密码" maxlength="20" ></el-input>
				</el-form-item>
				<el-form-item label="门 店" prop="shop_id" class="form-item">
					<el-select v-model="shop_id" ref="shop" placeholder="请选择" class="w-100">
					    <el-option
					      v-for="item in shopList"
					      :key="item.department_id"
					      :label="item.name"
					      :value="item.department_id"
						  @click.native="selectShop(item)">
					      <span style="float: left">{{ item.name }}</span>
					      <span style="float: right; color: #8492a6; font-size: 13px">{{ item.department_id }}</span>
					    </el-option>
					</el-select>
				</el-form-item>
				
				<view class="password-box">
					<view class="remember-password">
						<el-checkbox v-model="checked">
							<text class="tips" style="font-size: 12px;">记住密码</text>
						</el-checkbox>
					</view>
					<view class="forget-password">
						<!-- <text @click="forgetPassWord" style="font-size: 12px;">忘记密码？</text> -->
					</view>
				</view>
				<el-button class="login_but" type="primary" @click="submit">登录</el-button>
			</el-form>
			
			<el-form status-icon label-width="100px" class="form-view" v-else>
				<el-form-item label="终端号" prop="terminal_id" class="form-item">
					<el-input class="input" type="text" v-model="terminal_id" placeholder="请输入终端号"></el-input>
				</el-form-item>
				<el-form-item label="授权码" prop="auth_code" class="form-item">
					<el-input class="input" type="text" v-model="auth_code" placeholder="请输入授权码"></el-input>
				</el-form-item>
				<el-form-item label="服务器地址" prop="url" class="form-item">
					<el-input class="input" type="text" v-model="url" placeholder="请输入服务器IP"></el-input>
				</el-form-item>
				<el-button class="login_but" type="primary" @click="submit">保存</el-button>
			</el-form>
			
			<view class="btns-box">
				<text class="setting" @click="isSetting = !isSetting">{{ isSetting ? '返回登录' : '设置'}}</text>
			</view>
			<!-- <view class="btns-box">
				<text @click="shortMessageLogin">短信验证码登录</text>
				<text @click="noCccount">没有账号？</text>
				<text class="register" @click="register">立即注册</text>
			</view> -->
		</view>
	</view>
</template>

<script>
	var that;													// 当前页面对象
	var vk = uni.vk;									// vk实例

	import config from '@/app.config.js'
	export default {
		data() {
			return {
				...config.staticUrl.navBar,
				isSetting: false,
				
				checked: false, // 记住密码
				empno: '', // 工号
				password: '', // 密码
				shop_id: '', // 门店号
				shop_name: '', // 门店名
				
				terminal_id: "", // 终端号
				auth_code: "", // 授权码
				url: "", // 服务器地址
				client_id: "", // 获取客户端推送标识
				shopList: []
			}
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		onLoad(options = {}) {
			that = this;
			vk = that.vk;
			that.options = options;
			that.init(options);
		},
		// 监听 - 页面创建时
		created() {
			that = this;
			vk = that.vk;
		},
		mounted() {

		},
		methods: {
			// 页面初始化
			init() {
				this.checked = vk.getVuex("$user.login.checked") || false
				this.empno = vk.getVuex("$user.login.empno"),
				this.password = vk.getVuex("$user.login.password"),
				this.shop_id = vk.getVuex("$user.login.shop_id"),
				this.shop_name = vk.getVuex("$user.login.shop_name"),
				
				this.terminal_id = vk.getVuex("$user.login.terminal_id") || "6666"
				this.auth_code = vk.getVuex("$user.login.auth_code") || "6666"
				this.url = vk.getVuex("$user.login.url") || "110.249.194.209"
				this.shopList = vk.getVuex("$app.shopList")
			},
			selectShop(e) {
				this.shop_name = e.name
			},
			// 表单提交
			async submit() {
				if (this.isSetting) {
					// 设置
					let url = this.url.replace("：", ":")
					url = url.replace(/^http:\/\//i, '')
					
					vk.setVuex("$user.login.url", url)
					let data = {
						"terminal_id": this.terminal_id,
						"auth_code": this.auth_code,
					}
					
					await this.utils.post(
						"/bind/", data
					).then(resp => {
						if (resp.code == 200) {
							vk.setVuex("$user.login.terminal_id", this.terminal_id)
							vk.setVuex("$user.login.auth_code", this.auth_code)
							vk.setVuex("$app.shopList", resp.data.shops)
							this.shopList = resp.data.shops
							this.utils.toast("绑定成功, 请重新登录!")
							setTimeout(() => {
								this.utils.clear()
								this.init()
								this.isSetting = false
							}, 2000)
							
						} else {
							vk.toast("绑定失败![" + resp.msg + "]")
							// uni.clearStorage()
						}
					})
				} else {
					if (!this.shop_id) {
						this.utils.toast("门店不能为空!")
						return
					}
					let data = {
						"empno": this.empno,
						"password": this.password,
						"shop_id": this.shop_id
					}
					this.utils.post(
						"/login/", data
					).then(resp => {
						if (resp.code == 200) {
							vk.setVuex("$user.login.shop_id", this.shop_id)
							vk.setVuex("$user.login.shop_name", this.shop_name)
							vk.setVuex("$user.login.empno", this.empno)
							vk.setVuex("$user.login.checked", this.checked)
							if (this.checked) {
								vk.setVuex("$user.login.password", this.password)
							} else {
								vk.setVuex("$user.login.password", "")
							}
							vk.setVuex("$user.login.empname", resp.data[0].empname)
							vk.setVuex("$user.login.emptype", resp.data[0].emptype)
							
							// 权限控制
							// if (resp.data[0].functions) {
							// 	uni.setStorageSync("funcList", resp.data[0].functions)
							// }
							
							// if (resp.data[0].emptype == "6") {
							// 	this.utils.getLocation()
							// 	this.utils.getClientId()
							// }
							// uni.setStorageSync("emppic", resp.data[0].emppic)
							if ("token" in resp) {
								uni.setStorageSync("token", resp.token)
							}
							// uni.reLaunch({
							// 	url: '/pages/index/index'
							// })
							// 获取用户自定义信息
							vk.userCenter.login({
								data: {
									username: this.url,
									password: config.loginPwd
								},
								success: data => {
									that.login_success();
								}
							});
						} else {
							this.utils.toast("登陆失败![" + resp.msg + "]")
							this.utils.clear()
						}
					})
					
				}
				
			},
			//登陆成功
			login_success() {
				// 跳转到首页,或页面返回
				getApp().init();
				var pages = getCurrentPages();
				if (pages.length >= 2 &&
					pages[pages.length - 2] &&
					pages[pages.length - 2].route &&
					pages[pages.length - 2].route.indexOf('login/index') == -1
				) {
					vk.reLaunch("/" + pages[pages.length - 2].route);
				} else {
					// 进入首页
					vk.reLaunch("/pages/index/index");
				}
			},
			forgetPassWord() {
				console.log(`忘记密码了`);
				vk.toast("暂不支持","none");
			},
			shortMessageLogin() {
				console.log(`短信登录`);
			},
			noCccount() {
				console.log(`没有账号`);
			},
			register() {
				console.log(`立即注册`);
				vk.toast("暂不支持注册","none");
			},
		}
	}
</script>

<style lang="scss" scoped>
	.page-body {
		width: 100%;
		height: 100vh;
		background: #46d0e7 url(https://bing.img.run/rand.php) no-repeat fixed center center;
		background-size: cover;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		.login-view:hover{
				background-color: rgba(255,255,255,1);
		}
		.login-view {
			width: 100%;
			max-width: 420px;
			border-radius: 7px;
			background-color: rgba(255,255,255,0.8);
			padding: 40px 30px;
			box-sizing: border-box;
			border: 1px solid #f5f5f5;
			box-shadow: 6px 6px 10px 0px #888888;

			::v-deep .input .el-input__inner{
				border: 0 !important;
				background-color: rgba(255,255,255,0);
			}
			
			::v-deep .el-select .el-input__inner {
			  border: none;
			  background-color: rgba(255,255,255,0);
			}
			
			.image {
				display: block;
				width: 64px;
				height: 64px;
				margin: 0 auto;
				margin-bottom: 15px;
				border-radius: 6px;
			}
			.form-view{
				margin-top: 20px;
				.form-item{
					border-bottom: 1px solid #f5f5f5;
				}
			}
			.login-title {
				display: block;
				text-align: center;
				color: #121212;
				font-size: 22px;
				letter-spacing: 2px;
			}
			.login_but {
				width: 100%;
				letter-spacing: 4px;
				font-size: 17px;
			}
			.password-box {
				font-size: 13px;
				color: #b1b1b1;
				margin-bottom: 20px;
				display: flex;
				align-items: center;
				.remember-password{
					flex: 1;
					cursor: pointer;
					user-select: none;
				}
				.forget-password{
					flex: 1;
					text-align: right;
					cursor: pointer;
					user-select: none;
					&:active {
						color: #3a6ffd;
					}
				}
			}
			.tips{
				color: #b1b1b1;
			}
			.btns-box {
				font-size: 16px;
				color: #b1b1b1;
				padding-top:25px;
				display: flex;
				box-sizing: border-box;
				text-align: center;

				text {
					cursor: pointer;

					&:first-of-type {
						flex: 1;
					}

					&:nth-of-type(2) {
						margin-right: 8px;
					}
				}
				.setting{
					color: $uni-color-primary;
				}
			}
		}
	}
</style>
