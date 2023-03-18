const $ = require('jquery');
const Mustache = require('mustache');
const toMarkdown = require('to-markdown');
const template = require('raw-loader!../../html/export-panel.ms');
import googleDriveSetup from './export-formats/google-drive';
import { getPlayer } from './player/player';
const sanitizeHtml = require('sanitize-html');
import { cleanHTML } from './clean-html';

function getTexteditorContents() {
    return document.querySelector('#textbox').innerHTML;
}

function getFilename() {
	var timeNow = new Date();
	var localTime = (new Date(timeNow.getTime() - (timeNow.getTimezoneOffset() * 60000))).toISOString().substring(0, 19).replace(/T/, '_').replace(/\:/g, '');
    //return document.webL10n.get('file-name') + " " + (new Date()).toUTCString();
	return document.webL10n.get('file-name') + "-" + localTime;
}

//fix the broken L10n, add by gsyan
function updateWebL10n() {
	const panel = document.querySelector('.export-panel');
	var match;
	for(var i=0; i<panel.childElementCount; i++) {
		var element = panel.children[i];
		var txt = element.textContent
		if(match = txt.match(/\{\{([^\}]+)\}\}/)) {
			element.textContent = document.webL10n.get(match[1]);
		}
		var id = element.getAttribute('data-l10n-id');
		if(id && document.webL10n.get(id)) {
			element.textContent = document.webL10n.get(id);
		}
	}
}	

let exportFormats = {
    download: [],
    send: []
};

exportFormats.download.push({
    name: '{{export-markdown}}', //'Markdown',
    extension: 'md',
    fn: (txt) => {
        const fullyClean = sanitizeHtml(txt, {
            allowedTags: [ 'p', 'em', 'strong', 'i', 'b', 'br' ]
        });
        const md = toMarkdown( fullyClean );
        return md.replace(/\t/gm,"");           
    }
});

exportFormats.download.push({
    name: '{{export-text}}', //'Plain text',
    extension: 'txt',
    fn: (txt) => {
        const fullyClean = sanitizeHtml(txt, {
            allowedTags: [ 'p' ]
        });
        const md = toMarkdown( fullyClean );
        return md.replace(/\t/gm,"");           
    }
});
exportFormats.download.push({
	name: '{{export-srt}}', //'SRT 字幕',
    extension: 'srt',
    fn: (txt) => {
		var mediaLength = 0;
        const player = getPlayer();		
        if (player){
			mediaLength = player.getLength();
		}
		txt = txtToSrt(txt, mediaLength);
        const fullyClean = sanitizeHtml(txt, {
            allowedTags: [ 'p', 'br' ]
        });
        const md = toMarkdown( fullyClean );
        var dataIn = md.replace(/\t/gm,"");
		dataIn = dataIn.replace(/\n+/g, '\n'); /* 多個換行變成一個 */
		dataIn = dataIn.replace(/\s*\n\s*/gm, '\n'); /* 去掉頭尾的空白 */
		dataIn = dataIn.replace(/(\n\d+\s*\n\d+\:\d+:\d+)/g, '\n$1'); /* 每段字幕前面多加一個空白行 */
		dataIn = dataIn.replace(/^\s*\n*/, ''); //去掉最前面的空白
		//dataIn = srt_order_number(dataIn);
		//var lines = dataIn.split(/\n\n/);
		//for(var i=0; i<lines.length; i++) {
		//	lines[i] = lines[i].replace(/^\d+\n/, (i+1)+'\n');
		//}
		//return lines.join('\n\n').replace(/\n/g, '\r\n');
		return dataIn.replace(/\n/g, '\r\n');
    }
});
exportFormats.download.push({
    name: '{{export-none-time}}', //'無時間之逐字稿',
    extension: 'txt',	
    fn: (txt) => {
		//remove timestamp , add by gsyan 
		txt = txt.replace(/<span\s+class="timestamp"\s+data-timestamp="[^"]+">[^<]+<\/span>/gm, '');
        const fullyClean = sanitizeHtml(txt, {
            allowedTags: [ 'p', 'br' ]
        });
        const md = toMarkdown( fullyClean );
		var dataIn = md.replace(/\t/gm,""); 
		dataIn = dataIn.replace(/\n+/g, '\n'); /* 多個換行變成一個 */
		dataIn = dataIn.replace(/\s*\n\s*/gm, '\n'); /* 去掉頭尾的空白 */
		dataIn = dataIn.replace(/^\s*\n*/, ''); //去掉最前面的空白
		//dataIn = dataIn.replace(/(\d+\s*\n\d+\:\d+:\d+[^\n]+\n)/mg, ''); /* 去掉字幕序號及時間 */
        return dataIn.replace(/\n/g, '\r\n');
    }
});
	
exportFormats.download.push({
    name: '{{export-otr}}', //'oTranscribe format',
    extension: 'otr',
    fn: (txt) => {
        let result = {};
        result.text = txt.replace('\n','');
        const player = getPlayer();
        if (player){
            result.media = player.getName();
            result['media-time'] = player.getTime();
            // if (oT.media.ytEl) {
            //     result['media-source'] = oT.media._ytEl.getVideoUrl();
            // } else {
            //     result['media-source'] = '';
            // }
        } else {
            result.media = '';
            result['media-source'] = '';
            result['media-time'] = '';
        }
        return JSON.stringify(result);
    }
});

