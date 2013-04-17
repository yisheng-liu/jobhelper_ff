/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示公司的違法或不利於求職者的資訊 (這是主程式)
 * 註記: 本專案的構想源自於"求職小幫手" http://jobhelper.g0v.ronny.tw/
         專案程式碼是從"http://robertnyman.com/2009/01/24/how-to-develop-a-firefox-extension/"裏頭的範例修改來的
 */
// to get the company info if any
var get_company_info = function(){
  var params = {};
  var doc = content.document;
  params.link = doc.location.href;

  if ('www.104.com.tw' == doc.location.hostname) {
    var name;

    try {
      name = doc.getElementById("comp_header").getElementsByClassName("comp_name")[0].getElementsByTagName("h1")[0].textContent.trim();
    }
    catch(err) {
      return;
    }
    
    params.from = '104';
    params.name = name;
    params.company_link = doc.location;
  }
  else if ('www.104temp.com.tw' == doc.location.hostname) {
    // 檢查所有 a dom, 如果 company_intro.jsp 開頭的不超過兩個不一樣的，就確定是這家公司了
    var a_doms = doc.getElementsByTagName("a");
    var a_dom;
    
    for (var i = 0; i < a_doms.length; i++) {
	    a_dom = a_doms[i];
      if (!a_dom.getAttribute("href") || !a_dom.getAttribute("href").match(/^company_intro\.jsp/)) {
		    continue;
	    }
	    if (params.company_link && params.company_link != a_dom.getAttribute("href")) {
		    // 有兩家不一樣的公司，跳過
		    return;
	    }

	    params.company_link = a_dom.getAttribute('href');
      params.name = a_dom.textContent;
	    params.from = '104temp';
	  }
  }
  else if ('www.yes123.com.tw' == content.document.location.hostname) {
    try {
      var name = doc.getElementsByClassName("comp_name")[0].textContent.trim();
    }
    catch(err) {
      return ;
    }
    
    if (!name) {
      return;
    }

    params.from = 'yes123';
    params.name = name;
  }
  else if ('www.1111.com.tw' == content.document.location.hostname) {
    try {
      var name = doc.getElementById("hd").getElementsByTagName("h1")[0].textContent;
    }
    catch(err) {
      return ;
    }
    
    if(!name) {
      return ;
    }
    
    params.from = '1111';
    params.name = name;
  }
  else if ('www.518.com.tw' == content.document.location.hostname) {
    try { // 這邊是處理職務介紹的頁面
      var name = doc.getElementsByClassName("company-info")[0].getElementsByTagName("a")[0].textContent.trim();
    }
    catch(err) { // 這邊是處理公司介紹的頁面
      try {
        name = doc.getElementById("company-title").getElementsByTagName("strong")[1].textContent.trim();
      }
      catch(err) {
        return ;
      }
    }
    
    if(!name) {
      return ;
    }

    params.from = '518';
    params.name = name;
  } 
  else {
    return;
  }

  return params;
}

function main() {
  var doc = content.document;
  var companyInfo = get_company_info();
  
  if(!companyInfo) { // 不是目標網站就什麼事也不做
    return;
  }

  // 處理22K網站的資料
  // 給一個函式當做參數, 函式的參數(data)是所有22K的資料(格式請參考22k.js)
  // 當資料(data)取得成功時一一比對是否與這個頁面的公司名稱相同, 相同的話將所有相關的資料顯示出來
  try{
  salaryDataMap(function(data) {
    data.forEach(function(item){
      if(companyInfo.name.indexOf(item.companyName) >= 0) {
        // 收集"特殊要求"
        appendAlertMsg("*" + item.companyName + ":曾被舉報低薪於揭露22K網站, 職稱:" + item.jobName + ", 薪資:" + item.salary + ", 特殊要求:" + item.note, item.screenShot);
      }
    })
  });
  }catch(err){alert(err)}
  
  try{
  // 處理 jobhelper 網站上的資料
  jobHelperDataMap(function(data) {
    data.forEach(function(item) {
      if(companyInfo.name.indexOf(item[0]) >= 0) {
        appendAlertMsg("*" + item[0] + ":違反" + item[2] + ", 日期:" + item[1], item[3]);
      }
    });
  });
  }catch(err){alert(err)}
  
  // 將違規資訊加入 myAlertDiv 裡頭
  function appendAlertMsg(msg, link) {
    if(msg && link) {
      var div = doc.getElementById("myAlertDiv");

      if(!div) {
        div = document.createElement("div");
        div.id = "myAlertDiv";
        var style = div.style;
        style.background = "#cc103f";
        style.bottom = "10px";
        style.padding = "5px; text-align";
        style.textAlign = "center";
        style.fontSize = "14.5px";
        style.lineHeight = "1.5";
        style.position = "fixed";
        style.zIndex = "999";
        
        var closeDiv = document.createElement("div");
        closeDiv.innerHTML = "關閉此訊息 ";
        closeDiv.style.border = "#0000FF 5px groove";
        closeDiv.style.color = "WHITE";
        closeDiv.style.cursor = "pointer";
        closeDiv.addEventListener("click", function(e){e.target.parentNode.style.display="none"});
        
        div.appendChild(closeDiv);
        doc.body.appendChild(div);
      }
      
      var elt = document.createElement("div");
      elt.appendChild(document.createTextNode(msg));
      elt.style.color = "WHITE";
      elt.style.cursor = "pointer";
      elt.addEventListener("click", function(e){window.open(link)}, false);
      
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
