<template>
	<view class="page-body">
		<!-- 页面内容开始 -->

		<!-- 表格搜索组件开始 -->
		<vk-data-table-query
			v-model="queryForm1.formData"
			:columns="queryForm1.columns"
			@search="search"
		></vk-data-table-query>
		<!-- 表格搜索组件结束 -->

		<!-- 自定义按钮区域开始 -->
		<view>
			<el-row>
				<el-button type="success" size="small" icon="el-icon-circle-plus-outline" @click="addBtn">添加</el-button>
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
				<el-button type="success" size="small" icon="el-icon-edit-outline" style="margin-left: 20rpx;" @click="exportExcel" > 导出xls </el-button>
				<el-button type="success" size="small" icon="el-icon-edit-outline" style="margin-left: 20rpx;" @click="exportExcelAll" > 导出全部 </el-button>
			</el-row>
		</view>
		<!-- 自定义按钮区域结束 -->

		<!-- 表格组件开始 -->
		<vk-data-table
			ref="table1"
			:data="table1.data"
			:columns="table1.columns"
			:query-form-param="queryForm1"
			:right-btns="['detail_auto','update']"
			:right-btns-more="table1.rightBtnsMore"
			:selection="true"
			:row-no="true"
			:pagination="true"
			@update="updateBtn"
			@delete="deleteBtn"
			@current-change="currentChange"
			@selection-change="selectionChange"
		></vk-data-table>
		<!-- 表格组件结束 -->

		<!-- 添加或编辑的弹窗开始 -->
		<vk-data-dialog
			v-model="form1.props.show"
			:title="form1.props.title"
			width="800px"
			mode="form"
			:close-on-click-modal="false"
		>
			<vk-data-form
				v-model="form1.data"
				:rules="form1.props.rules"
				:action="form1.props.action"
				:form-type="form1.props.formType"
				:columns='form1.props.columns'
				label-width="80px"
				@success="form1.props.show = false;refresh();"
			>
				<!-- 这里是自定义按钮内容 -->
				<template v-slot:footer>
					<el-button @click="form1.props.show = false">取 消</el-button>
					<el-button type="primary" @click="submit()">确 定</el-button>
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

	export default {
		data() {
			// 页面数据变量
			return {
				// 页面是否请求中或加载中
				loading:false,
				// init请求返回的数据
				data:{

				},
				// 表格相关开始 -----------------------------------------------------------
				table1:{
					// 表格数据请求地址
					// action:"client/goods/bonusMall/getList",
					data:[],
					// 表格字段显示规则
					columns:[
						// { key:"_id", title:"id", type:"text", width:220 },
						{ key:"doc_id", title:"工单编号", type:"text", width:160, sortable:"custom" },
						{ key:"status_name", title:"工单状态", type:"text", width:100, },
						{ key:"doc_type", title:"服务类型", type:"text", width:100 },
						{ key:"category_name", title:"服务品类", type:"text", width:100 },
						{ key:"brand_name", title:"服务品牌", type:"text", width:100 },
						{ key:"eng_name", title:"工程师", type:"text", width:100 },
						{ key:"name", title:"用户姓名", type:"text", width:100 },
						{ key:"area", title:"区域", type:"text", width:160 },
						{ key:"addr", title:"用户地址", type:"text", width:220 },
						{ key:"memo", title:"备注", type:"text", width:220 },
						{ key:"mobile", title:"联系方式", type:"text", width:100 },
						{ key:"proc_desc", title:"服务描述", type:"text", width:220 },
						{ key:"assign_date", title:"派工时间", type: "text", width: 220, sortable:"custom" },
						{ key:"source", title:"工单来源", type:"text", width:80},
						{ key:"take_date", title:"接单时间", type: "text", width: 200, sortable:"custom" },
						{ key:"dropin_date", title:"上门时间", type: "text", width: 200, sortable:"custom" },
						{ key:"finish_date", title:"完工时间", type: "text", width: 200, sortable:"custom" },
						{ key:"warranty", title:"保修类型", type:"text", width:80 },
						{ key:"voucher", title:"电子凭证", type:"image", width:80 }
					],
					// 多选框选中的值
					multipleSelection:[],
					// 当前高亮的记录
					selectItem:"",
					rightBtnsMore:[
						{
							title:'按钮1',
							onClick:function(item){
								vk.toast(`${item._id}-按钮1`);
							}
						},
						{
							title:'按钮2',
							onClick:function(item){
								vk.toast(`${item._id}-按钮2`);
							}
						}
					]
				},
				// 表格相关结束 -----------------------------------------------------------
				// 表单相关开始 -----------------------------------------------------------
				// 查询表单请求数据
				queryForm1:{
					// 查询表单数据源，可在此设置默认值
					formData:{
						
					},
					// 查询表单的字段规则 fieldName:指定数据库字段名,不填默认等于key
					columns:[
						{ key:"cost_bonus_1", type:"money", title:"积分范围", width:160, placeholder:"请输入最小积分",
							mode:">=", fieldName:"cost_bonus"
						},
						{ key:"cost_bonus_2", type:"money", title:"-", width:160, placeholder:"请输入最大积分",
						 mode:"<=" , fieldName:"cost_bonus"
						},
						{ key:"name", title:"名称", type:"text", width:160, mode:"%%" },
						{
							key:"type", title:"类型", type:"select", width:160,
							data:[
								{value: "1", label: "实物"},
								{value: "2", label: "优惠券"},
								{value: "3", label: "赠品券"}
							]
						}
					]
				},
				form1:{
					// 表单请求数据，此处可以设置默认值
					data: {
						voucher: ""
					},
					// 表单属性
					props: {
						// 表单请求地址
						action:"",
						// 表单字段显示规则
						columns:[
							{ key:"voucher", title:"电子收据", type:"image", limit: 1,
								httpRequest(obj) {
									// let { action, file, filename, data, headers, onProgress, onSuccess, onError } = obj;
									// 获取文件类型(image:图片 video:视频 other:其他)
									this.$utils.upload(
										"/upload/", obj
									).then(res => {
										// console.log(res)
										if (res) that.form1.data.voucher = res
									})
								}
							}
						],
						// 表单验证规则
						rules:{
							code:[
								{ required:true, message: "编码不能为空", trigger:"blur" }
							],
							type:[
								{ required:true, message: "类型不能为空", trigger:"blur" }
							],
							cost_bonus:[
								{ required:true, message:"金额不能为空", trigger:"blur" },
								{ type:"number", message:"金额必须是数字", trigger:"blur" },
							],
							ori_price:[
								// { required:true, message:"金额不能为空", trigger:"blur" },
								{ type:"number", message:"金额必须是数字", trigger:"blur" },
							],
						},
						// add 代表添加 update 代表修改
						formType:"",
						// 是否显示表单的弹窗
						show:false
					}
				},
				formDatas:{},
				// 表单相关结束 -----------------------------------------------------------
				parm: []
			};
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		onLoad(options = {}) {
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
				await this.getParm()
				await this.getDoc()
				originalForms["form1"] = vk.pubfn.copyObject(that.form1);
			},
			
			async getParm() {
				
				let data = {
					"proc": "cloud_sp_aftersale",
					"data": {
						"type": "2"
					}
				}
				
				await this.$utils.post(
					"/call/", data
				).then(resp => {
					if (resp.code == 200) {
						// console.log(resp.data)
						this.parm = resp.data
					}
					
				}).catch(err => {
					console.log(err)
				})
			},
			
			async getDoc() {
				
				let data = {
					proc: "cloud_sp_aftersale",
					data: {
						type: "44"
					}
				}
				
				// console.log(data)
				
				await this.$utils.post(
					"/call/", data
				).then(resp => {
					// console.log(resp)
					if (resp.code == 200) {
						this.table1.data = resp.data
					}
					
				}).catch(err => {
					console.log(err)
				})
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
				console.log(that.$refs.table1)
				that.$refs.table1.search();
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
				that.form1.props.action = 'template/db_api/sys/add';
				that.form1.props.formType = 'add';
				that.form1.props.title = '添加';
				that.form1.props.show = true;
			},
			// 显示修改页面
			updateBtn({ item }){
				// that.form1.props.action = 'template/db_api/sys/update';
				that.form1.props.action = 'submit';
				that.form1.props.formType = 'update';
				that.form1.props.title = '编辑';
				that.form1.props.show = true;
				that.form1.data = item;
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
			// 监听 - 批量操作的按钮点击事件
			batchBtn(index){
				switch(index){
					case 1: vk.toast("批量操作按钮1"); break;
					case 2: vk.toast("批量操作按钮2"); break;
					default : break;
				}
			},
			// 导出xls表格文件（表格当前页数据）
			exportExcel(){
				that.$refs.table1.exportExcel();
			},
			// 导出xls表格文件（全部数据）
			exportExcelAll(){
				that.$refs.table1.exportExcel({
					fileName: "表格全部数据",
					title: "正在导出数据...",
					pageIndex: 1,
					pageSize: -1, // 此值为-1，代表导出所有数据
				});
			},
			async submit(e) {
				
				let data = {
					proc: "cloud_sp_aftersale",
					data: {
						doc_id: that.form1.data.doc_id,
						voucher: that.form1.data.voucher,
						type: "44"
					}
				}
				await this.$utils.post(
					"/call/", data
				).then(res => {
					// console.log(res)
					this.table1.data = res.data
				})
				
				that.form1.props.show = false
				originalForms["form1"] = vk.pubfn.copyObject(that.form1);
				this.refresh()
			},
		},
		// 监听属性
		watch: {

		},
		// 过滤器
		filters: {

		},
		// 计算属性
		computed: {

		}
	};
</script>
<style lang="scss" scoped>
	.page-body {

	}
</style>
