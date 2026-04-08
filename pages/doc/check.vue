<template>
	<view class="page">
		<view-doc :type="type" :table1="table1" :queryForm1="queryForm1" :form1="form1" :columnsNumber="2" :departments.sync="departments"></view-doc>
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
				type: '3',
				statusData: [
					{value: "N", label: "未审核"},
					{value: "E", label: "执行完成"},
					{value: "Y", label: "已审核"}
				],
				departments: [], // 收货部门
				sends: [], // 发货部门
				// statusData: [
				// 	{value: "N", label: "未审核"},
				// 	{value: "S", label: "发货审核"},
				// 	{value: "E", label: "发送审核"},
				// 	{value: "Y", label: "收货审核"},
				// 	{value: "M", label: "捡货"}
				// ],
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
						{ key:"check_date", title:"盘点日期", type:"text", width:120, sortable: true },
						{ key:"department_name", title:"盘点部门", type:"text", width:200, sortable: true },
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
						{ key:"department_id", title:"盘点部门", type:"text", width:160, mode:"=" },
						{ key:"department_name", title:"盘点名称", type:"text", width:160, mode:"%%" },
						{ key:"check_date", title:"盘点日期", type:"date", dateType:"daterange", width:250, mode:"[]"},
					]
				},
				form1:{
					// 表单请求数据，此处可以设置默认值
					data: {
						status: 'N',
						check_date: vk.pubfn.timeFormat(new Date(), "yyyy-MM-dd")
					},
					// 表单属性
					props: {
						// 表单请求地址
						action:"",
						// 表单字段显示规则
						columns:[
							
							{"key":"doc_id","title":"单据编号","type":"text","width":200,disabled:true},
							// {"key":"datetime","title":"录入时间","type":"text","width":200,disabled:true},
							{"key":"check_date","title":"盘点日期","type":"date","dateType":"date", valueFormat:"yyyy-MM-dd","width":200},
							{
								"key":"department_id","title":"收货部门","type":"select","width":200,
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.departments
								},
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
											if (value) {
												let data = {
													proc: "cloud_sp_basedata",
													data: {
														empno: this.empno,
														shop_id: this.shop_id,
														code: value,
														type: 'CONT_GOODS'
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
										key:"quantity",title:"数量",type:"number", controls:true, precision:2,width:200,
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cost_amount", value * 1 * formData.cost_price);
											$set("amount", value * 1 * formData.price);
										},
										rules:[
											{ required:true, message:"该项不能为空", trigger:["change","blur"] }
										],
									},
									{key:"price",title:"售价",type:"number",width:150, disabled: true},
									{key:"amount",title:"售价金额",type:"number",width:150, disabled: true},
								], oneLine:true
							},
						],
						// 表单验证规则
						rules:{
							check_date:[
								{ required:true, message: "编码不能为空", trigger:"blur" }
							],
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
				
			}
		},
	}
</script>

<style lang="scss">
	
</style>