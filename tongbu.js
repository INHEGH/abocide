
$("#setting-menu").innerHTML=$("#setting-menu").innerHTML+'<a href="#" onclick="tongbuData()">📤 同步数据</a>'
let userid=localStorage.getItem("userid");
function tongbuData(){
	let data=await getData();
	console.log(data)
}
async function sendData(data){
	 try {
			if(!userid){
				return ;
			}
			// 1. 配置 fetch 选项
			const requestOptions = {
				method: 'POST',              // 指定请求方法
				headers: {
					'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 数据
					// 如果需要认证，可以添加 Authorization 头
					'Authorization': 'Bearer '+userid,
				},
				body: JSON.stringify(data)   // 将 JavaScript 对象转换为 JSON 字符串
			};

			// 2. 发送请求并等待响应
			const response = await fetch("/netbook/save", requestOptions);

			// 3. 检查响应状态
			if (!response.ok) {
				// 如果 HTTP 状态码表示错误 (例如 4xx, 5xx)
				throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
			}

			// 4. 解析服务器返回的 JSON 数据
			// 即使请求成功，服务器也可能返回错误信息，最好在这里也处理一下
			let result;
			const contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				 result = await response.json(); // 解析 JSON
			} else {
				 result = await response.text(); // 或者获取纯文本
				 console.warn('Response was not JSON:', result);
			}

			// 5. 处理成功的响应数据
			console.log('Success! Server response:', result);
			// 你可以在这里更新页面UI，提示用户等
			showNotification('数据备份成功');

		} catch (error) {
			// 6. 处理网络错误或在 'try' 块中抛出的错误
			showNotification('数据备份失败', 'error');
		}
}

async function getData(){
	 try {
			if(!userid){
				return ;
			}
			// 1. 配置 fetch 选项
			const requestOptions = {
				method: 'GET',              // 指定请求方法
				headers: {
					'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 数据
					// 如果需要认证，可以添加 Authorization 头
					'Authorization': 'Bearer '+userid,
				}			
			};

			// 2. 发送请求并等待响应
			const response = await fetch("/netbook/get", requestOptions);

			// 3. 检查响应状态
			if (!response.ok) {
				// 如果 HTTP 状态码表示错误 (例如 4xx, 5xx)
				throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
			}

			// 4. 解析服务器返回的 JSON 数据
			// 即使请求成功，服务器也可能返回错误信息，最好在这里也处理一下
			let result;
			const contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				 result = await response.json(); // 解析 JSON
			} else {
				 result = await response.text(); // 或者获取纯文本
				 console.warn('Response was not JSON:', result);
			}
			

			// 5. 处理成功的响应数据
			console.log('Success! Server response:', result);
			return result;
		} catch (error) {
			// 6. 处理网络错误或在 'try' 块中抛出的错误
			showNotification('数据备份失败', 'error');
		}
}
