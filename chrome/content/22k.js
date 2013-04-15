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

  // session storage api
  var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);

  var ret = ss.getTabValue(gBrowser.selectedTab, "22kData");
  ret = ret.length != 0 ? JSON.parse(ret) : ret;

  // 檢查本地端是否有資料, 有的話檢查下載資料的時間是否在一週以內
  // 如果上述檢查沒通過就重新下載資料, 通過的話就進行 whenGet
  if(ret.length == 0 || !ret.fetchTime || ret.fetchTime + 604800*1000 < new Date()) {
    updateData(whenGet);
  }
  else {
    whenGet(ret.data);
  }
  
  // 從22k網站下載資料並且儲存起來, 如果成功就進行 whenGet
  function updateData(whenGet) {
    $.get("http://www.22kopendata.org/api/list_data/20/", function(ret) {
      var data = [];
      var xmlDoc = (new DOMParser()).parseFromString(ret, "text/xml");

      var jobs = xmlDoc.getElementsByTagName("job");
      for(var idx = 0; idx < jobs.length; idx++) {
        var job = jobs[idx];
        var tmp = {};
        tmp.companyName = $("company_name", job).text(); 
        tmp.jobName = $("job_name", job).text();
        tmp.salary = $("salary", job).text(); 
        tmp.notes = [];
        var i = 1;
        while(true) { // note 可能有多個
          var note = $("note"+i, job).text();
          i++;
          if(note.length != 1) {
            break ;
          }
          tmp.notes.push(note.value);
        }
        tmp.screenShot = $("job_url_screenshot", job).text();
        
        data.push(tmp);
      }
      
      var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
      ss.setTabValue(gBrowser.selectedTab, "22kData", JSON.stringify({fetchTime: new Date(), data: data}));
      
      whenGet(data);
    });
  }
}