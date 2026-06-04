


function checkStartUpScript(note,i){
	if(note && (note.title.indexOf("启动脚本")>-1 || note.title.toLowerCase().indexOf("[startup]")>-1)){
		const htmlString = note.content;
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		const codeElements = doc.querySelectorAll('code');
		(codeElements ? codeElements : []).forEach((code,i)=>{
			runjsByCode(code);
		});
	}
}
function runjsByCode(codeTmp){
	let jsStr="";
	if(codeTmp.className.indexOf("script")>0){
		jsStr= codeTmp.textContent;
	}
	console.log("[StartUp]:",jsStr);
	if(jsStr)eval(`(async () => {try{ \n ${jsStr} \n }catch(e){\n alert("[StartUpError]"+e.message);\n console.error("[StartUpError]",e);\n} })()`);
}
const notesStore =  getNotesStore(true);
const notesRequest = notesStore.getAll();
notesRequest.onsuccess = function() {
	let notes = notesRequest.result;
	notes.forEach((note,i)=>{checkStartUpScript(note,i);});
};
 