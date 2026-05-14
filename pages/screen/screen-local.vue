<template>
	<view class="dashboard-container" id="dashboard-dom" :style="scaleStyle"  :class="{ 'full-screen': isFullScreen }">
		<!-- 顶部标题栏 -->
		<view class="dash-header">
			<view class="header-title">
				<text class="title-text">零售行业实时销售数据驾驶舱</text>
				<text class="sub-text">REAL-TIME RETAIL SALES DASHBOARD</text>
			</view>
			<view class="header-time">{{ currentTime }}</view>
			<view class="header-tools">
				<view class="tool-btn" @click="handleExport">
					<vk-data-icon class="uicon-camera" name="vk-icon-down_light" size="20"></vk-data-icon>
				</view>
				<!-- <view class="tool-btn" @click="toggleFullScreen">
					<text class="uicon-fullscreen"></text> {{ isFullScreen ? '退出全屏' : '全屏展示' }}
				</view> -->
			</view>
		</view>

		<!-- 核心数据卡片 - 居中显示 -->
		<view class="dash-cards">
			<view class="card" v-for="(item, index) in cards" :key="index">
				<view class="card-label">{{ item.label }}</view>
				<view class="card-value">
					<text class="num">{{ item.value }}</text>
					<text class="unit">{{ item.unit }}</text>
				</view>
				<view class="card-trend" :class="item.trend > 0 ? 'up' : 'down'" v-if="item.trend">
					<vk-data-icon name="el-icon-top-right" size="16" v-if="item.trend > 0"></vk-data-icon>
					<vk-data-icon name="el-icon-bottom-right" size="16" v-else></vk-data-icon>
					<text class="trend-text">{{ Math.abs(item.trend) }}%</text>
				</view>
				<view class="card-trend" v-else>
					<text class="trend-text" style="color: transparent;">%</text>
				</view>
				<view class="corner corner-tl"></view>
				<view class="corner corner-br"></view>
			</view>
		</view>

		<!-- 图表区域 -->
		<view class="dash-charts">
			<!-- 左侧：支付方式 & 品类占比 -->
			<view class="chart-col left-col">
				<view class="chart-box">
					<view class="box-title">支付方式占比</view>
					<view id="chart-payment" class="chart-content"></view>
				</view>
				<view class="chart-box">
					<view class="box-title">品类销售占比</view>
					<view id="chart-category" class="chart-content"></view>
				</view>
			</view>

			<!-- 中间：销售趋势 & 门店对比 -->
			<view class="chart-col center-col">
				<view class="chart-box main-chart">
					<view class="box-title">实时销售趋势</view>
					<view id="chart-sales" class="chart-content"></view>
				</view>
				<view class="chart-box">
					<view class="box-title">门店销量对比</view>
					<view id="chart-store" class="chart-content"></view>
				</view>
			</view>

			<!-- 右侧：热销商品 & 客流分析 -->
			<view class="chart-col right-col">
				<view class="chart-box">
					<view class="box-title">热销商品 TOP10</view>
					<view id="chart-rank" class="chart-content"></view>
				</view>
				<view class="chart-box">
					<view class="box-title">24 小时客流分析</view>
					<view id="chart-traffic" class="chart-content"></view>
				</view>
			</view>
		</view>

		<!-- 底部版权 -->
		<view class="dash-footer">
			POWERED BY 大开科技
		</view>

		<!-- 加载状态提示 -->
		<view class="loading-mask" v-if="isLoading">
			<view class="loading-content">
				<text class="uicon-loading"></text>
				<text>数据加载中...</text>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef H5
	import * as echarts from 'echarts';
	import html2canvas from 'html2canvas';
	// #endif

	export default {
		data() {
			return {
				currentTime: '',
				isFullScreen: false,
				timer: null,
				timer1: null,
				charts: {},
				isLoading: false,
				// 顶部卡片数据
				cards: [{
						label: '今日销售额',
						value: '0',
						unit: '元',
						trend: 0
					},
					{
						label: '订单总量',
						value: '0',
						unit: '单',
						trend: 0
					},
					{
						label: '客单价',
						value: '0',
						unit: '元',
						trend: 0
					},
					{
						label: '新增会员',
						value: '0',
						unit: '人',
						trend: 0
					},
				],
				// 图表数据缓存
				chartData: {
					payment: [],
					category: [],
					sales: [],
					store: [],
					rank: [],
					traffic: []
				},
				designWidth: 1920,  // 设计稿宽度
				designHeight: 1080, // 设计稿高度
				// 初始化默认样式
				scaleStyle: {
					width: '1920px',
					height: '1080px',
					position: 'absolute',
					transform: 'scale(1)',
					transformOrigin: 'left top',
					left: '0px',
					top: '0px'
				},
				resizeTimer: null ,// 节流防抖用
				left: 0,
				top: 0,
			};
		},
		mounted() {
			this.updateTime();
			// this.handleResize(); // 初始化缩放
			window.addEventListener('resize', this.debounceResize);
			// document.addEventListener('fullscreenchange', this.handleFullscreenExit);
			
			this.$nextTick(() => {
				this.initCharts();
				// 首次加载数据
				// this.getData();
			});

			// 自动刷新
			this.startDataRefresh();
		},
		beforeDestroy() {
			clearInterval(this.timer);
			window.removeEventListener('resize', this.debounceResize);
			// document.removeEventListener('fullscreenchange', this.handleFullscreenExit);
			Object.values(this.charts).forEach(chart => {
				if (chart) chart.dispose();
			});
		},
		onLoad() {
			var that = this
			window.getData = (data) => {
				console.log(data)
				that.toggleFullScreen()
				that.isLoading = true;
				// 更新顶部卡片数据
				that.cards = data.cards
				
				// 更新图表数据
				that.chartData = data.charts
				
				// 更新图表显示
				that.setChartOptions();
				that.isLoading = false;
				
			}
			//监听由pb发来的消息
	// 		window.chrome.webview.addEventListener("message",
	// 			arg => {
	// 				console.log(arg);
	// 				alert(arg.data);
	// 			});
	
	// 		//异步方式触发pb事件
	// 		document.getElementById("invokeMethodAsyncButton").addEventListener("click", async () => {
	// 			const paramValue = document.getElementById("invokeMethodAsyncParam1").value;
	// 			var json = {
	// 				args: [paramValue, "hello", 3.45, 1234, "async"]
	// 			};
	// 			const resultValue = await pbInvokeEventAsync("ue_invoke", json);
	// 			document.getElementById("invokeMethodAsyncOutput").textContent = resultValue;
	// 		});
		},
		methods: {
			// 新增：处理 ESC 键导致的退出全屏
			handleFullscreenExit() {
				if (!document.fullscreenElement) {
					this.isFullScreen = false;
					uni.setTopWindowStyle({ display: 'block' });
					uni.setLeftWindowStyle({ display: 'block' });
				} else {
					this.isFullScreen = true;
					uni.setTopWindowStyle({ display: 'none' });
					uni.setLeftWindowStyle({ display: 'none' });
				}
			},
			// 防抖处理 resize 事件
			debounceResize() {
				if (this.resizeTimer) clearTimeout(this.resizeTimer);
				this.resizeTimer = setTimeout(() => {
					this.handleResize();
				}, 100);
			},
			handleResize() {
			    // 1. 获取浏览器窗口完整的可用宽高
			    let clientWidth = window.innerWidth;
			    let clientHeight = window.innerHeight;
				console.log(clientWidth, clientHeight)
			    // 2. 只有在【非全屏】状态下，才需要扣除 uni-app 的框架组件
			    if (!this.isFullScreen) {
			        clientWidth -= this.left;
			        clientHeight -= this.top;
			    }
			
			    // 3. 计算等比例缩放（取宽高比例中较小的一个，确保内容不溢出）
			    const scaleX = clientWidth / this.designWidth;
			    const scaleY = clientHeight / this.designHeight;
			    const scale = Math.min(scaleX, scaleY);
			
			    // 4. 计算居中偏移量：(当前可用区域 - 缩放后的内容尺寸) / 2
			    // 这样无论什么分辨率，大屏都会在剩余空间内完美居中
			    const leftOffset = (clientWidth - this.designWidth * scale) / 2;
			    const topOffset = (clientHeight - this.designHeight * scale) / 2;
			
			    // 5. 应用样式
				// this.scaleStyle = {
				// 	width: `${this.designWidth}px`,
				// 	height: `${this.designHeight}px`,
				// 	position: 'absolute',
				// 	transform: `scale(${scale})`,
				// 	transformOrigin: 'left top',
				// 	left: `${leftOffset}px`,
				// 	top: `${topOffset}px`,
				// 	transition: 'all 0.3s ease',
				// 	zIndex: 999 ,// 确保不被其他组件遮挡
				// 	padding: this.isFullScreen ? '5px' : '0px'
				// };
			    this.scaleStyle = {
					width: `${this.designWidth - 1}px`,
					height: `${this.designHeight - 1}px`,
					position: 'absolute',
					transform: `scale(${scaleX}, ${scaleY})`,
					transformOrigin: 'left top',
					left: `0px`,
					top: `0px`,
					transition: 'all 0.3s ease',
					zIndex: 999 ,// 确保不被其他组件遮挡
					overflow: 'hidden'
					// padding: this.isFullScreen ? '5px' : '0px'
				};
				console.log(this.scaleStyle)
			    // 6. 触发 Echarts 重绘
			    this.$nextTick(() => {
			        this.resizeCharts();
			    });
			},

			/**
			 * 启动定时刷新 - 每分钟一次
			 */
			startDataRefresh() {
				// // 清除旧定时器
				// if (this.timer) {
				// 	clearInterval(this.timer);
				// }

				// // 每分钟 (60000ms) 调用一次 API
				// this.timer = setInterval(() => {
				// 	this.getData();
				// }, 60000);
				
				// 清除旧定时器
				if (this.timer1) {
					clearInterval(this.timer1);
				}
				
				// 每秒更新时间
				this.timer = setInterval(() => {
					this.updateTime();
				}, 1000);
				
			},

			// 覆盖原有的全屏切换，触发缩放重算
			toggleFullScreen() {
				if (!this.isFullScreen) {
					
					const docElm = document.documentElement;
					if (docElm.requestFullscreen) docElm.requestFullscreen();
					
					this.isFullScreen = true;
					
					uni.setTopWindowStyle({ display: 'none' });
					uni.setLeftWindowStyle({ display: 'none' });
				} else {
					if (document.exitFullscreen) document.exitFullscreen();
					
					this.isFullScreen = false;
					uni.setTopWindowStyle({ display: 'block' });
					uni.setLeftWindowStyle({ display: 'block' });
				}
				// 必须延迟等待 DOM 和 Window 样式生效后再计算
				setTimeout(() => {
					this.handleResize();
				}, 500);
			},

			handleExport() {
				uni.showLoading({
					title: '生成中...',
					mask: true
				});
				const dom = document.getElementById('dashboard-dom');

				html2canvas(dom, {
					useCORS: true,
					backgroundColor: '#0b1120',
					scale: 2
				}).then(canvas => {
					const link = document.createElement('a');
					link.download = '零售数据大屏_' + new Date().getTime() + '.png';
					link.href = canvas.toDataURL('image/png');
					link.click();
					uni.hideLoading();
					uni.showToast({
						title: '导出成功',
						icon: 'success'
					});
				}).catch(err => {
					console.error(err);
					uni.hideLoading();
					uni.showToast({
						title: '导出失败',
						icon: 'none'
					});
				});
			},

			resizeCharts() {
				Object.values(this.charts).forEach(chart => {
					if (chart) chart.resize();
				});
			},
			
			updateTime() {
				const now = new Date();
				this.currentTime = now.toLocaleString('zh-CN', {
					hour12: false
				});
			},

			/**
			 * 调用 API 获取数据
			 * 每分钟自动调用一次
			 */
			async getData() {
				this.isLoading = true;

				try {
					// 调用 uniCloud 云函数或 API
					let data = {
						proc: "cloud_sp_dashboard",
						data: {
							
						}
					}
					
					await this.utils.post(
						"/call/", data, false
					).then(res => {
						// console.log(res)
						// 更新顶部卡片数据
						this.cards = res.data.cards
						
						// 更新图表数据
						this.chartData = res.data.charts
						
						// 更新图表显示
						this.setChartOptions();
						
						// console.log('数据更新成功', new Date().toLocaleString());
					})
				} catch (e) {
					// console.error('API 调用失败:', e);
					uni.showToast({
						title: '数据加载失败',
						icon: 'none',
						duration: 2000
					});
				} finally {
					this.isLoading = false;
				}
			},

			/**
			 * 更新图表数据缓存
			 */
			updateChartData(apiData) {
				if (!apiData) return;

				this.chartData = {
					payment: apiData.payment || [],
					category: apiData.category || [],
					sales: apiData.sales || [],
					store: apiData.store || [],
					rank: apiData.rank || [],
					traffic: apiData.traffic || []
				};
			},

			/**
			 * 初始化图表
			 */
			initCharts() {
				// #ifdef H5
				try {
					const renderConfig = { renderer: 'svg' };
					this.charts.payment = echarts.init(document.getElementById('chart-payment'), null, renderConfig);
					this.charts.category = echarts.init(document.getElementById('chart-category'), null, renderConfig);
					this.charts.sales = echarts.init(document.getElementById('chart-sales'), null, renderConfig);
					this.charts.store = echarts.init(document.getElementById('chart-store'), null, renderConfig);
					this.charts.rank = echarts.init(document.getElementById('chart-rank'), null, renderConfig);
					this.charts.traffic = echarts.init(document.getElementById('chart-traffic'), null, renderConfig);
				} catch (e) {
					console.error('图表初始化失败:', e);
					uni.showToast({
						title: '图表加载失败',
						icon: 'none'
					});
				}
				// #endif
			},

			/**
			 * 设置图表配置
			 */
			setChartOptions() {
				// #ifdef H5
				const commonTextColor = '#fff';
				const commonGrid = {
					top: '15%',
					left: '3%',
					right: '4%',
					bottom: '3%',
					containLabel: true
				};

				// 1. 支付方式 (饼图)
				this.charts.payment.setOption({
					tooltip: {
						trigger: 'item'
					},
					legend: {
						bottom: 0,
						left: 'center',
						textStyle: {
							color: commonTextColor
						}
					},
					series: [{
						name: '支付渠道',
						type: 'pie',
						radius: ['40%', '70%'],
						avoidLabelOverlap: false,
						itemStyle: {
							borderRadius: 5,
							borderColor: '#0f1c3c',
							borderWidth: 2
						},
						label: {
							show: true,
							position: 'outside',
							color: commonTextColor,
							formatter: '{b}: {d}%'
						},
						labelLine: {
							show: true,
							length: 10,
							length2: 10,
							lineStyle: {
								color: commonTextColor
							}
						},
						data: this.chartData.payment
					}]
				});

				// 2. 品类销售占比 (环状图)
				this.charts.category.setOption({
					tooltip: {
						trigger: 'item'
					},
					legend: {
						bottom: 0,
						left: 'center',
						textStyle: {
							color: commonTextColor,
							fontSize: 12
						},
						itemWidth: 10,
						itemHeight: 10
					},
					series: [{
						name: '品类销售',
						type: 'pie',
						radius: ['35%', '65%'],
						center: ['50%', '55%'],
						avoidLabelOverlap: false,
						itemStyle: {
							borderRadius: 4,
							borderColor: '#0f1c3c',
							borderWidth: 2
						},
						label: {
							show: true,
							position: 'outside',
							color: commonTextColor,
							formatter: '{b}: {d}%'
						},
						labelLine: {
							show: true,
							length: 10,
							length2: 10,
							lineStyle: {
								color: commonTextColor
							}
						},
						data: this.chartData.category
					}]
				});

				// 3. 销售趋势 (面积图)
				this.charts.sales.setOption({
					tooltip: {
						trigger: 'axis'
					},
					grid: commonGrid,
					xAxis: {
						type: 'category',
						boundaryGap: false,
						data: this.chartData.sales.map(item => item.name),
						axisLabel: {
							color: commonTextColor
						}
					},
					yAxis: {
						type: 'value',
						splitLine: {
							show: false
						},
						axisLabel: {
							color: commonTextColor
						}
					},
					series: [{
						name: '销售额',
						type: 'line',
						smooth: true,
						symbol: 'none',
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
									offset: 0,
									color: 'rgba(0, 255, 127, 0.5)'
								},
								{
									offset: 1,
									color: 'rgba(0, 255, 127, 0)'
								}
							])
						},
						itemStyle: {
							color: '#00ff7f'
						},
						data: this.chartData.sales.map(item => item.value)
					}]
				});

				// 4. 门店销量对比 (柱状图)
				this.charts.store.setOption({
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'shadow'
						}
					},
					grid: {
						top: '10%',
						left: '3%',
						right: '4%',
						bottom: '3%',
						containLabel: true
					},
					xAxis: {
						type: 'category',
						data: this.chartData.store.map(item => item.name),
						axisLabel: {
							color: commonTextColor,
							rotate: 0,
							fontSize: 15
						},
						axisLine: {
							lineStyle: {
								color: '#334'
							}
						},
						axisTick: {
							lineStyle: {
								color: '#334'
							}
						}
					},
					yAxis: {
						type: 'value',
						splitLine: {
							lineStyle: {
								color: '#334',
								type: 'dashed'
							}
						},
						axisLabel: {
							color: commonTextColor
						}
					},
					series: [{
						name: '销售额',
						type: 'bar',
						barWidth: '50%',
						itemStyle: {
							borderRadius: [4, 4, 0, 0],
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
									offset: 0,
									color: '#00eaff'
								},
								{
									offset: 0.5,
									color: '#0066ff'
								},
								{
									offset: 1,
									color: 'rgba(0, 102, 255, 0.3)'
								}
							])
						},
						label: {
							show: true,
							position: 'top',
							color: '#fff',
							fontSize: 12,
							formatter: '{c}元'
						},
						data: this.chartData.store.map(item => item.value)
					}]
				});

				// 5. 热销商品 TOP10 (横向柱状图)
				this.charts.rank.setOption({
					tooltip: {
						trigger: 'axis',
						axisPointer: {
							type: 'shadow'
						}
					},
					grid: {
						top: '3%',
						left: '3%',
						right: '10%',
						bottom: '3%',
						containLabel: true
					},
					xAxis: {
						type: 'value',
						show: false,
						min: 0
					},
					yAxis: {
						type: 'category',
						data: this.chartData.rank.map(item => item.name),
						inverse: true,
						axisLabel: {
							color: commonTextColor,
							fontSize: 14
						},
						axisLine: {
							show: false
						},
						axisTick: {
							show: false
						}
					},
					series: [{
						name: '销量',
						type: 'bar',
						data: this.chartData.rank.map(item => item.value),
						itemStyle: {
							borderRadius: [0, 8, 8, 0],
							color: (params) => {
								if (params.dataIndex < 3) {
									const colors = ['#ffcc00', '#ff9900', '#ff6600'];
									return colors[params.dataIndex];
								}
								return new echarts.graphic.LinearGradient(1, 0, 0, 0, [{
										offset: 0,
										color: '#ff0055'
									},
									{
										offset: 1,
										color: '#ff6699'
									}
								]);
							}
						},
						label: {
							show: true,
							position: 'right',
							color: '#fff',
							fontSize: 11,
							formatter: '{c}'
						},
						barWidth: '60%'
					}]
				});

				// 6. 24 小时客流分析
				this.charts.traffic.setOption({
					tooltip: {
						trigger: 'axis'
					},
					grid: {
						...commonGrid,
						top: '15%'
					},
					xAxis: {
						type: 'category',
						data: this.chartData.traffic.map(item => item.name),
						axisLine: {
							lineStyle: {
								color: '#334'
							}
						},
						axisLabel: {
							color: commonTextColor,
							fontSize: 11
						}
					},
					yAxis: {
						type: 'value',
						splitLine: {
							lineStyle: {
								color: '#334',
								type: 'dashed'
							}
						},
						axisLabel: {
							color: commonTextColor
						}
					},
					series: [{
						name: '客流量',
						type: 'bar',
						barWidth: '40%',
						itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
									offset: 0,
									color: '#00eaff'
								},
								{
									offset: 1,
									color: 'rgba(0, 234, 255, 0.1)'
								}
							])
						},
						data: this.chartData.traffic.map(item => item.value)
					}]
				});
				// #endif
			},
		}
	};
