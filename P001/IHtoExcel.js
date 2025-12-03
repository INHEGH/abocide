console.log("===starting ===loadExcelModel=====",document.title)
window.IH=new (function(){ 
function getMergedRanges(table) {

  const rows = Array.from(table.querySelectorAll(':scope > * > tr'));//table.rows;//
  if (rows.length === 0) return [];

  const mergedRanges = [];
  let currentRow = 0;

  // 辅助函数：将列索引（从0开始）转为 Excel 列名（A, B, ..., Z, AA, AB...）
  function getColumnLetter(colIndex) {
    let letters = '';
    let num = colIndex + 1; // 转为从1开始
    while (num > 0) {
      num--;
      letters = String.fromCharCode(65 + (num % 26)) + letters;
      num = Math.floor(num / 26);
    }
    return letters;
  }

  // 辅助函数：生成 Excel 单元格地址，如 A1
  function getCellAddress(row, col) {
    return getColumnLetter(col) + row;
  }

  // 遍历每一行
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    //console.log(row.querySelectorAll(':scope > td ,:scope > th'))
    const cells = Array.from(row.querySelectorAll(':scope > td ,:scope > th'));
    let currentCol = 0; // 当前行的列索引（从0开始）

    for (let cell of cells) {
      // 跳过已被前面 rowspan 占用的列（通过模拟占位）
      // 实际中我们只需按顺序计算起始列即可
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

      // 起始位置（行号从1开始，列索引从0开始）
      const startRow = rowIndex + 1;
      const startCol = currentCol;

      // 结束位置
      const endRow = startRow + rowspan - 1;
      const endCol = startCol + colspan - 1;

      // 如果是合并单元格（colspan>1 或 rowspan>1）
      if (colspan > 1 || rowspan > 1) {
        const startAddr = getCellAddress(startRow, startCol);
        const endAddr = getCellAddress(endRow, endCol);
        mergedRanges.push(`${startAddr}:${endAddr}`);
      }

      // 移动到下一列
      currentCol += colspan;
    }
  }

  return mergedRanges;
}
function getSelectListValue(selectDom){
	let res=[];
	let ss=selectDom;
	for(var i=0;i<ss.options.length;i++){
		let a={};
		a[ss.options[i].value]=ss.options[i].text; 
		res.push(a); 
	}
	return res;
}
function tableToObjectsWithStyle(table) {
  
  const rows = Array.from(table.querySelectorAll(':scope > * > tr'));
  if (rows.length === 0) return [];

  // 计算最大列数
  let maxCols = 0;
  rows.forEach(row => {
    let colCount = 0;
    row.querySelectorAll(':scope > td ,:scope > th').forEach(cell => {
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      colCount += colspan;
    });
    maxCols = Math.max(maxCols, colCount);
  });

  // 初始化 grid：每个单元格为 null 或 { text, color, bgcolor }
  const grid = Array(rows.length).fill(null).map(() => Array(maxCols).fill(null));

  // 填充 grid
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
     row.querySelectorAll(':scope > td ,:scope > th').forEach(cell => {
      // 跳过已被 rowspan 占用的列
      while (colIndex < maxCols && grid[rowIndex][colIndex] !== null) {
        colIndex++;
      }
      if (colIndex >= maxCols) return;
	 
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
	  let text = cell.textContent.trim();
	  
	  if(cell.querySelectorAll("table").length>0){
		  // IH.tableToExcel(cell.querySelectorAll("table")[0]);
		  text="明细表";
		  grid[rowIndex][colIndex] = {
			text: text
		  };
		 cell.querySelectorAll("table").forEach((tab,ind)=>{
			 console.log(tab.id,tab,ind);
		 });
		  return ;
	  }else{
		  let kjarr=cell.querySelectorAll("input,textarea,select");
		  if(kjarr && kjarr.length>0){
			  text="";
			  let pubFieldNameIndex=0;
			  kjarr.forEach(kj => {
				  if(window.exportTypeFor=="import"){
						if(kj.tagName=="TEXTAREA")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
						else if(kj.tagName=="INPUT" &&  kj.type.toUpperCase()!="BUTTON")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
						else if(kj.tagName=="SELECT")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
				  }else{
						if(kj.tagName=="BUTTON" ||  kj.type.toUpperCase()=="BUTTON") return ;
						
						if(kj.title)text+=kj.title.trim();
						if(kj.tagName=="TEXTAREA")text+="(多行文本框)";
						else if(kj.tagName=="INPUT" && kj.type.toUpperCase()=="CHECKBOX")text+="(多选框)";
						else if(kj.tagName=="INPUT" && kj.type.toUpperCase()=="RADIOBOX")text+="(单选框)";
						else if(kj.tagName=="INPUT" && kj.type.toUpperCase()=="TEXT")text+="(单行文本框)";
						else if(kj.tagName=="SELECT")text+="(下拉框:"+JSON.stringify(getSelectListValue(kj))+")";
						if(kj.getAttribute("datafld"))text+="默认值:"+kj.getAttribute("datafld");
						text+="|";
				  }
			  });
		  } 

		  // 获取计算后的样式
		  const computedStyle = window.getComputedStyle(cell);
		  let color = rgbToHex(computedStyle.color);
		  let bgcolor = rgbToHex(computedStyle.backgroundColor) ;
		  if(bgcolor && (bgcolor=='#000000'||bgcolor=='#ffffff')){
			  if(computedStyle.backgroundImage && computedStyle.backgroundImage.indexOf("list_hd_bg.png")>0)bgcolor="#f0f0f0";
			  else bgcolor="";
		  }
		  let fontSize=computedStyle.fontSize;
		  let height=rowspan>1?0:computedStyle.height;
		  let width=colspan>1?0:computedStyle.width;
		  
		  // 起始单元格：填充完整对象
		  grid[rowIndex][colIndex] = {
			text: text
		  };
		  if(fontSize)grid[rowIndex][colIndex]["fontSize"]=fontSize;
		  if(height)grid[rowIndex][colIndex]["height"]=height;
		  if(width)grid[rowIndex][colIndex]["width"]=width;
		  if(color && color!='#000000')grid[rowIndex][colIndex]["fontColor"]=color;
		  if(bgcolor && bgcolor!='#000000'&& bgcolor!='#ffffff')grid[rowIndex][colIndex]["fill"]=bgcolor;
		  
		  // colspan：后续列设为 null（被合并）
		  for (let c = 1; c < colspan; c++) {
			if (colIndex + c < maxCols) {
			  grid[rowIndex][colIndex + c] = "merged";
			}
		  }

		  // rowspan：下方行同列设为 null（被合并）
		  for (let r = 1; r < rowspan; r++) {
			if (rowIndex + r < rows.length) {
			  grid[rowIndex + r][colIndex] = "merged";
			}
		  }
			  for (let c = 1; c < colspan; c++) {
				if (colIndex + c < maxCols) {
					for (let r = 1; r < rowspan; r++) {
						if (rowIndex + r < rows.length) {
							grid[rowIndex + r][colIndex + c] = "merged";
						}
					}
				}
		  }
	  }
      colIndex += colspan;
	  
    });
  });

  // 转为对象数组，列名 A, B, C...
  const result = [];
  const baseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  grid.forEach(rowData => {
    const obj = {};
    rowData.forEach((cellData, colIndex) => {
      let colName;
      if (colIndex < 26) {
        colName = baseLetters[colIndex];
      } else {
        // 支持超过26列（如 AA, AB...），简单处理：Col27, Col28...
        colName = `Col${colIndex + 1}`;
      }
      obj[colName] = cellData; // 可能是对象或 null
    });
    result.push(obj);
  });

  return result;
}

