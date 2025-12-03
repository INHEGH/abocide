window.addEventListener('load', function(){
	if(P.isTdOaMailPage()){
		reverseTablesExceptFirstWithBr();
	}
	
	if(P.isFwOaEbuildPage()){
		let href=location.href;
		if(href.indexOf("wea_link_keep_show_console")<0)location.href=href+(href.indexOf("?")>0?"&":"?")+"wea_link_keep_show_console";
	}
}); 

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


console.log("我的插件:CONTENT加载完成");
