<template>
	<view class="page">
		<view-doc ref="doc" :type="type" :table1="table1" :queryForm1="queryForm1" :form1="form1" :columnsNumber="3"  :sends.sync="sends" :departments.sync="departments"></view-doc>
	</view>
	
</template>

<script>
	var vk = uni.vk;
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
		data() {
			// 页面数据变量
			return {
				type: 'A',
				statusData: [
					{value: "N", label: "未审核"},
					{value: "S", label: "发货审核"},
					{value: "Y", label: "收货审核"},
					{value: "M", label: "捡货"},
					{value: "E", label: "发送审核"},
					{value: "Q", label: "取消"},
					{value: "F", label: "终止"},
				],
				dataList: [], // 临时数据
				departments: [], // 收货部门
				sends: [], // 发货部门
				// 表格相关开始 -----------------------------------------------------------
				table1: {
					// 表格数据请求地址
					action:"",
					data:[],
					// 表格字段显示规则
					columns:[
						// { key:"_id", title:"id", type:"text", width:220 },
						{ key:"doc_id", title:"单据编号", type:"text", width:200, sortable: true },
						{ key:"status", title:"类型", type:"select", width:100, data:() => {return this.statusData} },
						{ key:"sup_name", title:"供应商", type:"text", width:200, sortable: true },
						{ key:"send_name", title:"发货部门", type:"text", width:200, sortable: true },
						{ key:"department_name", title:"收货部门", type:"text", width:200, sortable: true },
						{ key:"datetime", title:"录入时间", type:"text", width:120, sortable: true },
						{ key:"memo", title:"备注", type:"text", width:200 },
						{
							key:"detail", title:"商品明细", type:"table", itemWidth:260,
							show: ['detail'],
							// 每行每个字段对应的渲染规则
							columns:[
								{key:"code",title:"商品编码",type:"text",width:120},
								{key:"barcode",title:"商品条码",type:"text",width:150},
								{key:"name",title:"商品名称",type:"text",width:200},
								{key:"spec",title:"规格",type:"text",width:200},
								{key:"unit",title:"单位",type:"text",width:80},
								{key:"brand_name",title:"品牌",type:"text",width:150},
								{key:"category_name",title:"类别",type:"text",width:150},
								{key:"quantity",title:"数量",type:"number",width:120},
								{key:"price",title:"售价",type:"number",width:120, disabled: true},
								{key:"amount",title:"售价金额",type:"number",width:120, disabled: true},
								{key:"cost_price",title:"进价",type:"number",width:120},
								{key:"cost_amount",title:"进价金额",type:"number",width:120, disabled: true},
								{key:"tax",title:"进项税",type:"percentage",width:120, disabled: true},
							]
						}
					],
					// 多选框选中的值
					multipleSelection:[],
					// 当前高亮的记录
					selectItem:""
				},
				// 表格相关结束 -----------------------------------------------------------
				// 表单相关开始 -----------------------------------------------------------
				// 查询表单请求数据
				queryForm1:{
					// 查询表单数据源，可在此设置默认值
					formData:{
						start_date: vk.pubfn.timeFormat(new Date(), "yyyy-MM-dd"),
						end_date: vk.pubfn.timeFormat(new Date(), "yyyy-MM-dd"),
						date: [Date.now(), Date.now()]
					},
					// 查询表单的字段规则 fieldName:指定数据库字段名,不填默认等于key
					columns:[
						{ key:"date", title:"录入日期", type:"date", dateType:"daterange", width:250, mode:"[]"},
						{ key:"status", title:"状态", type:"select", width:150, data:() => {return this.statusData}, mode: "=" },
						{ key:"doc_id", title:"单据编号", type:"text", width:160, mode:"=" },
						{ key:"code", title:"商品编码", type:"text", width:160, mode:"=" },
						{ key:"name", title:"商品名称", type:"text", width:160, mode:"%%" },
						{ key:"sup_id", title:"供商编码", type:"text", width:160, mode:"=" },
						{ key:"sup_name", title:"供商名称", type:"text", width:160, mode:"%%" },
						{ key:"send_department", title:"发货部门", type:"text", width:160, mode:"=" },
						{ key:"send_name", title:"发货名称", type:"text", width:160, mode:"%%" },
						{ key:"department_id", title:"收货部门", type:"text", width:160, mode:"=" },
						{ key:"department_name", title:"收货名称", type:"text", width:160, mode:"%%" },
					]
				},
				form1:{
					// 表单请求数据，此处可以设置默认值
					data: {
						status: 'N',
						order_date: vk.pubfn.timeFormat(new Date(), "yyyy-MM-dd"),
						product_type: '0', // 默认正常机
					},
					// 表单属性
					props: {
						// 表单请求地址
						action:"",
						// 表单字段显示规则
						columns:[
							{
								"key":"cont_lin_id","title":"临时协议","type":"table-select",pageSize: 10,
								action: async (obj={})=> {
									
									let {
										// data, // 请求数据
										success, // 成功回调
										fail, // 失败回调
										complete, // 成功回调
									} = obj;
									
									let pageIndex = obj.data.pageIndex
									let pageSize = obj.data.pageSize
									
									if (pageIndex > 1) {
										success({
											rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
											total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore 
										})
									} else {
										let data = {
											proc: 'cloud_sp_basedata',
											data: {
												type: 'CONT_LIN',
												...obj.data.formData
											}
										}
										
										await this.utils.post(
											"/call/", data
										).then(resp => {
											if (resp.code == 200) {
												this.dataList = resp.data
												success({
													rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
													total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore
												});
											}
										}).catch(err => {
											fail(err)
										})
									}
									
									complete()
								},
								columns: [
									{ key: "_id", title: "", type: "text", idKey: true, nameKey: true, show: ['none']},
									{ key: "cont_lin", title: "协议号", type: "text"},
									{ key: "sup_name", title: "供应商", type: "text"},
									{ key: "code", title: "商品编码", type: "text"},
									{ key: "name", title: "商品名称", type: "text"},
									{ key: "spec", title: "规格", type: "text"},
									{ key: "price", title: "售价", type: "number"},
								],
								formData:() => {
									return {
										
									}
									
								},
								queryColumns:[
									{ key: "code", title: "商品编码", type: "text", width: 150, mode: "=" },
									{ key: "name", title: "商品名称", type: "text", width: 150, mode: "*%" },
									{ key: "sup_id", title: "供商编码", type: "text", width: 150, mode: "=" },
									{ key: "sup_name", title: "供商名称", type: "text", width: 150, mode: "%%" },
									{ key: "cont_id", title: "合同号", type: "text", width: 150, mode: "=" },
								],
								watch: ({ value, formData, column, index, option, $set }) => {
									$set("cont_lin_id", '');
									$set("cont_lin", option.cont_lin);
									$set("cont_id", option.cont_id);
									this.$refs.doc.getDepartments()
									$set("sup_id", option.sup_id);
									$set("sup_name", option.sup_name);
									$set("department_id", option.department_id);
									$set("department_name", option.department_name);
									$set("wmid", option.wmid);
									$set("product_type", option.product_type);
									
								}
							},
							{
								"key":"cont","title":"合同","type":"table-select",pageSize: 10,
								action: async (obj={})=> {
									
									let {
										// data, // 请求数据
										success, // 成功回调
										fail, // 失败回调
										complete, // 成功回调
									} = obj;
									
									let pageIndex = obj.data.pageIndex
									let pageSize = obj.data.pageSize
									
									if (pageIndex > 1) {
										success({
											rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
											total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore 
										})
									} else {
										let data = {
											proc: 'cloud_sp_basedata',
											data: {
												type: 'CONT',
												...obj.data.formData
											}
										}
										
										await this.utils.post(
											"/call/", data
										).then(resp => {
											if (resp.code == 200) {
												this.dataList = resp.data
												success({
													rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
													total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore
												});
											}
										}).catch(err => {
											fail(err)
										})
									}
									
									complete()
								},
								columns: [
									{ key: "cont_id", title: "合同号", type: "text", idKey: true},
									{ key: "sup_name", title: "供应商", type: "text", nameKey: true}
								],
								// formData:() => {
								// 	return {
								// 		cont_id: this.form1.data.main.cont_id
								// 	}
									
								// },
								queryColumns:[
									{ key: "code", title: "商品编码", type: "text", width: 150, mode: "=" },
									{ key: "name", title: "商品名称", type: "text", width: 150, mode: "*%" },
									{ key: "sup_id", title: "供商编码", type: "text", width: 150, mode: "=" },
									{ key: "sup_name", title: "供商名称", type: "text", width: 150, mode: "%%" },
									{ key: "cont_id", title: "合同号", type: "text", width: 150, mode: "=" },
								],
								watch: ({ value, formData, column, index, option, $set }) => {
									$set("cont", '');
									$set("cont_id", option.cont_id);
									this.$refs.doc.getDepartments()
									$set("sup_id", option.sup_id);
									$set("sup_name", option.sup_name);
									$set("wmid", option.wmid);
								}
							},
							{"key":"doc_id","title":"单据编号","type":"text","width":200,disabled:true},
							// {"key":"datetime","title":"录入时间","type":"text","width":200,disabled:true},
							{"key":"cont_lin","title":"临时协议","type":"text-view","width":200},
							{"key":"cont_id","title":"合同编号","type":"text","width":200, disabled: true, placeholder: '请选择合同'},
							{"key":"sup_name","title":"供应商","type":"text-view","width":200},
							{
								"key":"wmid","title":"经营方式","type":"select","width":200,disabled:true,
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['经营方式']
								}
							},
							{
								"key":"send_department","title":"发货部门","type":"select","width":200,
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.sends
								},
							},
							{
								"key":"department_id","title":"收货部门","type":"select","width":200,
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.departments
								},
							},
							{
								"key":"product_type","title":"商品属性","type":"select","width":200,
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['机器类型']
								}
							},
							{"key":"memo","title":"备注","type":"text","width":400},
							
							// { key:"", title:"商品信息", type:"bar-title", oneLine: true },
							{
								key:"detail", title:"商品明细", type:"array<object>", itemWidth:260,
								showAdd:true,
								showClear:true,
								showSort:true,
								// showLabel:false,
								// 新增一行时,该行的默认值
								defaultValue:{
									
								},
								rightBtns:[
									// 'copy',
									'delete'
								],
								// 每行每个字段对应的渲染规则
								columns:[
									{key:"code",title:"商品编码",type:"text-view",width:150},
									{
										key:"barcode",title:"商品条码",type:"text",width:200,
										watch: async ({ value, formData, column, index, option, $set }) => {
											if (!this.$refs.doc.beforeAdd()) {
												$set('barcode', '')
												return
											}
											if (value) {
												let data = {
													proc: "cloud_sp_basedata",
													data: {
														empno: this.empno,
														shop_id: this.shop_id,
														cont_lin: this.form1.data.cont_lin,
														cont_id: this.form1.data.cont_id,
														department_id: this.form1.data.department_id,
														product_type: this.form1.data.product_type,
														code: value,
														type: 'CONT_GOODS',
														is_check: this.type == '3' ? true : false
													}
												}
												
												await this.utils.post(
													"/call/", data
												).then(async resp => {
													// console.log(resp)
													if (resp.code == 200) {
														for (let key in resp.data[0]) {
															$set(key, resp.data[0][key])
														}
													} else {
														$set('barcode', '')
														vk.alert(resp.msg);
													}
												}).catch(err => {
													console.log(err)
												})
											}
										},
										isUnique:true,
										rules:[
											{ required:true, message:"该项不能为空", trigger:["change","blur"] }
										]
									},
									{key:"name",title:"商品名称",type:"text-view",width:200},
									{key:"spec",title:"规格",type:"text-view",width:200},
									{key:"unit",title:"单位",type:"text-view",width:200},
									{key:"brand_name",title:"品牌",type:"text-view",width:150},
									{key:"category_name",title:"类别",type:"text-view",width:150},
									{
										key:"cost_price",title:"进价",type:"number",width:150,
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cost_amount", value * 1 * formData.quantity);
										},
									},
									{
										key:"tax",title:"进项税",type:"percentage",width:150, disabled: true,
									},
									{
										key:"quantity",title:"数量",type:"number", controls:true, precision:2,width:200,
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cost_amount", value * 1 * formData.cost_price);
											$set("amount", value * 1 * formData.price);
										},
										rules:[
											{ required:true, message:"该项不能为空", trigger:["change","blur"] }
										],
									},
									{key:"cost_amount",title:"进价金额",type:"number",width:150, disabled: true},
									{key:"price",title:"售价",type:"number",width:150, disabled: true},
									{key:"amount",title:"售价金额",type:"number",width:150, disabled: true},
									{
										key:"batch",title:"批次号",type:"table-select",width:150,pageSize: 10,
										action: async (obj={})=> {
											
											let {
												// data, // 请求数据
												success, // 成功回调
												fail, // 失败回调
												complete, // 成功回调
											} = obj;
											
											let pageIndex = obj.data.pageIndex
											let pageSize = obj.data.pageSize
											let code = this.form1.data.detail[obj.index].code
											
											if (code) {
												if (pageIndex > 1) {
													success({
														rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
														total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore 
													})
												} else {
													let data = {
														proc: 'cloud_sp_basedata',
														data: {
															type: 'BATCH',
															cont_lin: this.form1.data.cont_lin,
															cont_id: this.form1.data.cont_id,
															department_id: this.form1.data.department_id,
															code: code
														}
													}
													
													await this.utils.post(
														"/call/", data
													).then(resp => {
														if (resp.code == 200) {
															this.dataList = resp.data
															success({
																rows: this.dataList.slice((pageIndex - 1) * pageSize, pageIndex * pageSize), // 列表数据
																total: this.dataList.length, // 总记录数（如果没有总记录数，则需要返回getCount和hasMore
															});
														}
													}).catch(err => {
														fail(err)
													})
												}
											}
											
											complete()
										},
										columns: [
											{ key: "batch", title: "批次号", type: "text", idKey: true, nameKey: true},
											{ key: "inventory", title: "数量", type: "number"},
											{ key: "cost_price", title: "进价", type: "number"},
											{ key: "amount", title: "金额", type: "number"}
										],
										// formData: () => {
										// 	return {
										// 		code: ''
										// 	}
										// },
										// formData: {
										// 	code: '',
										// 	index: null
										// },
										queryColumns:[
											// { key: "code", title: "商品编码", type: "text", width: 150, mode: "=" },
										],
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cont", '');
											$set("product_type", option.product_type);
											$set("sup_id", option.sup_id);
											$set("wmid", option.wmid);
											$set("cost_price", option.cost_price);
											$set("inventory", option.inventory);
										}
									},
								], oneLine:true
							},
						],
						// 表单验证规则
						rules:{
							// cont_id:[
							// 	{ required:true, message: "合同编号不能为空", trigger:"blur" }
							// ],
							send_department:[
								{ required:true, message: "发货部门不能为空", trigger:"blur" }
							],
							department_id:[
								{ required:true, message: "收货部门不能为空", trigger:"blur" }
							],
							product_type:[
								{ required:true, message: "商品属性不能为空", trigger:"blur" }
							]
						},
						// add 代表添加 update 代表修改
						formType:"",
						// 是否显示表单的弹窗
						show:false
					}
				},
				// 表单相关结束 -----------------------------------------------------------
			}
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		onLoad(options = {}) {
			vk = uni.vk;
			this.options = options;
			this.init(options);
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
				
			},
		},
	}
</script>

<style lang="scss">
	
</style>