<template>
	<view class="page-body">
		<!-- 页面内容开始 -->

		<!-- 表格搜索组件开始 -->
		<vk-data-table-query
			v-model="queryForm1.formData"
			:columns="queryForm1.columns"
			@search="search"
			:main-columns="['date','doc_id','status']"
		></vk-data-table-query>
		<!-- 表格搜索组件结束 -->

		<!-- 自定义按钮区域开始 -->
		<view>
			<el-row>
				<el-button type="success" size="medium" icon="el-icon-circle-plus-outline" @click="addBtn" v-if="addVisible">添加</el-button>
				<el-button type="warning" size="medium" icon="el-icon-data-analysis" @click="exportBtn" v-if="exportVisible">导出</el-button>
				<!-- 批量操作 -->
				<!-- <el-dropdown v-if="table1.multipleSelection" :split-button="false"	trigger="click" @command="batchBtn">
					<el-button type="danger" size="small" style="margin-left: 20rpx;"
						:disabled="table1.multipleSelection.length === 0"
					>
						批量操作<i class="el-icon-arrow-down el-icon--right"></i>
					</el-button>
					<el-dropdown-menu slot="dropdown">
						<el-dropdown-item :command="1">批量操作1</el-dropdown-item>
						<el-dropdown-item :command="2">批量操作2</el-dropdown-item>
					</el-dropdown-menu>
				</el-dropdown> -->
			</el-row>
		</view>
		<!-- 自定义按钮区域结束 -->

		<!-- 表格组件开始 -->
		<vk-data-table
			ref="table1"
			:data="table1.data"
			:total="data.length"
			:columns="table1.columns"
			:query-form-param="queryForm1"
			:right-btns="rightBtns"
			:selection="true"
			:row-no="true"
			:pagination="true"
			:page-size="pageSize"
			@update="updateBtn"
			@delete="deleteBtn"
			@detail="detailBtn"
			@current-change="currentChange"
			@selection-change="selectionChange"
			@pagination-change="pageChange"
		>
			<template v-slot:doc_id="{ row, column, index }">
				<el-link type="primary" @click="detail(row)">{{ row.doc_id }}</el-link>
			</template>
		</vk-data-table>
		<!-- 表格组件结束 -->

		<!-- 添加或编辑的弹窗开始 -->
		<vk-data-dialog
			v-model="form1.props.show"
			:title="form1.props.title"
			width="90%"
			mode="form"
			:close-on-click-modal="false"
		>
			<vk-data-form
				ref="form1"
				v-model="form1.data"
				:rules="form1.props.rules"
				:action="form1.props.action"
				:form-type="form1.props.formType"
				:columns='form1.props.columns'
				:inline="inLine"
				:columnsNumber="columnsNumber"
				label-width="80px"
				@success="form1.props.show = false;refresh();"
			>
				<!-- 这里是自定义按钮内容 -->
				<template v-slot:footer>
					<el-button @click="form1.props.show = false">取 消</el-button>
					<el-button type="primary" @click="submit(false)">确 定</el-button>
					<el-button type="danger" @click="submit(true)">审 核</el-button>
				</template>
			</vk-data-form>
		</vk-data-dialog>
		<!-- 添加或编辑的弹窗结束 -->

		<!-- 页面内容结束 -->
	</view>
</template>

