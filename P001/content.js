// 监听来自页面的postMessage
console.log("dddddd",chrome.runtime,window);// 监听来自页面的postMessage




// 监听来自页面的postMessage
window.addEventListener('message', async (event) => {console.log("********event*********",event);
  // 不验证来源，因为 file:// 协议下 origin 是 "null" 字符串
  const data = event.data;
  
  // 检查是否是我们需要处理的跨域请求
  if (data && data.type === 'CROSS_ORIGIN_FETCH') {
    try {
      // 发送消息到background script进行跨域请求
      const response = await chrome.runtime.sendMessage({
        action: 'crossOriginFetch',
        url: data.url,
        options: data.options || {}
      });
      
      // 安全地确定目标origin
      let targetOrigin = '*';
      
      // 如果不是 file:// 协议（origin 不是 "null" 字符串），使用实际的 origin
      if (event.origin !== 'null' && event.origin) {
        targetOrigin = event.origin;
      }
      
      window.postMessage({
        type: 'CROSS_ORIGIN_FETCH_RESPONSE',
        requestId: data.requestId,
        success: true,
        data: response
      }, targetOrigin);
    } catch (error) {
      let targetOrigin = '*';
      if (event.origin !== 'null' && event.origin) {
        targetOrigin = event.origin;
      }
      
      window.postMessage({
        type: 'CROSS_ORIGIN_FETCH_RESPONSE',
        requestId: data.requestId,
        success: false,
        error: error.message
      }, targetOrigin);
    }
  }
});
 

window.addEventListener('load', function(){
	
	if(isOaMailPage()){
		reverseTablesExceptFirstWithBr();
	}
	
});

function isOaMailPage(){
	return window.location.href.indexOf("general/mail/my/read.php?MAIL_ID")>0;
}

//实现回复倒序排列
function reverseTablesExceptFirstWithBr() {
  const parent = document.body; // 假设 table 在 body 下，可根据需要调整
  const children = Array.from(parent.childNodes);

  // 提取所有的 table 和 br 组合，按“块”处理
  const blocks = [];
  let currentBlock = [];

  children.forEach(node => {
    if (node.tagName === 'TABLE') {
      // 遇到 table，先保存当前 block（如果存在）
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      currentBlock.push(node);
    } else if (node.tagName === 'BR' && currentBlock.length > 0) {
      // 如果是 br 且前面有 table，归入当前 block
      currentBlock.push(node);
    } else {
      // 其他节点（比如文本、空格等）忽略或单独处理（这里暂不处理）
      // 可根据需要扩展
    }
  });
  // 推入最后一个 block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  if (blocks.length <= 1) return; // 不足两个块，无需操作

  // 分离第一块和其他块
  const firstBlock = blocks[0];
  const remainingBlocks = blocks.slice(1).reverse(); // 倒序

  // 移除所有 block 中的节点
  blocks.forEach(block => {
    block.forEach(node => node.parentNode.removeChild(node));
  });

  // 重新插入：先插入第一块，再插入倒序的其余块
  firstBlock.forEach(node => parent.insertBefore(node, null));

  remainingBlocks.forEach(block => {
    block.forEach(node => parent.insertBefore(node, null));
  });
}