// 辅助函数：将 rgb/rgba 转为 #RRGGBB
function rgbToHex(color) {
  if (!color) return null;
  if (color.startsWith('#')) return color;

  // 处理 rgba(255, 0, 0, 0.5) 或 rgb(255, 0, 0)
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    const [, r, g, b] = match;
    return '#' + [r, g, b]
      .map(x => parseInt(x, 10).toString(16).padStart(2, '0'))
      .join('');
  }

  // 无法解析的颜色（如 "red"）可尝试用 canvas 转换（此处简化）
  // 实际项目中可扩展支持 named colors
  return null;
}


function workbook2blob(workbook) {
  // 生成excel的配置项
  const wopts = {
    // 要生成的文件类型
    bookType: "xlsx",
    // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    bookSST: false,
    type: "binary"
  };
  const wbout = XLSX.write(workbook, wopts);
  // 将字符串转ArrayBuffer
  function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }
  const blob = new Blob([s2ab(wbout)], {
    type: "application/octet-stream"
  });
  return blob;
}

function handleExport(obj) {
  const wb = XLSX.utils.book_new();
  
  for(let k in obj){
	  let finalData=[];
	  let data=obj[k];
	  data.data.forEach((e)=>{ let row={}; for(var att in e){    row[att]=(e[att]||{}).text||""; }; finalData.push(row);  })
	 
	  const sheet = XLSX.utils.json_to_sheet(finalData, { skipHeader: true }); 
	  XLSX.utils.book_append_sheet(wb, sheet, k);
  }
  const workbookBlob = workbook2blob(wb);
  return addStyle(workbookBlob, obj);
}

