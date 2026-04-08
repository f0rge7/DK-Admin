<template>
	<view class="page-body">
		<!-- <text class="content">欢迎来到云控制台</text> -->
		<!-- <img src="https://bing.img.run/1920x1080.php" alt="Bing每日壁纸1080P高清" /> -->
	</view>
</template>

<script>
	var that;													// 当前页面对象
	var vk = uni.vk;									// vk实例
	
	export default {
		data() {
			// 页面数据变量
			return {
				// init请求返回的数据
				data:{

				},
				// 表单请求数据
				form1:{

				}
			}
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		onLoad(options = {}) {
			that = this;
			vk = that.vk;
			that.options = options;
			that.init(options);
		},
		// 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
		onReady(){
		
		},
		// 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
		onShow() {


		},
		// 监听 - 页面每次【隐藏时】执行(如：返回)
		onHide() {


		},
		// 函数
		methods: {
			// 页面数据初始化函数
			init(options){
				uni.setNavigationBarTitle({
				  title: vk.getVuex("$user.login.shop_name"),
				});
			},
			pageTo(path){
				vk.navigateTo(path);
			},
      load(e){
        console.log(1,e);
      },
      error(e){
        console.log(2,e);
      }
		},
		// 过滤器
		filters:{

		},
		// 计算属性
		computed:{

		}
	}
</script>
<style lang="scss" scoped>
	.page-body {
		width: 100%;
		height: calc(100vh - 220rpx);
		background: #46d0e7 url(https://bing.img.run/1920x1080.php);
		background-size: cover;
		// img {
		// 	object-fit: fill;
		// 	width: 100%;
		// 	height: 100%;
		// }
	}
</style>