<script>
	var that;													// 当前页面对象
	var vk = uni.vk;									// vk实例
	var originalForms = {};						// 表单初始化数据
	
	const DOC_LIST = {
		'0': '订单',
		'01': '直供订单',
		'1': '订单验收',
		'2': '直接入库',
		'21': '退厂',
		'3': '盘点',
		'4': '家电送货',
		'5': 'SN码',
		'6': '售后',
		'8': '内部调拨',
		'81': '门店调拨',
		'A': '配送',
		'A1': '退配',
		'B': '售价管理',
		'C': '进价管理'
	}
	
	export default {
		
		props: {
			// 单据类型
			type: {
				type: String,
				default: null
			},
			// 添加按钮
			addVisible: {
				type: Boolean,
				default: true
			},
			// 导出按钮
			exportVisible: {
				type: Boolean,
				default: true
			},
			// 表格右侧按钮
			rightBtns: {
				type: Array,
				default: function() {
					return [
						// 'detail',
						// {
						//     mode:'update',
						//     title:'编辑',
						//     // plain:true,
						//     // round:true,
						//     show: (item)=>{
						//         return item.status == 'N'
						//     }
						// },
						{
							mode:'delete',
							title:'删除',
							show: (item)=>{
								return item.status == "N"
							}
						}
					]
				}
			},
			// 行内表单
			inLine: {
				type: Boolean,
				default: true
			},
			// 每行显示列数
			columnsNumber: {
				type: Number,
				default: 3
			},
			sends: {
				type: Array,
				default: function() {
					return []
				}
			},
			departments: {
				type: Array,
				default: function() {
					return []
				}
			},
			
			table1: {
				type: Object,
				default: function() {
					return {
						action: "",
						columns: [],
						// 多选框选中的值
						multipleSelection:[],
						// 当前高亮的记录
						selectItem:""
					}
				}
			},
			
			queryForm1: {
				type: Object,
				default: function() {
					return {
						// 查询表单数据源，可在此设置默认值
						formData: {},
						// 查询表单的字段规则 fieldName:指定数据库字段名,不填默认等于key
						columns: [],
						sortRule: []
					}
				}
			},
			
			form1: {
				type: Object,
				default: function() {
					return {
						// 表单请求数据，此处可以设置默认值
						data: {},
						// 表单属性
						props: {
							// 表单请求地址
							action:"",
							// 表单字段显示规则
							columns:[],
							// 表单验证规则
							rules:{},
							// add 代表添加 update 代表修改
							formType:"",
							// 是否显示表单的弹窗
							show:false,
						}
					}
				}
			}
		},
		
		// 监听属性
		watch: {
		
		},
		// 过滤器
		filters: {
		
		},
		// 计算属性
		computed: {
			
		},
		
		data() {
			// 页面数据变量
			return {
				// 页面是否请求中或加载中
				loading:false,
				// init请求返回的数据
				data:[],
				statusData: [
					{value: "N", label: "未审核"},
					{value: "S", label: "发货审核"},
					{value: "E", label: "发送审核"},
					{value: "Y", label: "收货审核"},
					{value: "M", label: "捡货"}
				],
				pageSize: 20,
				pageNo: 1,
				empno: vk.getVuex('$user.login.empno'),
				shop_id: vk.getVuex('$user.login.shop_id'),
				hq_id: vk.getVuex('$app.baseData')['总部'],
				// 表单相关结束 -----------------------------------------------------------
			};
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		mounted(options = {}) {
			that = this;
			vk = that.vk;
			that.options = options;
			that.init(options);
		},
		// 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
		onReady() {},
		// 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
		onShow() {},
		// 监听 - 页面每次【隐藏时】执行(如：返回)
		onHide() {},
		// 函数
		methods: {
			// 页面数据初始化函数
			async init(options) {
				originalForms["form1"] = vk.pubfn.copyObject(that.form1);
				await this.getData()
			},
			// 页面跳转
			pageTo(path) {
				vk.navigateTo(path);
			},
			// 页面返回
			pageBack(path){
				const pages = getCurrentPages();
				if (pages.length>1 && pages[0].route !== that.$page.route) {
					vk.navigateBack();
				} else if(path) {
					vk.navigateTo(path);
				}
			},
			// 表单重置
			resetForm(){
				vk.pubfn.resetForm(originalForms, that);
			},
			// 搜索
			search(){
				// console.log(that.queryForm1.formData)
				// that.$refs.table1.search();
				this.getData()
				
			},
			// 刷新
			refresh(){
				that.$refs.table1.refresh();
			},
			// 获取当前选中的行的数据
			getCurrentRow(){
				return that.$refs.table1.getCurrentRow();
			},
			// 监听 - 行的选中高亮事件
			currentChange(val){
				that.table1.selectItem = val;
			},
			// 当选择项发生变化时会触发该事件
			selectionChange(list) {
				that.table1.multipleSelection = list;
			},
			// 显示添加页面
			addBtn(){
				that.resetForm();
				// that.form1.props.action = 'template/db_api/sys/add';
				that.form1.props.formType = 'add';
				that.form1.props.title = '添加';
				that.form1.props.show = true;
				
				if (!['B', 'C'].includes(that.type)) that.getDepartments()
			},
			// 显示修改页面
			updateBtn({ item }){
				// that.form1.props.action = 'template/db_api/sys/update';
				that.form1.props.action = 'submit';
				that.form1.props.formType = 'update';
				that.form1.props.title = '编辑';
				that.form1.props.show = true;
				that.form1.data = item;
				
				if (!['B', 'C'].includes(that.type)) that.getDepartments()
			},
			// 删除按钮
			deleteBtn({ item, deleteFn }){
				deleteFn({
					action: "template/db_api/sys/delete",
					data:{
						_id: item._id
					},
					refresh: true
				});
			},
			// 详情按钮
			detailBtn({ item }) {
				this.detailBtn(item)
			},
			// 监听 - 批量操作的按钮点击事件
			batchBtn(index){
				switch(index){
					case 1: vk.toast("批量操作按钮1"); break;
					case 2: vk.toast("批量操作按钮2"); break;
					default : break;
				}
			},
			exportBtn() {
				let data = this.$refs.table1.getTableFormatterData({key:"title"});
				let menuMap = vk.getVuex('$app.menuMap')
				let fileName = menuMap[menuMap.length - 1].name
				that.$exportExcel(data, fileName)
			},
			
			pageChange(e) {
				let data = this.data.slice((e.pageIndex - 1) * e.pageSize, e.pageIndex * e.pageSize)
				this.table1.data = data
				// this.$refs.table1.setTableData(data);
			},
			
			async getData() {
				let searchData = this.queryForm1.formData
				searchData.start_date = vk.pubfn.timeFormat(searchData.date[0], "yyyy-MM-dd")
				searchData.end_date = vk.pubfn.timeFormat(searchData.date[1], "yyyy-MM-dd")
				
				let data = {
					proc: 'cloud_sp_doc_2',
					data: {
						type: this.type,
						shop_id: this.shop_id,
						empno: this.empno,
						...searchData
					}
				}
				
				await this.utils.post(
					"/call/", data
				).then(resp => {
					if (resp.code == 200) {
						this.data = resp.data
						this.pageChange({pageIndex: 1, pageSize: this.pageSize})
					} else {
						this.table1.data = []
						// console.log(resp)
						// this.utils.toast(resp.msg)
					}
					
				}).catch(err => {
					console.log(err)
				}).finally(() => {
					// this.$refs.search.close()
				})
			},
			
			// 点击doc_id
			async detail(item) {
				
				let data = {
					proc: 'cloud_sp_docdetail_2',
					data: {
						type: this.type,
						shop_id: this.shop_id,
						doc_id: item.doc_id
					}
				}
				
				await this.utils.post(
					"/call/", data
				).then(resp => {
					// console.log(resp)
					if (resp.code == 200) {
						let detail = resp.data
						detail.forEach((item) => {
							item.amount = item.quantity * item.price
							item.cost_amount = item.quantity * item.cost_price
						})
						
						if (item.status == "N") {
							this.updateBtn({
								item: {
									...item,
									detail: detail
								}
							})
						} else {
							item.detail = detail
							this.$refs.table1.showDetail(item);
						}
					} else {
						vk.toast(resp.msg)
						// this.msg = resp.msg
					}
					
				}).catch(err => {
					console.log(err)
				})
				
			},
			
			async getDepartments(showSend=false) {
				
				let send_type = null // 发货部门
				let show_type = null // 收货部门
				let sends = []
				let departments = []
				
				if (this.type == '0' || this.type == '1' || this.type == '2' || this.type == '3' || this.type == '8') {
					// 订单、订单验收、直接入库、内部调拨显示本店柜组
					show_type = '0'
				} else if (this.type == '01') {
					// 直供订单显示门店柜组
					show_type = '2'
				} else if (this.type == '81') {
					// 门店间调拨, 发货部门为当前门店，收货部门为其他门店
					send_type = '0'
					show_type = '3'
					
					// if (showSend) {
					// 	// 发货部门
					// 	show_type = '0'
					// } else {
					// 	show_type = '3'
					// }
				} else if (this.type == 'A') {
					// 配送单，发货部门为当前总部，收货部门为门店
					send_type = '0'
					show_type = '2'
					// if (showSend) {
					// 	show_type = '0'
					// } else {
					// 	show_type = '2'
					// }
				} else if (this.type == 'A1') {
					// 退配单，发货部门为当前门店，收货部门为总部
					send_type = '1'
					if (this.shop_id == this.hq_id) {
						// 退配单在总部新增时，发货部门为门店，收货部门为总部
						show_type = '2'
					} else {
						show_type = '0'
					}
					// if (showSend) {
					// 	show_type = '1'
					// } else {
					// 	if (this.shop_id == this.hq_id) {
					// 		// 退配单在总部新增时，发货部门为门店，收货部门为总部
					// 		show_type = '2'
					// 	} else {
					// 		show_type = '0'
					// 	}
					// }
				}
				
				let data = {
					proc: "cloud_sp_basedata",
					data: {
						empno: this.empno,
						shop_id: this.shop_id,
						cont_lin: this.form1.data.cont_lin,
						cont_id: this.form1.data.cont_id,
						type: 'CONT_DEPARTMENT'
					}
				}
				await this.utils.post(
					"/call/", data, false
				).then(resp => {
					// console.log(resp)
					if (resp.code == 200) {
						if (send_type) {
							sends = resp.data.filter((item) => {
								if (send_type == '0') {
									return item.shop_id == this.shop_id
								} else if (send_type == '1') {
									return item.shop_id == this.hq_id
								} else if (send_type == '2') {
									return item.shop_id != this.hq_id
								} else if (send_type == '3') {
									return item.shop_id != this.hq_id && item.shop_id != this.shop_id
								}
							})
							this.$emit('update:sends', sends)
						}
						departments = resp.data.filter((item) => {
							if (show_type == '0') {
								return item.shop_id == this.shop_id
							} else if (show_type == '1') {
								return item.shop_id == this.hq_id
							} else if (show_type == '2') {
								return item.shop_id != this.hq_id
							} else if (show_type == '3') {
								return item.shop_id != this.hq_id && item.shop_id != this.shop_id
							}
						})
						this.$emit('update:departments', departments)
						
					}
				}).catch(err => {
					console.log(err)
				})
			},
			
			beforeAdd() {
				let validate = true
				for (let key in this.form1.props.rules) {
					this.$refs.form1.validateField(key, (errMsg, arr) => {
					  if (errMsg) {
					    // 未验证通过
						validate = false
					  }
					});
				}
				return validate
			},
			
			// async submit() {
			// 	console.log(that.form1.data)
			// 	return
			// 	let data = {
			// 		proc: "cloud_sp_bonus_mall",
			// 		data: that.form1.data
			// 	}
			// 	await this.utils.post(
			// 		"/call/", data
			// 	).then(res => {
			// 		// console.log(res)
			// 		this.table1.data = res.data
			// 	})
				
			// 	that.form1.props.show = false
			// 	originalForms["form1"] = vk.pubfn.copyObject(that.form1);
			// 	this.refresh()
			// },
			
			
			async submit(isConfirm=false) {
				const {detail=[], ...main} = that.form1.data
				if (detail.length == 0) {
					vk.alert('商品明细不能为空');
					return
				}
				
				vk.confirm('确认提交单据吗？', '提示', '确定', '取消', async res => {
					if (res.confirm) {
						let data = {
							proc: 'cloud_sp_doc_submit',
							data: {
								empno: this.empno,
								shop_id: this.shop_id,
								type: this.type,
								isConfirm: isConfirm,
								main: main,
								detail: detail
							}
						}
						
						await this.utils.post(
							"/call/", data
						).then(resp => {
							// console.log(resp)
							if (resp.code == 200) {
								// this.doc_id = resp.data.doc_id
								vk.toast(resp.msg)
								// if (!that.form1.data.doc_id) {
								// 	that.form1.data.doc_id = resp.data.doc_id
								// 	that.form1.data.datetime = vk.pubfn.timeFormat(new Date(), "yyyy-MM-dd")
								// 	this.table1.data.unshift(that.form1.data)
								// }
								that.form1.props.show = false
								that.getData()
							} else {
								vk.toast(resp.msg)
							}
							
						}).catch(err => {
							console.log(err)
						})
					}
				});
			},
		},
		
	};
</script>
<style lang="scss" scoped>
	.page-body {

	}
</style>
