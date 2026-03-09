"use strict";

exports.main = async (event, context) => {
	//event为客户端上传的参数
	const res =  await uniCloud.httpclient.request(
		event.url, 
		{
			method: event.method,
			data: event.postData,
			contentType: "json", // 指定以application/json发送data内的数据
			headers: {
				// "content-type": "application/json",
				"Authorization": "JWT " + event.token
			},
			dataType: "json" // 指定返回值为json格式，自动进行parse
		}
	)
	//返回数据给客户端
	return res.data
	
};
