import showMessage from './message-panel';
const $ = require('jquery');
import {setEditorContents} from './texteditor';

export default function() {
    $('#local-file-import').change(reactToInput);
}

function loadFile( fileRaw ){
    try {
        const file = JSON.parse(fileRaw); 
        setEditorContents(file.text);
        remindOfMediaFile(file.media, file['media-source'], file['media-time']);
    } catch (e) {
		var txt = srt_to_otr(fileRaw);
		if(!txt) {
			console.warn(e);
			showMessage('This is not a valid oTranscribe format (.otr) file.');
		} else {
			try {
				const file = JSON.parse(txt); 
				setEditorContents(file.text);
				remindOfMediaFile(file.media, file['media-source'], file['media-time']);
			} catch (e) {
				console.warn(e);
				showMessage('This is not a valid oTranscribe format (.otr) file.');
			}
		}
    }
}


function remindOfMediaFile( filename, filesource, filetime ){
    if (filename && filename !== '') {
        var lastfileText = document.webL10n.get('last-file');
        var lastfileText = 'File last used with imported document:';
        var restoreText = 'Restore';
        // if ((filesource) && (oTplayer.parseYoutubeURL(filesource))) {
        //     showMessage( lastfileText+' <a href="#" id="restore-media">'+filename+'</a>' );
        //     $('#restore-media').click(function(){
        //         oT.media.create({file: filesource, startpoint: filetime});
        //         return false;
        //     });
        // } else {
            showMessage(lastfileText+' '+filename);
        // }
    }
}

function reactToInput(){
    let input = this;
    var file = input.files[0];
    
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(e) { 
        var contents = e.target.result;
        loadFile( contents );
    }
    
    input.value = '';
    
    
}


function getSeconds(t) {
  var ms = 0;
  if (/^(\d{2}):(\d{2}):(\d{2})[,\.]\s*(\d+)/.test(t)) {
    ms = Number(RegExp.$1) * 3600 + Number(RegExp.$2) * 60 + Number(RegExp.$3) + Number(RegExp.$4) / 1000;
  }
  return ms;
}

function srt_to_otr(strInput)  {
  var lineNumber,
  lineTime,
  data,
  line,
  lines,
  timeStamp,
  timeEnd,
  timeString,
  dataTotal;
  var html = '';
  /* if Mac file, \r replace with \n */
  if(!strInput.match(/\n/gm) && strInput.match(/\r/gm)) {
    strInput = strInput.replace(/\r/gm, '\n');
  } else {
    strInput = strInput.replace(/\r/gm, '');
  }
  strInput = strInput.replace(/\n+/g, '\n'); /* 多個換行變成一個 */
  strInput = strInput.replace(/\s*\n\s*/gm, '\n'); /* 去掉頭尾的空白 */  
  strInput = strInput.replace(/(\n\d+\n\d+\:\d+:\d+)/g, '\n$1'); /* 每段字幕前面多加一個空白行 */
  strInput = strInput.replace(/^\s*\n*/, ''); //將最前面的空白及空白行去掉
  
  //is srt format?
  if(strInput.match(/(\n\d+\n\d+\:\d+:\d+)/gm)) {
  
    lines = strInput.split(/\n/);
    for (var i = 0; i < lines.length; i++) {
      line = lines[i];
      if (/^(\d+):(\d{2}):(\d{2})[,\.]\s*(\d+)[^\d]+/.test(line)) {
        timeStamp = Number(RegExp.$1) * 3600 + Number(RegExp.$2) * 60 + Number(RegExp.$3) + Number(RegExp.$4) / 1000;
        timeEnd = RegExp.rightContext;
        //html += '<p><span class=\\"timestamp\\" data-timestamp=\\"' + timeStamp + '\\">' + line + '</span></p>';
		if(Number(RegExp.$1)==0) {
			timeString = RegExp.$2+':'+RegExp.$3
		} else {
			timeString = RegExp.$1+':'+RegExp.$2+':'+RegExp.$3
		}
		html += '<span class=\\"timestamp\\" data-timestamp=\\"' + timeStamp + '\\">' + timeString + '</span>&nbsp;';

        dataTotal = 1;
        while ((i+dataTotal) < lines.length && lines[i + dataTotal].replace(/\s/g,'') != '') {
		  html += lines[i + dataTotal++] + '<br>';
        }
		html += '<br>'; //多加一行空白行, 分隔會比較清楚
        i += dataTotal;
      } else {
        //html += '<p>' + line + '</p>'; //字幕序號
      }
    }
    var header = '{"text": "';
    //var footer = '","media-time": ' + getSeconds(timeEnd) + '}';
	var footer = '","media-time": "" }';

    return (header + html + footer)
  } else {
	return null;
  }
}