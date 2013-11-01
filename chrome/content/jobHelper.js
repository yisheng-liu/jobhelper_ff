/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示公司的違法或不利於求職者的資訊 (這是主程式)
 * 註記: 本專案的構想源自於"求職小幫手" http://jobhelper.g0v.ronny.tw/
         專案程式碼是從"http://robertnyman.com/2009/01/24/how-to-develop-a-firefox-extension/"裏頭的範例修改來的
 */

var jobHelper = (function() {
  return {run: main};


  function main() {
    var doc = content.document,
        companyInfo = getCompanyInfoFromWebPage();
    
    if(!companyInfo) { // 不是目標網站就什麼事也不做
      return;
    }
    
    // 在頁面加入顯示警告訊息的div
    (function() {
      var div = doc.getElementById("myAlertDiv"), 
          style = null,
          closeDiv = null;
      
      div = document.createElement("div");
      div.id = "myAlertDiv";
      
      style = div.style;
      style.background = "#cc103f";
      style.bottom = "0px";
      style.fontSize = "14.5px";
      style.position = "fixed";
      style.zIndex = "999";
      style.maxHeight = "30%";
      style.maxWidth = "1000px";
      style.overflow = "auto";
      
      closeDiv = document.createElement("div");
      closeDiv.setAttribute("id", "closeDiv");
      closeDiv.innerHTML = "關閉訊息 [目前沒有不良紀錄]";
      closeDiv.style.border = "#0000FF 5px groove";
      closeDiv.style.color = "WHITE";
      closeDiv.style.cursor = "pointer";
      closeDiv.addEventListener("click", function(e){e.target.parentNode.style.display="none";});
      div.appendChild(closeDiv);
      
      closeDiv = document.createElement("div");
      closeDiv.innerHTML = "設定要查詢的資料";
      closeDiv.style.border = "#0000FF 5px groove";
      closeDiv.style.color = "WHITE";
      closeDiv.style.cursor = "pointer";
      closeDiv.addEventListener("click", function(e){window.open("http://jobhelper.g0v.ronny.tw/index/setpackage", "_blank");});
      
      div.appendChild(closeDiv);
      doc.body.appendChild(div);
    }());
    
    // 處理22K網站的資料
    // 給一個函式當做參數, 函式的參數(data)是所有22K的資料(格式請參考22k.js)
    // 當資料(data)取得成功時一一比對是否與這個頁面的公司名稱相同, 相同的話將所有相關的資料顯示出來
    getDataFrom22K(function(data) {
      data.forEach(function(item){
        if(item.companyName.indexOf(companyInfo.name) >= 0 || companyInfo.name.indexOf(item.companyName) >= 0) {
          // 收集"特殊要求"
          appendAlertMsg("*" + item.companyName + ":曾被舉報低薪於揭露22K網站, 職稱:" + item.jobName + ", 薪資:" + item.salary + ", 特殊要求:" + item.note, item.screenShot);
        }
      });
    });

    // 處理 jobhelper 網站上的資料
    getDataFromJobHelper(companyInfo.name, companyInfo.link, function(data) {
      if (!data) {
        return ;
      }

      var packageURL = data.url, 
          url;
          
      data.forEach(function(datum) {
        if(datum[0].indexOf(companyInfo.name) >= 0 || companyInfo.name.indexOf(datum[0]) >= 0) {
          if(data.from === "online") {
            url = datum.url + "#company-" + datum[0] + "-" + datum[1];
          }
          else {
            url = packageURL + "#company-" + datum[0] + "-" + datum[1];
          }
          appendAlertMsg("*" + datum[0] + ":" + datum[2] + ", 日期:" + datum[1], url);
        }
      });
    });
    
    /**
     * Purpose: 將違規資訊加入 myAlertDiv 裡頭 (這邊使用了 lazy function definition pattern)
     */ 
    function appendAlertMsg(msg, link) {
      firstCall();
      
      // 第一次新增警告訊息時先修改 closeDiv 裡頭的說明
      function firstCall() {
        var div = doc.getElementById("myAlertDiv"), 
            style = null,
            elt = null;
            
        div.removeChild(doc.getElementById("closeDiv"));
        elt = document.createElement("div");
        elt.setAttribute("id", "closeDiv");
        elt.innerHTML = "關閉訊息 [請務必注意'網頁上的公司名稱'與'警告訊息中的公司名稱'是否相符]";
        elt.style.border = "#0000FF 5px groove";
        elt.style.color = "WHITE";
        elt.style.cursor = "pointer";
        elt.addEventListener("click", function(e){e.target.parentNode.style.display="none";});
        div.appendChild(elt); 
        // 重新宣告 appendAlertMsg 的定義
        appendAlertMsg = function(msg, link) {
          var div = doc.getElementById("myAlertDiv"), 
              style = null,
              elt = null;
            
          if(msg && link) {
            elt = document.createElement("p");
            elt.appendChild(document.createTextNode(msg));
            elt.style.color = "WHITE";
            elt.style.cursor = "pointer";
            elt.addEventListener("click", function(e){window.open(link);}, false);
            
            div.appendChild(elt);
          }
        };
        // 將這次呼叫的參數拿來呼叫重新宣告後的 appendAlertMsg
        appendAlertMsg(msg, link);
      }
    }
  }

  function getCompanyInfoFromWebPage() {
    var params = {},
        doc = content.document,
        name = null,
        hostname = doc.location.hostname;

    if ('www.104.com.tw' === hostname) {
      // 先找大標題
      try {
        name = doc.getElementById("comp_header").getElementsByClassName("comp_name")[0].getElementsByTagName("a")[1].textContent.trim();
      }
      catch(err) {
        // 大標題沒有, 換找小標題
        try {
          name = doc.getElementById("comp_header").getElementsByClassName("comp_name")[0].getElementsByTagName("h1")[0].textContent.trim();
        }
        catch(err) {
          return null;
        }
      }
      
      params.from = '104';
      params.company_link = doc.location;
    }
    else if ('www.104temp.com.tw' === hostname) {
      // 檢查所有 a dom, 如果 company_intro.jsp 開頭的不超過兩個不一樣的，就確定是這家公司了
      var a_doms = doc.getElementsByTagName("a"),
          a_dom = null;
      
      for (var i = 0; i < a_doms.length; i++) {
        a_dom = a_doms[i];
        if (!a_dom.getAttribute("href") || !a_dom.getAttribute("href").match(/^company_intro\.jsp/)) {
          continue;
        }
        if (params.company_link && params.company_link != a_dom.getAttribute("href")) {
          // 有兩家不一樣的公司，跳過
          return null;
        }

        params.company_link = a_dom.getAttribute('href');
        params.from = '104temp';
      }
    }
    else if("www.ejob.gov.tw" === hostname) {
      try {
        name = doc.getElementById("ctl00_ContentPlaceHolder1_lblCompName").textContent.trim();
      }
      catch(err) {
        return null;
      }
      
      params.from = 'ejob';
    }
    else if ('www.yes123.com.tw' === hostname || 'yes123.com.tw' === hostname) {
      try {
        name = doc.getElementsByClassName("comp_name")[0].textContent.trim();
      }
      catch(err) {
        return null;
      }

      params.from = 'yes123';
    }
    else if ('www.1111.com.tw' === hostname) {
      try {
        name = doc.getElementById("hd").getElementsByTagName("h1")[0].textContent.trim();
      }
      catch(err) {
        return null;
      }
      
      params.from = '1111';
    }
    else if ('www.518.com.tw' === hostname) {
      try { // 這邊是處理公司介紹的頁面
        name = doc.getElementById("company-title").getElementsByClassName("sTrong")[0].textContent.replace("所有工作機會»", "").trim().replace("認證", "");
      }
      catch(err) { // 這邊是處理職務介紹的頁面
        try {
          name = doc.getElementsByClassName("company-info")[0].getElementsByTagName("a")[0].textContent.trim();
        }
        catch(err) {
          return null;
        }
      }
      
      params.from = '518';
    } 
    else {
      return null;
    }

    params.link = doc.location.href;
    params.name = name;
    
    return params;
  }
  
  function getDataFrom22K(whenGet) {
    if(!whenGet) {
      return ;
    }

    // 用localStorage儲存資料
    var localStorage = content.window.localStorage,
        data22K = localStorage.getItem("22kData") ? JSON.parse(localStorage.getItem("22kData")) : null;

    // 檢查本地端是否有資料, 有的話檢查下載資料的時間是否在一週以內
    // 如果上述檢查沒通過就重新下載資料, 通過的話就進行 whenGet
    if(!data22K || !data22K.fetchTime || data22K.fetchTime + 604800*1000 < new Date().getTime()) {
      updateData(whenGet);
    }
    else {
      whenGet(data22K.data);
    }
    
    // 從22k網站下載資料並且儲存起來, 如果成功就進行 whenGet
    function updateData(whenGet) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://www.22kopendata.org/api/list_data/20/", true);
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4 && xhr.status === 200) {
          callback(xhr.responseText);
        }
      };
      xhr.send();
      
      function callback(responseXML) {
        var data22k = [],
            xmlDoc = (new DOMParser()).parseFromString(responseXML, "text/xml"),
            jobs = xmlDoc.getElementsByTagName("job");
        
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
          
          data22k.push(tmp);
        }
        
        localStorage.setItem("22kData", JSON.stringify({fetchTime: new Date().getTime(), data: data22k}));

        whenGet(data22k);
      }
    }
  }
  
  function getDataFromJobHelper(companyName, companyURL, whenGet) {
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
      
      xhr.open("GET", url, true);
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
          var data = [], datum;
          data.from = "online";
          ret.data.forEach(function(item){
            datum = [];
            datum[0] = item.name;
            datum[1] = item.date.replace(/-/g, "/");
            datum[2] = item.reason;
            datum[3] = item.link;
            datum[4] = item.snapshot;
            datum.url = getPackageURL(item.package_id);
            data.push(datum);
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
})();

window.addEventListener("load", function () {
  gBrowser.addEventListener("DOMContentLoaded", function (event) {
    // 如果是iframe造成的這個事件就什麼事也不做(避免貼出重複的警告訊息)
    if(!event.target instanceof Ci.nsIDOMHTMLDocument || !(event.target != gBrowser.contentDocument)) {
      jobHelper.run();
    }
  }, false);
}, false);
