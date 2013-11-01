/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示22K網站的資訊, 如果有的話
 */

/**
 * whenGet: 一個函式, 當22K資料蒐集好之後便將其當作參數來呼叫whenGet
 */
function salaryDataMap(whenGet) {
  if(!whenGet) {
    return ;
  }

  // 用localStorage儲存資料
  var storage = content.window.localStorage;
  var ret = storage.getItem("22kData");
  if(ret) {
    ret = JSON.parse(ret);
  }

  // 檢查本地端是否有資料, 有的話檢查下載資料的時間是否在一週以內
  // 如果上述檢查沒通過就重新下載資料, 通過的話就進行 whenGet
  if(!ret || !ret.fetchTime || ret.fetchTime + 604800*1000 < new Date().getTime()) {
    updateData(whenGet);
  }
  else {
    whenGet(ret.data);
  }
  
  // 從22k網站下載資料並且儲存起來, 如果成功就進行 whenGet
  function updateData(whenGet) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://www.22kopendata.org/api/list_data/20/");
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.send();
    
    function callback(responseXML) {
      var data = [];
      var xmlDoc = (new DOMParser()).parseFromString(responseXML, "text/xml");
      var jobs = xmlDoc.getElementsByTagName("job");
      
      for(var idx = 0; idx < jobs.length; idx++) {
        var job = jobs[idx];
        var tmp = {};
        tmp.companyName = job.getElementsByTagName("company_name")[0].textContent;
        tmp.jobName = job.getElementsByTagName("job_name")[0].textContent;
        tmp.salary = job.getElementsByTagName("salary")[0].textContent;
        tmp.note = "";
        // note 最多有兩個
        var note1 = job.getElementsByTagName("note1")[0];
        var note2 = job.getElementsByTagName("note2")[0];
        if(note1) {
          tmp.note += note1.textContent;
        }
        if(note2) {
          tmp.note += note2.textContent;
        }
        tmp.screenShot = job.getElementsByTagName("job_url_screenshot")[0].textContent;
        
        data.push(tmp);
      }
      
      storage.setItem("22kData", JSON.stringify({fetchTime: new Date().getTime(), data: data}));

      whenGet(data);
    }
  }
}