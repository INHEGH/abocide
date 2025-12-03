const table = document.querySelector(".TableBlock");

function tableInfo(table) {
	let data=tableToObjectsWithStyle(table);
	let merge=getMergedRanges(table);
	return {data,merge};
}

function getMergedRanges(table) {

  const rows = Array.from(table.querySelectorAll('tr'));
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
    const cells = Array.from(row.querySelectorAll('td, th'));
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
function tableToObjectsWithStyle(table) {
  
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return [];

  // 计算最大列数
  let maxCols = 0;
  rows.forEach(row => {
    let colCount = 0;
    row.querySelectorAll('td, th').forEach(cell => {
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

    row.querySelectorAll('td, th').forEach(cell => {
      // 跳过已被 rowspan 占用的列
      while (colIndex < maxCols && grid[rowIndex][colIndex] !== null) {
        colIndex++;
      }
      if (colIndex >= maxCols) return;
	  console.log(cell,cell.id,cell.getAttribute('id'))
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
	  let text = cell.textContent.trim();
	  let kjarr=cell.querySelectorAll("input,textarea,select");
	  if(kjarr && kjarr.length>0){
		  text="";
		  let pubFieldNameIndex=0;
		  kjarr.forEach(kj => {
				if(kj.tagName=="TEXTAREA")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
				else if(kj.tagName=="INPUT")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
				else if(kj.tagName=="SELECT")text+="$1-"+(kj.id||kj.name||("field"+(pubFieldNameIndex++)))+" ";
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
          grid[rowIndex][colIndex + c] = null;
        }
      }

      // rowspan：下方行同列设为 null（被合并）
      for (let r = 1; r < rowspan; r++) {
        if (rowIndex + r < rows.length) {
          grid[rowIndex + r][colIndex] = null;
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

const btn = document.getElementById("exp");
btn.onclick = createDownLoadData;



function createDownLoadData() {
  handleExport().then((url) => {
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "xxx数据汇总.xlsx");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });
}

// 假设这是接口返回的数据
const data ={"data":[{"A":{"text":"（一）客户信息","fontSize":"12px","height":"25px","fontColor":"#ff0000","fill":"#f0f0f0"},"B":null,"C":null,"D":null,"E":null,"F":null,"G":null,"H":null},{"A":{"text":"1. 代理商/经销商基本信息","fontSize":"12px","height":"25px","fontColor":"#124164","fill":"#f0f0f0"},"B":null,"C":null,"D":null,"E":null,"F":null,"G":null,"H":null},{"A":{"text":"代理商/经销商名称","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-name1 $1-field0 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"客户编号","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-customer_id1 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"代理商/经销商所在国","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-country1 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"联系人","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-contact1 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"联系人电话","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-phone1 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"联系人电邮","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-email1 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"代理商/经销商简介（主营业务范围，销售收入，公司规模/人数，销售业绩，业务负责人/老板能力=家世/学历/工作经历/性格/做事风格）","fontSize":"12px","height":"100px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-introduction1 ","fontSize":"12px","height":"100px","fontColor":"#0066cc"},"C":null,"D":null,"E":{"text":"添加附件：","fontSize":"12px","height":"100px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-introduction1_attach $1-myfile ","fontSize":"12px","height":"100px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"合作历史 （说明是首次合作还是老代理/经销商。若是首次合作，必须有展示代理实力的相关信息；若是老代理/经销商，必须注明合作过的项目和成功的项目。）","fontSize":"12px","height":"100px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-cooperate_history ","fontSize":"12px","height":"100px","fontColor":"#0066cc"},"C":null,"D":null,"E":{"text":"添加附件：","fontSize":"12px","height":"100px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-cooperate_history_attach $1-myfile ","fontSize":"12px","height":"100px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"2. 招标方/业主基本信息 （投标项目必填）","fontSize":"12px","height":"25px","fontColor":"#124164","fill":"#f0f0f0"},"B":null,"C":null,"D":null,"E":null,"F":null,"G":null,"H":null},{"A":{"text":"招标方/业主名称","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-name2 $1-field1 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"客户编号","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-customer_id2 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"招标方/业主所在国","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-country2 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"联系人","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-contact2 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"联系人电话","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-phone2 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"联系人电邮","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-email2 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"招标方/业主简介（总资产和负债金额，上一年度利润和现金流结余金额；直属上级；大致组织架构；前10大股东构成/股价和股数（上市公司）；董事会和高管简介；上一年度同类产品/工程采购额；付款及时性；供应商评价）","fontSize":"12px","height":"100px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-introduction2 ","fontSize":"12px","height":"100px","fontColor":"#0066cc"},"C":null,"D":null,"E":{"text":"添加附件：","fontSize":"12px","height":"100px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-introduction2_attach $1-myfile ","fontSize":"12px","height":"100px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"3. 买方信息（必填项，匹配销售合同评审流程的买方）","fontSize":"12px","height":"25px","fontColor":"#ff0000","fill":"#f0f0f0"},"B":null,"C":null,"D":null,"E":null,"F":null,"G":null,"H":null},{"A":{"text":"买方名称","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-name3 $1-field2 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"客户编号","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-customer_id3 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"买方所在国","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-country3 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"联系人","fontSize":"12px","height":"38px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-contact3 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"C":{"text":"联系人电话","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"D":{"text":"$1-phone3 ","fontSize":"12px","height":"38px","width":"301.156px","fontColor":"#0066cc"},"E":{"text":"联系人电邮","fontSize":"12px","height":"38px","width":"249.797px","fill":"#f0f0f0"},"F":{"text":"$1-email3 ","fontSize":"12px","height":"38px","width":"318.297px","fontColor":"#0066cc"},"G":null,"H":null},{"A":{"text":"买方简介","fontSize":"12px","height":"100px","width":"250.297px","fill":"#f0f0f0"},"B":{"text":"$1-introduction3 ","fontSize":"12px","height":"100px","fontColor":"#0066cc"},"C":null,"D":null,"E":null,"F":null,"G":null,"H":null}],"merge":["A1:H1","A2:H2","B5:D5","B6:D6","A7:H7","B10:D10","A11:H11","B14:F14"]}

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

function handleExport(data) {
  const wb = XLSX.utils.book_new();
  let finalData=[];
  data.data.forEach((e)=>{ let row={}; for(var att in e){    row[att]=(e[att]||{}).text||""; }; finalData.push(row);  })
  console.log(finalData)
  const sheet = XLSX.utils.json_to_sheet(finalData, {
    skipHeader: true
  });
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
  const workbookBlob = workbook2blob(wb);
  return addStyle(workbookBlob, data);
}

function getAllRane(tabledata){
	let start="A1";
	let row=tabledata[0];
	let maxChat='A';
	for(var att in row)if(att>maxChat)maxChat=att;
	let end=maxChat+tabledata.length;
	return start+":"+end;
}
function addStyle(workbookBlob, dataInfo) {
  return XlsxPopulate.fromDataAsync(workbookBlob).then((workbook) => {
    // 循环所有的表
    workbook.sheets().forEach((sheet) => {
      // 所有cell垂直居中,修改字体
      sheet.usedRange().style({
        fontFamily: "Arial",
        verticalAlignment: "center"
      });
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
				  if(row[att].fontSize)_style["fontSize"]= row[att].fontSize ;
				  
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
