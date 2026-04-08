<template>
	<view class="page">
		<view-doc ref="doc" :type="type" :table1="table1" :queryForm1="queryForm1" :form1="form1" :columnsNumber="3"></view-doc>
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
				type: 'C',
				statusData: [
					{value: "N", label: "未审核"},
					{value: "E", label: "执行完成"},
					{value: "Y", label: "已审核"}
				],
				dataList: [], // 临时数据
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
						{ key:"cont_lin", title:"临时协议", type:"text", width:200, sortable: true },
						{ key:"sup_name", title:"供应商", type:"text", width:200, sortable: true },
						{ key:"send_name", title:"发货部门", type:"text", width:200, sortable: true },
						{ key:"department_name", title:"收货部门", type:"text", width:200, sortable: true },
						{ key:"order_date", title:"订货日期", type:"text", width:120, sortable: true },
						{ key:"start_date", title:"生效日期", type:"text", width:120, sortable: true },
						{ key:"check_date", title:"盘点日期", type:"text", width:120, sortable: true },
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
								{key:"batch",title:"批次号",type:"text",width:150},
								{key:"price",title:"售价",type:"number",width:120, disabled: true},
								{key:"amount",title:"售价金额",type:"number",width:120, disabled: true},
								{key:"member_price",title:"会员价",type:"number",width:120, disabled: true},
								{key:"cost_price",title:"进价",type:"number",width:120},
								{key:"cost_amount",title:"进价金额",type:"number",width:120, disabled: true},
								{key:"tax",title:"进项税",type:"percentage",width:120, disabled: true},
								{key:"rate",title:"扣率",type:"percentage",width:120, disabled: true},
								{key:"new_price",title:"新售价",type:"number",width:120},
								{key:"new_member_price",title:"新会员价",type:"number",width:120},
								{key:"new_cost_price",title:"新进价",type:"number",width:120},
								{key:"new_tax",title:"新进项税",type:"percentage",width:120},
								{key:"new_rate",title:"新扣率",type:"percentage",width:120},
								{key:"ori_quantity",title:"订单数量",type:"number",width:120,disabled:true},
								{key:"quantity",title:"数量",type:"number",width:120},
								{key:"refuse_quantity",title:"拒收数量",type:"number",width:120},
								{key:"manu_date",title:"生产日期",type:"text",width:120},
								{key:"expire_date",title:"保质日期",type:"text",width:120},
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
						{ key:"send_id", title:"发货编码", type:"text", width:160, mode:"=" },
						{ key:"send_name", title:"发货名称", type:"text", width:160, mode:"%%" },
						{ key:"department_id", title:"收货部门", type:"text", width:160, mode:"=" },
						{ key:"department_name", title:"收货名称", type:"text", width:160, mode:"%%" },
						{ key:"order_date", title:"订货日期", type:"date", dateType:"daterange", width:250, mode:"[]"},
						{ key:"start_date", title:"生效日期", type:"date", dateType:"daterange", width:250, mode:"[]"},
						{ key:"check_date", title:"盘点日期", type:"date", dateType:"daterange", width:250, mode:"[]"},
					]
				},
				form1:{
					// 表单请求数据，此处可以设置默认值
					data: {
						status: 'N',
					},
					// 表单属性
					props: {
						// 表单请求地址
						action:"",
						// 表单字段显示规则
						columns:[
							{
								"key":"cont_lin_id","title":"临时协议","type":"table-select",pageSize: 10,
								showRule: (formData) => {
									return !['3', '81', 'B', 'C'].includes(this.type)
								},
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
								watch: async ({ value, formData, column, index, option, $set }) => {
									$set("cont_lin_id", '');
									$set("cont_lin", option.cont_lin);
									$set("cont_id", option.cont_id);
									this.departments = await this.$refs.doc.getDepartments()
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
								showRule: (formData) => {
									return !['3', 'B', 'C'].includes(this.type)
								},
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
								watch: async ({ value, formData, column, index, option, $set }) => {
									$set("cont", '');
									$set("cont_id", option.cont_id);
									this.departments = await this.$refs.doc.getDepartments()
									$set("sup_id", option.sup_id);
									$set("sup_name", option.sup_name);
									$set("wmid", option.wmid);
								}
							},
							{"key":"doc_id","title":"单据编号","type":"text","width":200,disabled:true},
							// {"key":"datetime","title":"录入时间","type":"text","width":200,disabled:true},
							{
								"key":"check_date","title":"盘点日期","type":"date","dateType":"date", valueFormat:"yyyy-MM-dd","width":200,
								showRule: (formData) => {
									return this.type == '3'
								}
							},
							{"key":"start_date","title":"生效日期","type":"date","dateType":"date", valueFormat:"yyyy-MM-dd","width":200},
							{
								"key":"ori_doc","title":"原单据号","type":"text","width":200,
								showRule: (formData) => {
									return this.type == '21'
								},
								watch: async ({ value, formData, column, index, option, $set }) => {
									if (value) {
										let data = {
											proc: "cloud_sp_basedata",
											data: {
												empno: this.empno,
												shop_id: this.shop_id,
												doc_id: value,
												type: 'DOC'
											}
										}
										await this.utils.post(
											"/call/", data
										).then(async resp => {
											if (resp.code == 200) {
												$set("cont_lin", resp.data.cont_lin);
												$set("cont_id", resp.data.cont_id);
												$set("sup_id", resp.data.sup_id);
												$set("sup_name", resp.data.sup_name);
												$set("department_id", resp.data.department_id);
												$set("department_name", resp.data.department_name);
												$set("wmid", resp.data.wmid);
												$set("product_type", resp.data.product_type);
												this.form1.data.detail = resp.data.detail
											}
										}).catch(err => {
											console.log(err)
										})
									}
								},
								
							},
							{
								"key":"cont_lin","title":"临时协议","type":"text-view","width":200,
								showRule: (formData) => {
									return !['3', '81', 'B', 'C'].includes(this.type)
								}
							},
							{
								"key":"cont_id","title":"合同编号","type":"text-view","width":200,
								showRule: (formData) => {
									return !['3', 'B', 'C'].includes(this.type)
								}
							},
							{
								"key":"sup_name","title":"供应商","type":"text-view","width":200,
								showRule: (formData) => {
									return !['3', 'B', 'C'].includes(this.type)
								}
							},
							{
								"key":"wmid","title":"经营方式","type":"select","width":200,disabled:true,
								showRule: (formData) => {
									return !['3', 'B', 'C'].includes(this.type)
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['经营方式']
								}
							},
							{
								"key":"department_id","title":"发货部门","type":"select","width":200,
								showRule: (formData) => {
									return this.type == 'A1'
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.departments
								}
								
							},
							{
								"key":"send_department","title":"收货部门","type":"select","width":200,
								showRule: (formData) => {
									return this.type == 'A1'
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.sends
								}
							},
							{
								"key":"send_department","title":"发货部门","type":"select","width":200,
								showRule: (formData) => {
									return !['3', 'A1', 'B', 'C'].includes(this.type)
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.sends
								}
							},
							{
								"key":"department_id","title":"收货部门","type":"select","width":200,
								showRule: (formData) => {
									return !['3', 'A1', 'B', 'C'].includes(this.type)
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return this.departments
								},
								watch: async ({ value, formData, column, index, option, $set }) => {
									if (value) {
										if ((this.type == '0' || this.type == '01') && this.form1.data.cont_lin) {
											let data = {
												proc: "cloud_sp_basedata",
												data: {
													empno: this.empno,
													shop_id: this.shop_id,
													cont_lin: this.form1.data.cont_lin,
													cont_id: this.form1.data.cont_id,
													department_id: value,
													product_type: this.form1.data.product_type,
													type: 'CONT_GOODS',
													is_check: this.type == '3' ? true : false
												}
											}
											
											await this.utils.post(
												"/call/", data
											).then(async resp => {
												// console.log(resp)
												if (resp.code == 200) {
													// 订单自动列出协议内所有商品
													if (this.form1.data.detail.length == 0) this.form1.data.detail = resp.data
												} else {
													$set('department_id', '')
													vk.alert(resp.msg);
												}
											}).catch(err => {
												console.log(err)
											})
										}
									}
								},
							},
							{
								"key":"order_date","title":"送货日期","type":"date","dateType":"date", valueFormat:"yyyy-MM-dd","width":200,
								showRule: (formData) => {
									return this.type == '1'
								},
							},
							{
								"key":"product_type","title":"商品属性","type":"select","width":200,
								showRule: (formData) => {
									return !['3', 'B', 'C'].includes(this.type)
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['机器类型']
								}
							},
							{
								"key":"loader_id","title":"装卸工","type":"select","width":200,
								showRule: (formData) => {
									return this.type == '1' || this.type == '2'
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['装卸工']
								},
							},
							{
								"key":"delivery_type","title":"送货方式","type":"select","width":200,
								showRule: (formData) => {
									return this.type == '81'
								},
								props: {value: 'value', label: 'text'},
								data:() => {
									return vk.getVuex('$app.baseData')['送货方式']
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
												let main = this.form1.data.main
												let detail = this.form1.data.detail
												let data = {
													proc: "cloud_sp_basedata",
													data: {
														empno: this.empno,
														shop_id: this.shop_id,
														cont_lin: main.cont_lin,
														cont_id: main.cont_id,
														department_id: this.sendVisible && this.type != 'A1' ? main.send_department : main.department_id,
														product_type: main.product_type,
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
														if ((this.type == '0' || this.type == '01') && main.cont_lin) {
															// 订单自动列出协议内所有商品
															if (this.form1.data.detail.length == 0) this.form1.data.detail = resp.data
														} else {
															// 其他仅查询
															for (let key in resp.data[0]) {
																$set(key, resp.data[0][key])
															}
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
										key:"new_price",title:"新售价",type:"number",width:150,
										showRule: (formData) => {
											return this.type == 'B'
										},
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("new_member_price", value * 1);
											$set("new_rate", ((value - formData.cost_price) / value).toFixed(4) * 1)
										},
									},
									{
										key:"new_member_price",title:"新会员价",type:"number",width:150,
										showRule: (formData) => {
											return this.type == 'B'
										},
									},
									{
										key:"new_rate",title:"新扣率",type:"percentage",width:150,
										showRule: (formData) => {
											return this.type == 'B'
										},
									},
									{
										key:"new_cost_price",title:"新进价",type:"number",width:150,
										showRule: (formData) => {
											return this.type == 'C'
										},
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("new_rate", ((formData.price - value) / formData.price).toFixed(4) * 1)
										},
									},
									{
										key:"new_tax",title:"新进项税",type:"percentage",width:150,
										showRule: (formData) => {
											return this.type == 'C'
										},
									},
									{key:"price",title:"售价",type:"number",width:150, disabled: true},
									{
										key:"member_price",title:"会员价",type:"number",width:150, disabled: true,
										showRule: (formData) => {
											return this.type == 'B'
										},
									},
									{
										key:"rate",title:"扣率",type:"percentage",width:150, disabled: true,
										showRule: (formData) => {
											return this.type == 'B'
										},
									},
									{
										key:"cost_price",title:"进价",type:"number",width:150,
										disabled: () => {
											return !['0', '01', '1', '2'].includes(this.type)
										},
										showRule: (formData) => {
											return !['3', 'A', 'A1'].includes(this.type)
										},
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cost_amount", value * 1 * formData.quantity);
										},
									},
									{
										key:"tax",title:"进项税",type:"percentage",width:150, disabled: true,
										showRule: (formData) => {
											return !['3', '8', '81', 'A', 'A1', 'B', 'C'].includes(this.type)
										},
									},
									{
										key:"ori_quantity",title:"订单数量",type:"number",width:150,disabled:true,
										showRule: (formData) => {
											return this.type == '1'
										},
									},
									{
										key:"quantity",title:"数量",type:"number",width:150,
										showRule: (formData) => {
											return !['B', 'C'].includes(this.type)
										},
										watch: ({ value, formData, column, index, option, $set }) => {
											$set("cost_amount", value * 1 * formData.cost_price);
										},
									},
									{
										key:"refuse_quantity",title:"拒收数量",type:"number",width:150,
										showRule: (formData) => {
											return this.type == '1'
										},
										watch: ({ value, formData, column, index, option, $set }) => {
											if (value > formData.ori_quantity) {
												vk.alert('拒收数量不能大于订单数量');
												$set("refuse_quantity", 0)
											} else {
												$set("cost_amount", value * 1 * formData.cost_price);
											}
										},
									},
									{
										key:"cost_amount",title:"进价金额",type:"number",width:150, disabled: true,
										showRule: (formData) => {
											return !['3', 'A', 'A1', 'B', 'C'].includes(this.type)
										},
									},
									{
										key:"amount",title:"售价金额",type:"number",width:150, disabled: true,
										showRule: (formData) => {
											return !['B', 'C'].includes(this.type)
										},
									},
									{
										key:"manu_date",title:"生产日期",type:"date",width:150,
										showRule: (formData) => {
											return ['1', '2'].includes(this.type)
										},
									},
									{
										key:"expire_date",title:"保质日期",type:"date",width:150,
										showRule: (formData) => {
											return ['1', '2'].includes(this.type)
										},
									},
									{
										key:"batch",title:"批次号",type:"table-select",width:150,pageSize: 10,
										showRule: (formData) => {
											return this.type == '21'
										},
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
											{ key: "batch", title: "合同号", type: "text", idKey: true, nameKey: true},
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
							code:[
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
				
			},
		},
	}
</script>

<style lang="scss">
	
</style>