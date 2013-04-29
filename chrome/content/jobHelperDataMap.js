/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示違反勞基法的資訊, 如果有的話
 */

function getJobHelperData(companyName, companyURL, whenGet) {
  if (!companyName || !companyURL || !whenGet) {
    return;
  }

  getDataByNameOnline(companyName, companyURL, whenGet, getLocalData);
  
  
  /**
   * Purpose: 線上要資料
   */ 
  function getDataByNameOnline(companyName, companyURL, success, fail) {
    var xhr = new XMLHttpRequest(), 
        url = 'http://jobhelper.g0v.ronny.tw/api/search?name=' + encodeURIComponent(companyName) + '&url=' + encodeURIComponent(companyURL) + '&packages=cookie';
    
    xhr.open("GET", url);
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(JSON.parse(xhr.responseText));
      }
    };
    xhr.send();
    
    function callback(ret) {
      if(ret.error) {
        fail(ret.message);
      }
      else {
        var data = [], tmp;
        data.func = "getDataByNameOnline";
        ret.data.forEach(function(item){
          tmp = [];
          tmp[0] = item.name;
          tmp[1] = item.date.replace(/-/g, "/");
          tmp[2] = item.reason;
          tmp[3] = item.link;
          tmp[4] = item.snapshot;
          tmp.url = getPackageURL(item.package_id);
          data.push(tmp);
        });
        success(data);
      }
    }
    
    function getPackageURL(id) {
      return "http://jobhelper.g0v.ronny.tw/package/show/" + id;
    }
  }
  
  /**
   * Purpose: 取得本地端的資料
   * Description: 檢查本地端是否有package_info, 有的話檢查下載資料的時間是否在三天以內. 如果上述檢查沒通過就重新下載package_info
   */
  function getLocalData() {
    var storage = content.window.localStorage,
        packageInfo = storage.getItem("helperData");
        
    if(packageInfo) {
      packageInfo = JSON.parse(packageInfo);
    }
  
    if(!packageInfo || !packageInfo.fetchTime || packageInfo.fetchTime + 259200*1000 < new Date().getTime()) {
      getPackageInfo(whenGet);
    }
    else {
      var pInfo = packageInfo.data;
      for(var i = 0; i < pInfo.length; i++) {
        var pkg = storage.getItem("helperData_" + pInfo[i].id);
        if(pkg) {
          pkg = JSON.parse(pkg);
        }
        
        if(pkg) {
          pkg.data.url = pInfo[i].url;
          whenGet(pkg.data);
        }
        else {
          getPackage(pInfo[i].id, pInfo[i].name, whenGet);
        }
      }
    }
  }
  
  /**
   * Purpose: 從網站下載package_info並且儲存起來, 如果成功就進行 whenGet
   */
  function getPackageInfo(whenGet) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://jobhelper.g0v.ronny.tw/api/getpackages/");
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(JSON.parse(xhr.responseText));
      }
    };
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
  
  /**
   * Purpose: 從網站下載package, 如果成功就進行 whenGet
   */
  function getPackage(pID, pName, whenGet) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://jobhelper.g0v.ronny.tw/api/getpackage?id=" + pID);
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4 && xhr.status === 200) {
        callback(JSON.parse(xhr.responseText));
        
      }
    };
    xhr.send();

    function callback(ret) {
      storage.setItem("helperData_" + pID, JSON.stringify({fetchTime: new Date().getTime(), name: pName, data: ret.content}));

      whenGet(ret.content);
    }
  }
}