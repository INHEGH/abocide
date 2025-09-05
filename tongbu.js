
let settingMenu=document.getElementById("setting-menu");
settingMenu.innerHTML=settingMenu.innerHTML+'<hr />'+
					'<a href="#" onclick="backupNowDate()">💾 备份节点</a>'+
					'<a href="#" onclick="tongbuData()">📤 恢复节点</a>';
					
var userid=localStorage.getItem("userid");
async function tongbuData(){
	let data=await getData();
	if(typeof data=="string")data=JSON.parse(data);
	console.log(data)
	createRestoreDialog(data);
}

 // 备份数据
function backupNowDate() {
	const exportObj = {
		groups: [],
		notes: [],
		exportDate: new Date().toISOString()
	};

	const groupsTransaction = db.transaction(['groups'], 'readonly');
	const groupsStore = groupsTransaction.objectStore('groups');
	const groupsRequest = groupsStore.getAll();

	groupsRequest.onsuccess = function() {
		exportObj.groups = groupsRequest.result;
		
		const notesTransaction = db.transaction(['notes'], 'readonly');
		const notesStore = notesTransaction.objectStore('notes');
		const notesRequest = notesStore.getAll();

		notesRequest.onsuccess = function() {
			exportObj.notes = notesRequest.result;
			sendData(exportObj);
		};
		
		notesRequest.onerror = function() {
			showNotification('数据备份失败', 'error');
		};
	};
	
	groupsRequest.onerror = function() {
		showNotification('数据备份失败', 'error');
	};
	
	closeSettingsDropdown();
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
			const response = await fetch("https://netbook.watano.top/netbook/save", requestOptions);

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
			const response = await fetch("https://netbook.watano.top/netbook/get", requestOptions);

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


function createRestoreDialog(dataList) {
  // 创建主DIV容器
  const dialogDiv = document.createElement('div');
  dialogDiv.id = 'restore-dialog';
  dialogDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    padding: 20px;
    min-width: 400px;
  `;

  // 创建表格
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  `;
  
  // 表格头部
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">序号</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">时间</th>
    </tr>
  `;
  
  // 表格主体
  const tbody = document.createElement('tbody');
  
  // 填充数据
  dataList.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="border: 1px solid #ddd; padding: 8px;">
        <input type="radio" name="restore-item" value="${index}" />
        ${index + 1}
      </td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.exportDate}</td>
    `;
    tbody.appendChild(row);
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);

  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    text-align: center;
  `;

  // 创建确认按钮
  const confirmButton = document.createElement('button');
  confirmButton.textContent = '确认';
  confirmButton.style.cssText = `
    margin-right: 10px;
    padding: 8px 16px;
  `;
  confirmButton.onclick = function() {
    const selectedRadio = dialogDiv.querySelector('input[name="restore-item"]:checked');
    if (selectedRadio) {
      const selectedIndex = parseInt(selectedRadio.value);
      restoreData(dataList[selectedIndex]);
    } else {
      alert('请选择一个选项');
    }
  };

  // 创建关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  closeButton.style.cssText = `
    padding: 8px 16px;
  `;
  closeButton.onclick = function() {
    document.body.removeChild(dialogDiv);
  };

  // 组装所有元素
  buttonContainer.appendChild(confirmButton);
  buttonContainer.appendChild(closeButton);
  
  dialogDiv.appendChild(table);
  dialogDiv.appendChild(buttonContainer);
  
  // 添加到页面
  document.body.appendChild(dialogDiv);
  
  return dialogDiv;
}

// 示例 restoreData 方法（需要根据实际需求实现）
function restoreData(selectedItem) {
  window.importedData=selectedItem;
  document.getElementById('importConfirmModal').style.display = 'block';
  console.log('恢复数据:', selectedItem);
  // 实际的数据恢复逻辑在这里实现
  // ...
  
  // 恢复完成后关闭对话框
  const dialog = document.getElementById('restore-dialog');
  if (dialog) {
    document.body.removeChild(dialog);
  }
}
