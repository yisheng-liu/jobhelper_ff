/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示公司的違法或不利於求職者的資訊 (這是主程式)
 * 註記: 本專案的構想源自於"求職小幫手" http://jobhelper.g0v.ronny.tw/
         專案程式碼是從"http://robertnyman.com/2009/01/24/how-to-develop-a-firefox-extension/"裏頭的範例修改來的
 */
// to get the company info if any
function get_company_info() {
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
  else if ('www.yes123.com.tw' === hostname) {
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

function main() {
  var doc = content.document,
      companyInfo = get_company_info();
  
  if(!companyInfo) { // 不是目標網站就什麼事也不做
    return;
  }
  
  // 處理22K網站的資料
  // 給一個函式當做參數, 函式的參數(data)是所有22K的資料(格式請參考22k.js)
  // 當資料(data)取得成功時一一比對是否與這個頁面的公司名稱相同, 相同的話將所有相關的資料顯示出來
  salaryDataMap(function(data) {
    data.forEach(function(item){
      if(item.companyName.indexOf(companyInfo.name) >= 0 || companyInfo.name.indexOf(item.companyName) >= 0) {
        // 收集"特殊要求"
        appendAlertMsg("*" + item.companyName + ":曾被舉報低薪於揭露22K網站, 職稱:" + item.jobName + ", 薪資:" + item.salary + ", 特殊要求:" + item.note, item.screenShot);
      }
    });
  });
  
  // 處理 jobhelper 網站上的資料
  jobHelperDataMap(function(data) {
    var packageURL = data.url;
    data.forEach(function(item) {
      if(item[0].indexOf(companyInfo.name) >= 0 || companyInfo.name.indexOf(item[0]) >= 0) {
        var url = packageURL + "#company-" + item[0] + "-" + item[1];
        appendAlertMsg("*" + item[0] + ":違反" + item[2] + ", 日期:" + item[1], url);
      }
    });
  });
  
  // 將違規資訊加入 myAlertDiv 裡頭
  function appendAlertMsg(msg, link) {
    if(msg && link) {
      var div = doc.getElementById("myAlertDiv"), 
          style = null,
          elt = null;

      if(!div) {
        var closeDiv = null;
        
        div = document.createElement("div");
        div.id = "myAlertDiv";
        
        style = div.style;
        style.background = "#cc103f";
        style.bottom = "10px";
        style.fontSize = "14.5px";
        style.position = "fixed";
        style.zIndex = "999";
        
        closeDiv = document.createElement("div");
        closeDiv.innerHTML = "關閉訊息[請務必注意'網頁上的公司名稱'與'警告訊息的公司名稱'是否相符]";
        closeDiv.style.border = "#0000FF 5px groove";
        closeDiv.style.color = "WHITE";
        closeDiv.style.cursor = "pointer";
        closeDiv.addEventListener("click", function(e){e.target.parentNode.style.display="none";});
        
        div.appendChild(closeDiv);
        doc.body.appendChild(div);
      }
      
      elt = document.createElement("p");
      elt.appendChild(document.createTextNode(msg));
      elt.style.color = "WHITE";
      elt.style.cursor = "pointer";
      elt.addEventListener("click", function(e){window.open(link);}, false);
      
      div.appendChild(elt);
    }
  }
}

window.addEventListener("load", function () {
  gBrowser.addEventListener("DOMContentLoaded", function (event) {
    // 如果是iframe造成的這個事件就什麼事也不做(避免貼出重複的警告訊息)
    if(!event.target instanceof Ci.nsIDOMHTMLDocument || !(event.target != gBrowser.contentDocument)) {
      main();
    }
  }, false);
}, false);