exportFormats.send.push({
    name: 'Google Drive',
    setup: function(cb) {
        this.checkGoogleAuth = googleDriveSetup(cb);
    },
    fn: function(opts) {
        this.checkGoogleAuth(opts);
    }
})

function generateButtons(filename) {
    
    const downloadData = exportFormats.download.map(format => {
        const clean = cleanHTML( getTexteditorContents() );
        const file = format.fn(clean);
        const blob = new Blob([file], {type: 'data:text/plain'});
        const href = window.URL.createObjectURL(blob);
        
        return {
            format: format,
            file: file,
            href: href,
            filename: getFilename()
        };
    });    

    if (checkDownloadAttrSupport() === false) {
        downloadData.forEach(format => {
            format.href = convertToBase64(format.file);
        });
    }    
  
    return Mustache.render(template, {
        downloads: downloadData
    });
    
}

export function exportSetup(){
    
    $('.textbox-container').click(function(e) {
        if(
            $(e.target).is('#icon-exp') ||
            $(e.target).is('.export-panel') ||
            $(e.target).is('.sbutton.export')
        ){
            e.preventDefault();
            return;
        }
        hideExportPanel();
    });    
    
    $(".export-panel").click(function(e) {
         e.stopPropagation();
    });
    
    $('.sbutton.export').click(function() {
        // document.querySelector('.container').innerHTML = downloadButtons;
        var origin = $('#icon-exp').offset();
        var right = parseInt( $('body').width() - origin.left + 25 );
        var top = parseInt( origin.top ) - 50;
        
        const filename = getFilename();
        const data = {
            text: document.querySelector('#textbox').innerHTML,
            filename: filename
        };
        
        $('.export-panel')
            .html(generateButtons(filename));
		
		updateWebL10n(); //fix the L10N are brocken
		
        exportFormats.send.forEach(format => {

            if (format.ready) {
                format.fn(data);
            } else {
                format.setup(() => {
                    format.ready = true;
                    setTimeout(() => {
                        format.fn(data)
                    }, 500);
                });
            }
        });

        $('.export-panel')
            .css({'right': right,'top': top})
            .addClass('active'); 
        
    });
}

function hideExportPanel(){
    $('.export-panel').removeClass('active');
}

function checkDownloadAttrSupport() {
    var a = document.createElement('a');
    return (typeof a.download != "undefined");
}

function convertToBase64(str) {
    return "data:application/octet-stream;base64," + btoa(str);
}

//add by gsyan
function secondsToString(time) {
	if(typeof(time)=='string') {
		time = Number(time);
	}
    const hours = Math.floor(time / 3600).toString();
    const minutes = ("0" + Math.floor(time / 60) % 60).slice(-2);
    const seconds = ("0" + Math.floor( time % 60 )).slice(-2);
	const ms = ("00" + Math.floor(time*1000 % 1000 )).slice(-3);
    let formatted = minutes+":"+seconds;
	formatted = hours + ":" + minutes + ":" + seconds + ',' + ms;
    if (Number(hours)<10) {
        formatted = '0'+formatted
    }
    formatted = formatted.replace(/\s/g,'');
    return formatted;
}
function txtToSrt(txt, mediaLength) {
	//txt = '<p>  <br><br><span class="timestamp" data-timestamp="0">00:00</span> 「九月九日憶山東兄弟」，  <br><br><span class="timestamp" data-timestamp="3.080321">00:03</span> 作者：王維：  <br><br><span class="timestamp" data-timestamp="4.357043">00:04</span>  獨在異鄉為異客，  <br><br><span class="timestamp" data-timestamp="6.239092">00:06</span> 每逢佳節倍思親。  <br><br><span class="timestamp" data-timestamp="8.988128">00:08</span> 遙知兄弟登高處，  <br><br><span class="timestamp" data-timestamp="11.15625">00:11</span>   遍插茱萸少一人。  </p>  <p>    </p>';
	var re = /(<span\s+class="timestamp"\s+data-timestamp="([^"]+)">[^<]+)<\/span>/gm;
	var timestamp = txt.match(re);
	var total = timestamp.length;
	var timeList = [];
	for(var i=0; i<total; i++) {
		var str = timestamp[i];
		var m = str.match(/data-timestamp="([^"]+)">/);
		timeList.push(secondsToString(m[1]));
		if(mediaLength==0 && i==total-1) {
			mediaLength = 5+Number(m[1]);
		}
	}
	if(timeList.length>0) {
		timeList.push(secondsToString(mediaLength));
	}
	var lines = ('  '+txt).split(/<span\s+class="timestamp"[^>]+>[^<]+<\/span>/);
	var result = lines[0];
	var str;
	for(var i=1; i<lines.length; i++) {
		if(typeof(timestamp[i-1])!='undefined') {
			str = timestamp[i-1].replace(/>[^<]+<\/span>/, '>'+timeList[i-1]+' --&gt; '+timeList[i]+'<\/span><br>');
			result += i+'<br>'+str;
		}
		result += lines[i];
	}
	//console.log(result);
	return result.replace(/^\s+/, '');
}