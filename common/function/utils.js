/**
 * 常用方法封装 请求，文件上传等
 * @author yuan. 
 **/

const FormData = require('form-data');

	
import { pathToBase64, base64ToPath} from "@/common/function/image-tools.js"

const utils = {
	/* 
	debug为false时调用unicloud云函数
	*/
	// debug: true,
	debug: false,
	//接口地址
	 formatUrl: function(url) {
	  if (!url) return 'http://110.249.194.209';
	  
	  // 去除首尾空格
	  url = url.trim();
	  
	  // 已经有 http 或 https 则直接返回
	  if (/^https?:\/\//i.test(url)) {
	    return url;
	  }
	  
	  // 没有协议，补上 http://
	  return 'http://' + url;
	},
	
	interfaceUrl: function() {
		if (utils.debug) {
			// return "http://127.0.0.1:8000/customer"
			return "http://127.0.0.1:8000/business"
		} else {
			let url = utils.formatUrl(vk.getVuex('$user.login.url'))
			return url + "/business"
		}
	},
	//图片地址
	imageUrl: function() {
		if (utils.debug) {
			return "http://127.0.0.1:8000/media"
		} else {
			let url = utils.formatUrl(vk.getVuex('$user.login.url'))
			return url + "/media"
		}
	},
	toast: function(text, duration, success) {
		uni.showToast({
			title: text || "出错啦~",
			icon: success ? "success" : "none",
			duration: duration || 2000
		})
	},
	modal: function(title, content, showCancel, callback, confirmColor, confirmText) {
		uni.showModal({
			title: "提示",
			content: content,
			showCancel: showCancel,
			cancelColor: "#555",
			confirmColor: confirmColor || "#5677fc",
			confirmText: confirmText || "确定",
			success(res) {
				if (res.confirm) {
					callback && callback(true)
				} else {
					callback && callback(false)
				}
			}
		})
	},
	/**
	 * 请求数据处理
	 * @param string url 请求地址
	 * @param string method 请求方式
	 *  GET or POST
	 * @param {*} postData 请求参数
	 */
	request: function(url, method, postData, showLoading=true) {
		//接口请求
		return new Promise((resolve, reject) => {
			
			if (showLoading) {
				uni.showLoading({
					title: '请稍候...'
				})
			}
			
			uni.request({
				url: utils.interfaceUrl() + url,
				data: postData,
				header: {
					"content-type": "application/json",
					"Authorization": "JWT " + utils.getToken()
				},
				method: method, //"GET","POST"
				dataType: "json",
				success: (res) => {
					resolve(res.data)
				},
				fail: (res) => {
					utils.toast("网络通讯失败，请稍后再试~")
					reject(res)
				},
				complete() {
					if (showLoading) {
						uni.hideLoading()
					}
				}
			})
		})
	},
	cloudRequest: function(url, method, postData, showLoading=true) {
		
		return new Promise((resolve, reject) => {
			
			if (showLoading) {
				uni.showLoading({
					title: '请稍候...'
				})
			}
			
			uniCloud.callFunction({
				name: "cloudRequest",
				data: {
					"url": utils.interfaceUrl() + url,
					"method": method,
					"postData": postData,
					"token": utils.getToken()
				},
				success: (res) => {
					resolve(res.result)
				},
				fail: (res) => {
					utils.toast("网络通讯失败，请稍后再试~")
					reject(res)
				},
				complete() {
					if (showLoading) {
						uni.hideLoading()
					}
				}
			})
		})
	},
	/*
	 * 封装get/post
	*/
    get: function(url, data, showLoading=true) {
		// if (!vk.getVuex('$user.server_ip')) {
		// 	return new Promise((resolve, reject) => {
		// 		resolve({'': ''})
		// 	})
		// }
		
		if (utils.debug) {
			return utils.request(url, "GET", data, showLoading)
		} else {
			return utils.cloudRequest(url, "GET", data, showLoading)
		}
		
	},
    post: function(url, data, showLoading=true) {
		// if (!vk.getVuex('$user.server_ip')) {
		// 	return new Promise((resolve, reject) => {
		// 		resolve({'': ''})
		// 	})
		// }
		
		if (utils.debug) {
			return utils.request(url, "POST", data, showLoading)
		} else {
			return utils.cloudRequest(url, "POST", data, showLoading)
		}
	},
    upload: function(url, obj) {
		let { action, file, filename, data, headers, onProgress, onSuccess, onError } = obj;
		
		// if (utils.debug) {
			return new Promise((resolve, reject) => {
				let path1 = URL.createObjectURL(file)
				// let imageUrl = URL.createObjectURL(file.raw)
				pathToBase64(
					path1
				).then((base64) => {
					let data = {
						baseUrl: utils.imageUrl(),
						file: base64
					}
					utils.post(
						"/upload/", data
					).then(res => {
						// console.log(res)
						if (res.code == 200) {
							if (typeof onSuccess == "function") onSuccess(res.data);
							resolve(res.data.url)
						} else {
							// this.utils.toast(res.msg)
							if (typeof onError == "function") onError(res);
							reject(res)
						}
						
					}).catch(err => {
						// console.log(err)
						if (typeof onError == "function") onError(err);
						reject(err)
					})
				})
				
				// uploadTask.onProgressUpdate((res) => {
				// 	let progress = res.progress
				// 	if (typeof onProgress == "function") {
				// 		onProgress({
				// 			percent:progress,
				// 			isTrusted:progress >= 100 ? true:false,
				// 			returnValue:progress >= 100 ? true:false,
				// 			total:res.totalBytesSent
				// 		});
				// 	}
				// });
			});
		// } else {
		// 	const form = new FormData()
		// 	form.append("media", file)
		// 	console.log(form.getAll("media"))
		// 	return utils.cloudRequest(url, "upload", form)
		// }
	},
	//获取token
	getToken() {
		// let token = vk.getVuex("$user.token")
		// return token
		return uni.getStorageSync("token")
	},
	// 获取日期
	getDate() {
		let time = new Date()
		let year = time.getFullYear()
		let month = time.getMonth() + 1
		let day = time.getDate()
		if (month >= 1 && month <= 9) {
			month = "0" + month
		}
		if (day >= 0 && day <= 9) {
			day = "0" + day
		}
		return year + '-' + month + '-' + day
	},
	//判断是否登录
	isLogin: function() {
		return uni.getStorageSync("token") ? true : false
	},
	// 清空部分缓存，保留注册绑定信息
	clear() {
		vk.setVuex("$user.login.shop_id", "")
		vk.setVuex("$user.login.shop_name", "")
		vk.setVuex("$user.login.empno", "")
		vk.setVuex("$user.login.password", "")
		vk.setVuex("$user.login.empname", "")
		vk.setVuex("$user.login.emptype", "")
		vk.setVuex("$user.login.emppic", "")
		uni.removeStorageSync("token")
	},
	
}

export default utils
