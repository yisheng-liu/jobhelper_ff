/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示違反勞基法的資訊, 如果有的話
 */
function jobHelperDataMap(whenGet) {
  if(!whenGet) {
    return ;
  }

  // 用localStorage儲存資料
  var storage = content.window.localStorage;
  var packageInfo = storage.getItem("helperData");
  if(packageInfo) {packageInfo = JSON.parse(packageInfo)}

  // 檢查本地端是否有package_info, 有的話檢查下載資料的時間是否在一週以內
  // 如果上述檢查沒通過就重新下載package_info
  if(!packageInfo || !packageInfo.fetchTime || packageInfo.fetchTime + 604800*1000 < new Date().getTime()) {
    getPackageInfo(whenGet);
  }
  else {
    var pInfo = packageInfo.data;
    for(var i = 0; i < pInfo.length; i++) {
      var pkg = storage.getItem("helperData_" + pInfo[i].id);
      if(pkg) {pkg = JSON.parse(pkg)}
      
      if(pkg) {
        whenGet(pkg.data);
      }
      else {
        getPackage(pInfo[i].id, pInfo[i].name, whenGet);
      }
    }
  }
  
  // 從網站下載package_info並且儲存起來, 如果成功就進行 whenGet
  function getPackageInfo(whenGet) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://jobhelper.g0v.ronny.tw/api/getpackages/");
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(JSON.parse(xhr.responseText));
      }
    }
    xhr.send();
    
    function callback(ret) {
      storage.setItem("helperData", JSON.stringify({fetchTime: new Date().getTime(), data: ret.packages}));

      for(var i = 0; i < ret.packages.length; i++) {
        var id = ret.packages[i].id;
        var name = ret.packages[i].name;
        if(id && name) {
          getPackage(id, name, whenGet);
        }
      }
    }
  }
  
  // 從網站下載package, 如果成功就進行 whenGet
  function getPackage(pID, pName, whenGet) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://jobhelper.g0v.ronny.tw/api/getpackage?id=" + pID);
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(JSON.parse(xhr.responseText));
        
      }
    }
    xhr.send();

    function callback(ret) {
      storage.setItem("helperData_" + pID, JSON.stringify({fetchTime: new Date().getTime(), name: pName, data: ret.content}));

      whenGet(ret.content);
    }
  }
}