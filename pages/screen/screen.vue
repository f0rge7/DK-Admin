<template>
	<view class="screen-full" :style="{ zIndex: isFullScreen ? 99999 : 1 }">
		<view class="dashboard-container" id="dashboard-dom" :class="{ fullActive: isFullScreen }">
			<!-- 顶部标题栏 -->
			<view class="dash-header">
				<view class="header-title">
					<text class="title-text">零售行业实时销售数据驾驶舱</text>
					<text class="sub-text">REAL-TIME RETAIL SALES DASHBOARD</text>
				</view>
				<view class="header-time">{{ currentTime }}</view>
				<view class="header-tools">
					<view class="tool-btn" @click="handleExport" v-if="!isFullScreen">
						<text class="uicon-camera"></text> 导出图片
					</view>
					<view class="tool-btn" @click="toggleFullScreen">
						<text class="uicon-fullscreen"></text> {{ isFullScreen ? '退出全屏' : '全屏展示' }}
					</view>
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
				}
			};
		},
		mounted() {
			this.updateTime();
			this.$nextTick(() => {
				this.initCharts();
				// 首次加载数据
				this.getData();
			});

			// 自动刷新
			this.startDataRefresh();

			// window.addEventListener('resize', this.resizeCharts);
			document.addEventListener('fullscreenchange', this.handleFullScreenChange);
		},
		beforeDestroy() {
			clearInterval(this.timer);
			window.removeEventListener('resize', this.resizeCharts);
			document.removeEventListener('fullscreenchange', this.handleFullScreenChange);
			Object.values(this.charts).forEach(chart => {
				if (chart) chart.dispose();
			});
		},
		methods: {
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
						"/call/", data
					).then(res => {
						console.log(res)
						// 更新顶部卡片数据
						this.cards = res.data.cards
						
						// 更新图表数据
						this.chartData = res.data.charts
						
						console.log(this.chartData.rank.map(item => item.name), this.chartData.rank.map(item => item.value))
						
						// 更新图表显示
						this.setChartOptions();
						
						console.log('数据更新成功', new Date().toLocaleString());
					})
				} catch (e) {
					console.error('API 调用失败:', e);
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
					this.charts.payment = echarts.init(document.getElementById('chart-payment'));
					this.charts.category = echarts.init(document.getElementById('chart-category'));
					this.charts.sales = echarts.init(document.getElementById('chart-sales'));
					this.charts.store = echarts.init(document.getElementById('chart-store'));
					this.charts.rank = echarts.init(document.getElementById('chart-rank'));
					this.charts.traffic = echarts.init(document.getElementById('chart-traffic'));
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
							fontSize: 12
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
							fontSize: 11
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

			/**
			 * 格式化数字（添加千分位）
			 */
			formatNumber(num) {
				return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			},

			toggleFullScreen() {
				// #ifdef H5
				const elem = document.documentElement;

				if (!this.isFullScreen) {
					if (elem.requestFullscreen) elem.requestFullscreen();
					this.isFullScreen = true;
				} else {
					if (document.exitFullscreen) document.exitFullscreen();
					this.isFullScreen = false;
				}
				// #endif
			},

			handleFullScreenChange() {
				if (!document.fullscreenElement) {
					this.isFullScreen = false;
				} else {
					this.isFullScreen = true;
				}
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
			}
		}
	};
</script>