</script>

<style lang="scss">
	/* H5端页面根容器 */
	uni-page-body, html, body {
		background-color: #0b1120 !important;
		margin: 0;
		padding: 0;
		// width: 100%;
		// height: 100%;
		overflow: hidden !important;
	}
    
</style>

<style lang="scss" scoped>
	$bg-color: #0b1120;
	$card-bg: rgba(20, 30, 60, 0.6);
	$border-color: rgba(0, 234, 255, 0.3);
	$text-primary: #fff;
	$text-secondary: #00eaff;
	
	.dashboard-container {
		color: $text-primary;
		// padding: 5px; /* 20rpx -> 10px */
		box-sizing: border-box;
		font-family: 'Microsoft YaHei', sans-serif;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		
		// 必须写死，这样 handleResize 才能基于 1080 进行等比缩放
		width: 1920px; 
		height: 1080px; 
		// box-sizing: border-box;
		// padding: 10px; // 统一内边距
	}
	
	.full-screen {
		background-color: $bg-color;
		background-image:
			radial-gradient(circle at 50% 50%, rgba(20, 30, 60, 0.8) 0%, rgba(11, 17, 32, 1) 100%),
			linear-gradient(0deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px);
		background-size: 100% 100%, 40px 40px, 40px 40px;
	}

	.dash-header {
		// height: 50px; /* 100rpx -> 50px */
		flex: 0 0 80px; // 不伸缩，固定占 80px (根据需求微调)
		height: 80px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(to bottom, rgba(0, 234, 255, 0.15), transparent);
		border-bottom: 1px solid $border-color;
		padding: 10px; /* 20rpx -> 10px */
		position: relative;

		.header-title {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			text-align: center;

			.title-text {
				font-size: 20px; /* 40rpx -> 20px */
				font-weight: bold;
				color: #00eaff;
				text-shadow:
					0 0 10px rgba(0, 234, 255, 0.8),
					0 0 20px rgba(0, 234, 255, 0.6),
					0 0 30px rgba(0, 234, 255, 0.4);
				display: block;
			}

			.sub-text {
				font-size: 10px; /* 20rpx -> 10px */
				color: rgba(255, 255, 255, 0.6);
				letter-spacing: 2px;
			}
		}

		.header-time {
			font-size: 14px; /* 28rpx -> 14px */
			color: $text-secondary;
			font-family: 'Courier New', monospace;
			margin-right: 20px; /* 40rpx -> 20px */
		}

		.header-tools {
			display: flex;
			gap: 10px; /* 20rpx -> 10px */

			.tool-btn {
				padding: 5px 10px; /* 10rpx 20rpx -> 5px 10px */
				border: 1px solid $text-secondary;
				color: $text-secondary;
				border-radius: 4px;
				font-size: 12px; /* 24rpx -> 12px */
				cursor: pointer;
				transition: all 0.3s;

				&:active {
					background: $text-secondary;
					color: #000;
				}
			}
		}
	}

	.dash-cards {
		display: flex;
		justify-content: space-around;
		align-items: center;
		// margin: 5px 5px; /* 30px -> 15px 左右 */
		gap: 15px; /* 30rpx -> 15px */
		flex: 0 0 140px; // 稍微调高一点，看起来更舒展
		height: 140px;
		// margin: 15px 0;
		display: flex;

		.card {
			flex: 1; /* 改为 flex: 1 自动分配宽度 */
			min-width: 0; 
			background: $card-bg;
			border: 1px solid rgba(255, 255, 255, 0.1);
			padding: 10px; /* 20rpx -> 10px */
			position: relative;
			border-radius: 4px; /* 8rpx -> 4px */
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			// height: 90px; /* 180rpx -> 90px */

			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				width: 15px;
				height: 15px;
				border-top: 2px solid $text-secondary;
				border-left: 2px solid $text-secondary;
			}

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				right: 0;
				width: 15px;
				height: 15px;
				border-bottom: 2px solid $text-secondary;
				border-right: 2px solid $text-secondary;
			}

			.card-label {
				font-size: 14px; /* 28rpx -> 14px */
				color: #fff;
				margin-bottom: 7px; /* 15rpx -> 7px */
				text-align: center;
			}

			.card-value {
				font-size: 32px; /* 64rpx -> 32px */
				font-weight: bold;
				color: $text-secondary;
				display: flex;
				align-items: baseline;
				justify-content: center;

				.num {
					font-family: 'Impact', sans-serif;
					text-shadow: 0 0 10px rgba(0, 234, 255, 0.5);
				}

				.unit {
					font-size: 14px; /* 28rpx -> 14px */
					margin-left: 5px;
					color: #fff;
				}
			}

			.card-trend {
				font-size: 14px; /* 28rpx -> 14px */
				margin-top: 7px;
				display: flex;
				align-items: center;
				gap: 2px;

				&.up { color: #ff3333; }
				&.down { color: #33ff33; }

				.trend-text { font-weight: bold; }
			}
		}
	}
	
	.dash-charts {
		display: flex;
		height: 0;
		flex: 1;
		// height: 700px; /* 关键：固定设计稿高度，防止退出全屏溢出 */
		gap: 15px; /* 20rpx -> 10px */
		margin: 0;

		.chart-col {
			display: flex;
			flex-direction: column;
			gap: 15px;
			height: 100%; // 占满父级高度
		}

		/* 按照要求调整比例 1:2:1 */
		.left-col,
		.right-col {
			flex: 1;
		}

		.center-col {
			flex: 2;
		}

		.chart-box {
			flex: 1;
			height: 0;
			background: $card-bg;
			border: 1px solid rgba(0, 234, 255, 0.1);
			border-radius: 4px;
			padding: 8px; /* 15rpx -> 8px */
			position: relative;
			display: flex;
			flex-direction: column;
			min-width: 0;

			.box-title {
				font-size: 15px; /* 30rpx -> 15px */
				color: #fff;
				padding-left: 10px;
				border-left: 3px solid $text-secondary;
				margin-bottom: 5px;
				line-height: 1.5;
				font-weight: bold;
			}

			.chart-content {
				flex: 1;
				width: 100%;
				height: 0; /* 必须设为0，由flex撑开 */
				min-width: 0;
			}
		}
	}

	.dash-footer {
		flex: 0 0 40px;
		height: 40px;
		
		text-align: center;
		font-size: 10px; /* 20rpx -> 10px */
		color: rgba(255, 255, 255, 0.3);
		margin-top: 10px;
		// padding-bottom: 10px;
	}

	/* 加载遮罩层 */
	.loading-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(11, 17, 32, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 99999;

		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 10px;
			color: $text-secondary;
			font-size: 20px;

			.uicon-loading {
				font-size: 24px;
				animation: rotate 1s linear infinite;
			}
		}
	}

	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* 适配移动端保持 px 以防万一 */
	@media screen and (max-width: 768px) {
		.dash-charts {
			flex-direction: column;
			height: auto;
		}

		.left-col,
		.center-col,
		.right-col {
			flex: none;
			width: 100%;
			height: 450px;
		}

		.dash-cards {
			flex-wrap: wrap;
			justify-content: center;

			.card {
				width: 45%;
				height: 80px;
				margin: 5px;
				flex: none;
			}
		}
	}
</style>