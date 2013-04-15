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

  // session storage api
  var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);

  var packageInfo = ss.getTabValue(gBrowser.selectedTab, "helper");
  packageInfo = packageInfo.length != 0 ? JSON.parse(packageInfo) : packageInfo;

  // 檢查本地端是否有package_info, 有的話檢查下載資料的時間是否在一週以內
  // 如果上述檢查沒通過就重新下載package_info
  if(packageInfo.length == 0 || !packageInfo.fetchTime || packageInfo.fetchTime + 604800*1000 < new Date()) {
    getPackageInfo(whenGet);
  }
  else {
    var pInfo = packageInfo.data;
    for(var i = 0; i < pInfo.length; i++) {
      var pkg = ss.getTabValue(gBrowser.selectedTab, "helper_" + pInfo[i].id);
      pkg = pkg.length != 0 ? JSON.parse(pkg) : pkg;
      
      if(pkg.length > 0) {
        whenGet(pkg.data);
      }
      else {
        getPackage(pInfo[i].id, pInfo[i].name, whenGet);
      }
    }
  }
  
  // 從網站下載package_info並且儲存起來, 如果成功就進行 whenGet
  function getPackageInfo(whenGet) {
    $.get("http://jobhelper.g0v.ronny.tw/api/getpackages/", function(ret) {
      
      var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
      
      ss.setTabValue(gBrowser.selectedTab, "helper", JSON.stringify({fetchTime: new Date(), data: ret.packages}));
      
      for(var i = 0; i < ret.packages.length; i++) {
        var id = ret.packages[i].id;
        var name = ret.packages[i].name;
        if(id && name) {
          getPackage(id, name, whenGet);
        }
      }
    });
  }
  
  // 從網站下載package, 如果成功就進行 whenGet
  function getPackage(pID, pName, whenGet) {
    $.get("http://jobhelper.g0v.ronny.tw/api/getpackage?id=" + pID, function(ret) {
      var pkg = {fetchTime: new Date(), name: pName, data: ret.content};
      var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].getService(Components.interfaces.nsISessionStore);
      
      ss.setTabValue(gBrowser.selectedTab, "helper_" + pID, JSON.stringify(pkg));
      
      whenGet(pkg.data);
    });
  }
}