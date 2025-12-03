// 设置上下文菜单项
chrome.runtime.onInstalled.addListener(() => {
  
  chrome.contextMenus.create({
    id: 'IHtoExcel',
    title: 'TableToExcel'
  });
    chrome.contextMenus.create({
    id: 'show_code',
    title: '打印CODE'
  });
});

// 监听上下文菜单项的点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'IHtoExcel') {
    toContent("IH.allTableToExcel");
  }else if (info.menuItemId === 'show_code') {
    toContent("P.showCode");
  }
}); 





chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'crossOriginFetch') {
    handleCrossOriginFetch(request.url, request.options)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    // 返回true表示异步响应
    return true;
  }
});

function toContent(functionName){
	 chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
      {
          chrome.tabs.sendMessage(tabs[0].id, {
				type:"CALL_FUNCTION",
				functionName:functionName
			}, function(response)
          {
              console.log('收到结果：'+response);
          });
      });
	  
}

async function handleCrossOriginFetch(url, options = {}) {
  try {
    // 设置默认选项
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };
    
    // 移除可能引起问题的属性
    delete fetchOptions.url;
    delete fetchOptions.action;
    
    const response = await fetch(url, fetchOptions);
    
    // 根据Content-Type决定如何处理响应
    const contentType = response.headers.get('content-type');
    
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      responseData = await response.text();
    } else {
      // 对于二进制数据，可以返回arrayBuffer的base64编码
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      responseData = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      ok: response.ok
    };
  } catch (error) {
    throw new Error(`Fetch failed: ${error.message}`);
  }
}


// 监听来自content script的消息
console.log("我的插件:background.js加载完成");