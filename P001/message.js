// 监听来自页面的postMessage
window.addEventListener('message', async (event) => {
  console.log("********event*********",event);
  // 不验证来源，因为 file:// 协议下 origin 是 "null" 字符串
  const data = event.data;
  let res=await todo(data);
  if(res)sendToClient(event,res.success,res.data);

});

chrome.runtime.onMessage.addListener(
    async (data, sender, sendResponse) =>  {
 		let res=await todo(data);
        sendResponse(JSON.stringify(res));
    }
);


async function todo(data){
	if(!data) return ;
	try {
			// 检查是否是我们需要处理的跨域请求
		  if (data.type === 'CROSS_ORIGIN_FETCH') {
			  // 发送消息到background script进行跨域请求
			  const response = await chrome.runtime.sendMessage({
				action: 'crossOriginFetch',
				url: data.url,
				options: data.options || {}
			  });
			 // sendToClient(event,true,response);
			 return {success:true,data:response};
		  }else if (data.type === 'CALL_FUNCTION') {
			 let response=null;
			 if(data.functionName){
				 if(typeof data.params ==='undefined'){
					 data.params=[];
				 }else if(!Array.isArray(data.params)){
					 data.params=[data.params];
				 }
				 response = await  getFunction(data.functionName)(...data.params);
			 }
			return {success:true,data:response};// sendToClient(event,true,response);
		  }
    }catch (error){
		return {success:false,data: error.message};;//sendToClient(event,false,error.message);
		console.error(error);
    }
	
}


function sendToClient(_event,success,dataOrError){
	  const data = _event.data;
	  let postMsg={
        type: data.type+'_RESPONSE',
        requestId: data.requestId||0,
        success: success
      }
	  postMsg[success?"data":"error"]=dataOrError;
      window.postMessage(postMsg, (_event.origin !== 'null' && _event.origin)?_event.origin:"*");
}
function getFunction(functionName){
	if(!functionName||functionName.trim().length<1)return null;
	
	const match = functionName.match(/function\s*\(([^)]*)\)\s*{([\s\S]*)}/);
	if (match) {
	   //  const args = match[1].split(',').map(arg => arg.trim()).filter(Boolean);
	   // const body = match[2];
	  //  return function(ps){ (new Function(...args, body))(...ps); };
	  //return eval(functionName);
	   return function(...args){
			let pn="_P"+new Date().getTime();
			 window[pn]=args;
			 return new Promise((resolve, reject) => {
					setTimeout("(function(args){ window['"+pn+"_result']=("+functionName+")(...args);if(!window['"+pn+"_result'])window['"+pn+"_result']=true;  })(window['"+pn+"'])", 0);
					let cnt=0;
					setInterval(() => {cnt++;if(cnt>100){reject();}; if(window[pn+"_result"])resolve(window[pn+"_result"]);}, 10);
			 });
		}
	  
	} 

	
	let my=window;
	let pkgs=functionName.split(".");
	for(let i=0;i<pkgs.length;i++){
		let pi=pkgs[i].trim();
		if(pi.length<1)continue;
		my=my[pi];
	}
	return my;
}
console.log("我的插件:MESSAGE加载完成");