function getAllRane(tabledata){
	let start="A1";
	let row=tabledata[0];
	let maxChat='A';
	for(var att in row)if(att>maxChat)maxChat=att;
	let end=maxChat+tabledata.length;
	return start+":"+end;
}
function addStyle(workbookBlob, obj) {
  return XlsxPopulate.fromDataAsync(workbookBlob).then((workbook) => {
    // 循环所有的表
    workbook.sheets().forEach((sheet) => { 
		let k=sheet.name();
		let dataInfo=obj[k];
      // 所有cell垂直居中,修改字体
      sheet.usedRange().style({ fontFamily: "Arial", verticalAlignment: "center" });
	  
      // 去除所有边框
      //sheet.gridLinesVisible(false);
      // 统计表格数据
      // title加粗合并及居中
      // 设置单元格宽度
	  let rowNum=1;
	  let maxWidth={};
	  dataInfo.data.forEach((row) => {
			  let maxHeight=0;
			  for(var att in row){
				  if(row[att] && row[att].height){
					  let h=row[att].height.replace("px","")*1;
					  if(h>maxHeight)maxHeight=h;
				  }
				  if(row[att] && row[att].width){
					  let w=row[att].width.replace("px","")*1;
					  let maxW=maxWidth[att]||0;
					  if(w>maxW)maxWidth[att]=w;
				  }
			  }
			  if(maxHeight>0)sheet.row(rowNum).height(maxHeight*0.75);
			  rowNum++;
      });
	  
	  for(var att in maxWidth){
		  sheet.column(att).width(maxWidth[att]/7.056);
	  }
	   
	  
	  
   /*   "ABCDEFGHIJKLMN".split("").forEach((name) => {
			sheet.column(name).width(18);
      });
	*/	
	  for(var i=0;i<dataInfo.merge.length;i++){
		  sheet.range(dataInfo.merge[i])
			.merged(true)
			/*.style({
			  bold: true,
			  horizontalAlignment: "center",
			  verticalAlignment: "center"
			});*/
	  }
	  for(var i=0;i<dataInfo.data.length;i++){
		  let row=dataInfo.data[i];
		  for(var att in row){
			  if(row[att]){
				  let _style={};
				  if(row[att].fontColor)_style["fontColor"]= row[att].fontColor.replace("#","");
				  if(row[att].fill)_style["fill"]= row[att].fill.replace("#","") ;
				  
				  if(row[att].fontSize)_style["fontSize"]= row[att].fontSize.replace("px","")*1;
				  else _style["fontSize"]= 10;
				  if( _style["fontSize"]>= 10) _style["fontSize"]= 10;
				  if(_style) sheet.cell(att+(i+1)).style(_style);
				   
			  }
		  }
	  }
		  sheet.range(getAllRane(dataInfo.data)).style({
			border: {
			  style: "thin",
			  color: "000000",
			  direction: "both"
			}
		  });
	  /*
      // 表头加粗及背景色
      sheet.range(dataInfo.theadRange).style({
        fill: "C9C7C7",
        bold: true,
        horizontalAlignment: "center"
      });
      // 表格内容右对齐
      sheet.range(dataInfo.tbodyRange).style({
        horizontalAlignment: "right"
      });
      // 表格黑色细边框
      sheet.range(dataInfo.tableRange).style({
        border: {
          style: "thin",
          color: "000000",
          direction: "both"
        }
      });*/
    });
	
    return workbook.outputAsync().then(
      (workbookBlob) => URL.createObjectURL(workbookBlob) // 创建blob地址
    );
	
  });
}

  function loadScript(src) {
				if(!src)return new Promise((resolve, reject) => { resolve(); });
				if(typeof src=="string"){
					return new Promise((resolve, reject) => {
						// 防止重复加载
						if (document.querySelector(`script[src="${src}"]`)) {
							resolve();
							return;
						}
						const script = document.createElement('script');
						script.src = src;
						script.onload = () => resolve({e:event,ele:script});
						script.onerror = () => reject(new Error(`加载失败: ${src}`));
						document.head.appendChild(script);
					});
				}
				let that=this;
				return new Promise((resolve, reject) => {
					let success=0;
					let es=[];
					for(let i=0;i<src.length;i++){
						loadScript(src[i]).then((res)=>{es.push(res);success++;});
					}
					setInterval(() => {if(success>=src.length)resolve(es);}, 50);
					setTimeout(() => {if(success<src.length)reject();}, 10000);
				});	
			};
			this.loadExcelModel=function (){
				let jsfile=['https://cdn.staticfile.net/xlsx/0.18.5/xlsx.full.min.js ',
							'https://cdn.staticfile.net/xlsx-populate/1.21.0/xlsx-populate.js'];
				return loadScript(jsfile);
			};
			
function tableInfo (table) {
	let data=tableToObjectsWithStyle(table);
	let merge=getMergedRanges(table);
	return {data,merge};
}

 function dataToExcel(data) {
  handleExport(data).then((url) => {
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", (document.title||"TableToExcel")+new Date().toISOString()+".xlsx");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });
}
function tableToExcel(table){
	let data=tableInfo(table);
	//console.log(data);
    dataToExcel({"Sheet1":data});
}

this.allTableToExcel=function(){
	let tables= document.querySelectorAll("table");
	let exportData={};
	for(let i=1;i<=tables.length;i++){
		let data=tableInfo(tables[i-1]);
		console.log("======allTableToExcel=====",i,data)
		exportData["Sheet"+i]=data;
	}
    dataToExcel(exportData);
}

})();
 console.log("======loadExcelModel=====SUCCESS") 