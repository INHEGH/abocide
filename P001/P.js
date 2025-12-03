window.P=new (function(){
	Date.prototype.format = function (fmt) {var o = {"M+": this.getMonth() + 1,"d+": this.getDate(),"H+": this.getHours(),"m+": this.getMinutes(),"s+": this.getSeconds(),"q+": Math.floor((this.getMonth() + 3) / 3),"S": this.getMilliseconds() };if (/(y+)/.test(fmt)) {fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));}for (var k in o) {if (new RegExp("(" + k + ")").test(fmt)) {fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));}}return fmt;};
	this.isPage=function(urlTag){if(!urlTag || urlTag.trim().length<1)return false;return window.location.href.toLowerCase().indexOf(urlTag.toLowerCase())>0;}
	this.getTime=function(){return new Date().format("HH:mm:ss");};
	this.getDate=function(){return new Date().format("yyyy-MM-dd");};
	this.getDateTime=function(){return new Date().format("yyyy-MM-dd HH:mm:ss");};
	this.createElement=function (tag,cfg) {
		const tagDom = document.createElement(tag);
		if(cfg){
			let _parent=null;
			// 遍历 config，设置 HTML 属性
			Object.keys(cfg).forEach(key => {
			  if(key!="parent") tagDom.setAttribute(key, config[key]);
			});
			if(cfg.parent)cfg.parent.appendChild(tagDom);
		}
		return tagDom;
	};
	
	this.showCode=function () {
		let codes=document.querySelectorAll("code");
		for(var i=0;i<codes.length;i++)console.log(codes[i].innerText);
	};
	
	this.isTdOaMailPage= function (){ return this.isPage("general/mail/my/read.php?MAIL_ID"); };
	this.isFwOaEbuildPage= function (){ return this.isPage("192.168.1.225"); };///sp/ebdapp/build"

})();