<style lang="scss" scoped>
	$bg-color: #0b1120;
	$card-bg: rgba(20, 30, 60, 0.6);
	$border-color: rgba(0, 234, 255, 0.3);
	$text-primary: #fff;
	$text-secondary: #00eaff;

	.screen-full {
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* 全屏层级最高 */
	.dashboard-container.fullActive {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding-top: 100rpx;
		z-index: 99999 !important;
	}

	.dashboard-container {
		background-color: $bg-color;
		background-image:
			radial-gradient(circle at 50% 50%, rgba(20, 30, 60, 0.8) 0%, rgba(11, 17, 32, 1) 100%),
			linear-gradient(0deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px);
		background-size: 100% 100%, 40px 40px, 40px 40px;
		color: $text-primary;
		padding: 20rpx;
		box-sizing: border-box;
		font-family: 'Microsoft YaHei', sans-serif;
		overflow: hidden;
		transform: none !important;
	}

	.dash-header {
		height: 100rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(to bottom, rgba(0, 234, 255, 0.15), transparent);
		border-bottom: 1px solid $border-color;
		margin-bottom: 20rpx;
		position: relative;

		.header-title {
			text-align: center;
			flex: 1;

			.title-text {
				font-size: 40rpx;
				font-weight: bold;
				color: #00eaff;
				text-shadow:
					0 0 10px rgba(0, 234, 255, 0.8),
					0 0 20px rgba(0, 234, 255, 0.6),
					0 0 30px rgba(0, 234, 255, 0.4);
				display: block;
			}

			.sub-text {
				font-size: 20rpx;
				color: rgba(255, 255, 255, 0.6);
				letter-spacing: 2px;
			}
		}

		.header-time {
			font-size: 28rpx;
			color: $text-secondary;
			font-family: 'Courier New', monospace;
			margin-right: 40rpx;
		}

		.header-tools {
			display: flex;
			gap: 20rpx;

			.tool-btn {
				padding: 10rpx 20rpx;
				border: 1px solid $text-secondary;
				color: $text-secondary;
				border-radius: 4px;
				font-size: 24rpx;
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
		margin-bottom: 20rpx;
		gap: 30rpx;

		.card {
			flex: 0 0 auto;
			width: 280rpx;
			background: $card-bg;
			border: 1px solid rgba(255, 255, 255, 0.1);
			padding: 20rpx;
			position: relative;
			border-radius: 8rpx;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			height: 180rpx;

			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				width: 30px;
				height: 30px;
				border-top: 2px solid $text-secondary;
				border-left: 2px solid $text-secondary;
			}

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				right: 0;
				width: 30px;
				height: 30px;
				border-bottom: 2px solid $text-secondary;
				border-right: 2px solid $text-secondary;
			}

			.card-label {
				font-size: 28rpx;
				color: #fff;
				margin-bottom: 15rpx;
				text-align: center;
			}

			.card-value {
				font-size: 64rpx;
				font-weight: bold;
				color: $text-secondary;
				display: flex;
				align-items: baseline;
				justify-content: center;

				.num {
					font-family: 'Impact', sans-serif;
					text-shadow: 0 0 20px rgba(0, 234, 255, 0.5);
				}

				.unit {
					font-size: 28rpx;
					margin-left: 10rpx;
					color: #fff;
				}
			}

			.card-trend {
				font-size: 28rpx;
				margin-top: 15rpx;
				display: flex;
				align-items: center;
				gap: 5rpx;

				&.up {
					color: #ff3333;
				}

				&.down {
					color: #33ff33;
				}

				.trend-text {
					font-weight: bold;
				}
			}
		}
	}
	
	.dash-charts {
		display: flex;
		height: calc(100vh - 680rpx);
		gap: 20rpx;

		.chart-col {
			display: flex;
			flex-direction: column;
			gap: 20rpx;
		}

		.left-col,
		.right-col {
			flex: 3;
		}

		.center-col {
			flex: 5;
		}

		.chart-box {
			flex: 1;
			background: $card-bg;
			border: 1px solid rgba(0, 234, 255, 0.1);
			border-radius: 8rpx;
			padding: 15rpx;
			position: relative;
			display: flex;
			flex-direction: column;

			.box-title {
				font-size: 30rpx;
				color: #fff;
				padding-left: 20rpx;
				border-left: 4px solid $text-secondary;
				margin-bottom: 10rpx;
				line-height: 1.5;
				font-weight: bold;
			}

			.chart-content {
				flex: 1;
				width: 100%;
				height: 100%;
				min-height: 280px;
			}
		}
	}

	.dash-footer {
		text-align: center;
		font-size: 20rpx;
		color: rgba(255, 255, 255, 0.3);
		margin-top: 20rpx;
		padding-bottom: 20rpx;
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
		z-index: 9999;

		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20rpx;
			color: #fff;
			font-size: 28rpx;

			.uicon-loading {
				font-size: 48rpx;
				animation: rotate 1s linear infinite;
			}
		}
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

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
				height: 160rpx;
				margin: 10rpx;
			}
		}
	}
</style>