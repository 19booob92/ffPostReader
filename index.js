var self = require('sdk/self');
let { Cc,CC,Ci,Cr,Components } = require('chrome');
let { on } = require('sdk/system/events');
let { newURI } = require('sdk/url/utils');

const URI_TO_FILE = '/home/booob/Dokumenty/plik.txt'

const file = require('sdk/io/file');
var { ActionButton } = require("sdk/ui/button/action");

const ScriptableInputStream = CC("@mozilla.org/scriptableinputstream;1","nsIScriptableInputStream","init");
const observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);

function observeRequest(channel, topic, data) {
  let post = "X";
  
  if (!(channel instanceof Ci.nsIHttpChannel) ||
    !(channel instanceof Ci.nsIUploadChannel)) {
    return post;
  }
  if (channel.requestMethod !== 'POST') {
    return post;
  }

  try {
    let us = channel.uploadStream;
    if (!us) {
      return post;
    }
    if (us instanceof Ci.nsIMultiplexInputStream) {
      // Seeking in a nsIMultiplexInputStream effectively breaks the stream.
      return post;
    }
    if (!(us instanceof Ci.nsISeekableStream)) {
      // Cannot seek within the stream :(
      return post;
    }

    let oldpos = us.tell();
    us.seek(0, 0);

    try {
      let is = new ScriptableInputStream(us);

      // we'll read max 64k
      let available = Math.min(is.available(), 1 << 16);
      if (available) {
        post = is.read(available);
      }
    }
    finally {
      // Always restore the stream position!
      us.seek(0, oldpos);
    }
  }
  catch (ex) {
    Cu.reportError(ex);
  }
  return post;
}

var observer = {
     observe : function(subject, topic, data) {
     var postData = observeRequest(subject, topic, data);
	if (postData.length > 1) {
     		saveLog(postData);
	}
  }
}

observerService.addObserver(observer, 'http-on-modify-request', false);


function saveLog(str){
  var textWriter = file.open(URI_TO_FILE, 'w');
  textWriter.write(str);
  textWriter.close();
}

function readFile(){
  var textReader = file.open(URI_TO_FILE, 'r');
  var content = textReader.read();
  textReader.close();
  return content;
}

var runner = ActionButton({
    id: "runner",
    label: "click to run",
    icon: {
      "16": "./dupa.png"
    },
    onClick: function(state) {
	var oldContent = readFile();

	saveLog(oldContent + '\n' + "text");
    }
  });
