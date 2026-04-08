<template>
	<vk-data-dialog
		v-model="value.show"
		:title="page.title"
		:top="page.top"
		:width="page.width"
		mode="form"
	>
		<!-- 页面主体内容开始 -->
		<vk-data-form
			ref="form1"
			v-model="form1.data"
			:form-type="value.mode"
			:rules="form1.props.rules"
			:action="form1.props.action"
			:columns="form1.props.columns"
			:loading.sync="form1.props.loading"
			:labelWidth="form1.props.labelWidth"
			:before-action="form1.props.beforeAction"
			:show-cancel="page.showCancel"
			:cancel-text="page.cancelText"
			:submit-text="page.submitText"
			@success="onFormSuccess"
		>
			<template v-slot:footer>
				<el-button @click="form1.props.show = false">关闭</el-button>
				<el-button type="primary" @click="submit">修改</el-button>
			</template>
		</vk-data-form>
		<!-- 页面主体内容结束 -->
	</vk-data-dialog>
</template>

<script>
var that; // 当前页面对象
var vk; // vk实例
export default {
	props: {
		value: {
			Type: Object,
			default: function() {
				return {
					show: false,
					mode: "",
					item: ""
				};
			}
		}
	},
	data: function() {
		// 组件创建时,进行数据初始化
		return {
			page: {
				title: "修改密码",
				submitText: "修改",
				cancelText: "关闭",
				showCancel: true,
				top: "14vh",
				width:"500px"
			},
			form1: {
				// 表单请求数据，此处可以设置默认值
				data: {

				},
				// 表单属性
				props: {
					// 表单请求地址
					action: "",
					// 表单字段显示规则
					columns: [
						{ key: "empno", title: "工号", type: "text", disabled:true },
						{ key: "oldPassword", title: "原密码", type: "password" },
						{ key: "newPassword", title: "新密码", type: "password" },
						{ key: "newPassword2", title: "确认新密码", type: "password" },
					],
					// 表单验证规则
					rules: {
						oldPassword:[
							{ required:true, message:'原密码不能为空', trigger:'change' },
							{ validator:uni.vk.pubfn.validator("pwd"), message: '密码长度在6~18之间，只能包含字母、数字和下划线', trigger: 'change' }
						],
						newPassword:[
							{ required:true, message:'新密码不能为空', trigger:'change' },
							{ validator:uni.vk.pubfn.validator("pwd"), message: '密码长度在6~18之间，只能包含字母、数字和下划线', trigger: 'change' }
						],
						newPassword2:[
							{ required:true, message:'请再次输入新密码', trigger:'change' },
							{ validator:uni.vk.pubfn.validator("pwd"), message: '密码长度在6~18之间，只能包含字母、数字和下划线', trigger: 'change' }
						],
					},
					labelWidth: "100px",
					beforeAction:function(data){
						if(data.newPassword !== data.newPassword2){
							vk.toast("两次密码不一样,请检查!","none");
							return false;
						}
					}
				}
			}
		};
	},
	mounted() {
		that = this;
		vk = that.vk;
		that.init();
	},
	methods: {
		// 初始化
		init() {
			let { value } = that;
			that._input(value);
		},
		_input(value){
			that.$emit("input", value);
		},
		// 监听 - 页面打开
		onOpen() {
			that = this;
			let { value={} } = that;
			let { item } = value;
			that.form1.data.empno = vk.getVuex("$user.login.empno");
		},
		// 监听 - 页面关闭
		onClose() {
			that.resetForm();
		},
		// 监听 - 提交成功后
		onFormSuccess() {
			that.close();
			that.$emit("success");
		},
		// 打开页面
		open() {
			let { value } = that;
			value.show = true;
			that._input(value);
		},
		// 关闭页面
		close() {
			let { value } = that;
			value.show = false;
			that._input(value);
		},
		// 表单重置
		resetForm() {
			that.$refs.form1.resetForm();
		},
		// 表单提交
		submitForm() {
			that.$refs.form1.submitForm();
		},
		async submit() {
			let data = {
				'empno': that.form1.data.empno,
				'shop_id': vk.getVuex('$user.login.shop_id'),
				'password': that.form1.data.oldPassword,
				'new_pwd': that.form1.data.newPassword,
			}
			
			await this.utils.post(
				"/login/", data
			).then(resp => {
				// console.log(resp)
				if (resp.code == 200) {
					vk.toast('密码修改成功!')
					this.onFormSuccess()
				} else {
					vk.toast("密码修改失败![" + resp.msg + "]")
				}
			}).catch(err => {
				console.log(err)
			})
		}
	},
	watch: {
		"value.show": {
			handler(newValue, oldValue) {
				let that = this;
				if (newValue) {
					that.onOpen();
				} else {
					that.onClose();
				}
			}
		}
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

</style>
