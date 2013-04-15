/**
 * 作者: 劉易昇
 * 日期: 2013/04/12
 * 信箱: y78427@gmail.com
 * 目的: 顯示公司的違法或不利於求職者的資訊 (這是主程式)
 * 註記: 本專案的構想源自於"求職小幫手" http://jobhelper.g0v.ronny.tw/
 *       裡頭有部分程式碼(get_company_info)是直接複製自求職小幫手
         專案程式碼是從"http://robertnyman.com/2009/01/24/how-to-develop-a-firefox-extension/"裏頭的範例修改來的
 */
// to get the company info if any
var get_company_info = function(){
    var params = {};
    params.link = content.document.location.href;

    if ('www.104.com.tw' == content.document.location.hostname) {
	// 有 jQuery 可以用
	var company_dom = jQuery('#comp_header li.comp_name p a', content.document);
	if (company_dom.length != 0) {
	    params.from = '104';
	    params.name = company_dom.eq(0).text();
	    params.company_link = company_dom.eq(0).attr('href');
	    return params;
	}

	company_dom = jQuery('#comp_header li.comp_name h1', content.document);
	if (company_dom.length != 0) {
	    params.from = '104';
	    params.name = company_dom.text();
	    params.company_link = content.document.location;
	    return params;
	}
	
	return;
    } else if ('www.104temp.com.tw' == content.document.location.hostname) {
	// 檢查所有 a dom, 如果 company_intro.jsp 開頭的不超過兩個不一樣的，就確定是這家公司了
	var a_doms = $('a', content.document);
	var a_dom;
	for (var i = 0; i < a_doms.length; i ++) {
	    a_dom = a_doms.eq(i);
	    if (!a_dom.attr('href') || !a_dom.attr('href').match(/^company_intro\.jsp/)) {
		continue;
	    }
	    if (params.company_link && params.company_link != a_dom.attr('href')) {
		// 有兩家不一樣的公司，跳過
		return;
	    }
	    params.company_link = a_dom.attr('href');
	    params.name = a_dom.text();
	    params.from = '104temp';
	}

	return params;
    } else if ('www.yes123.com.tw' == content.document.location.hostname) {
	if (!jQuery('.comp_name').length) {
	    return;
	}
	var matches = content.document.location.search.match(/p_id=([^&]*)/);
	if (!matches) {
	    return;
	}

	params.from = 'yes123';
	params.name = jQuery('.comp_name').text();
	params.company_link = matches[1];
    } else if ('www.1111.com.tw' == content.document.location.hostname) {
	var found = false;
	jQuery('#breadcrumb li a').each(function(){
	    var self = $(this);

	    if (self.attr('href').match(/找工作機會/)) {
		params.from = '1111';
		params.name = self.text();
		params.company_link = self.attr('href');
		found = true;
		return false;
	    }
	});
	if (!found) {
	    return;
	}
    } else if ('www.518.com.tw' == content.document.location.hostname) {
        if (jQuery('#company-title').length) {
            params.from = '518';
            params.name = jQuery('#company-title').text().replace('所有工作機會?', '').replace(' ', '');
            params.company_link = content.document.location.href;
            return params;
        }

	if (!jQuery('.company-info h2 a').length) {
	    return;
	}

	var dom = jQuery('.company-info h2 a');
	params.from = '518';
	params.name = dom.text();
	params.company_link = dom.attr('href');
    } else {
	return;
    }

    return params;
};

function main() {
  var alertDiv = $("<div id='alertDiv' style='background: #cc103f; bottom: 10px; padding: 5px; text-align: center; z-index: 99999; font-size: 14.5px; line-height: 1.5; color: #fff; position: fixed'></div>");

  var companyInfo = get_company_info();
  
  // 不是目標網站就什麼事也不做
  if(!companyInfo) {
    return;
  }
  
  $("body", content.document).append(alertDiv);
  
  
  // 處理22K網站的資料
  // 給一個函式當做參數, 函式的參數(data)是所有22K的資料(格式請參考22k.js)
  // 當資料(data)取得成功時一一比對是否與這個頁面的公司名稱相同, 相同的話將所有相關的資料顯示出來
  salaryDataMap(function(data) {

    data.forEach(function(item){
      if(companyInfo.name.indexOf(item.companyName) >= 0) {
        // 收集"特殊要求"
        var notes = "";
        item.notes.forEach(function(elt) {
          notes += (elt + "+");
        });
        appendAlertMsg("*曾被舉報低薪在揭露22K網站* 職稱:" + item.jobName + ", 薪資:" + item.salary + ", 特殊要求:" + notes, item.screenShot);
      }
    })
  });
  
  // 處理 jobhelper 網站上的資料
  jobHelperDataMap(function(data) {
    data.forEach(function(item) {
      if(companyInfo.name.indexOf(item[0]) >= 0) {
        appendAlertMsg("違反" + item[2] + " 日期:" + item[1], item[3]);
      }
    });
  });
  
  // 將違規資訊加入 alertDiv 裡頭
  function appendAlertMsg(msg, link) {
    if(msg && link) {
      
      var str = "<div class='myClass'>" + msg + "</div>";
      var elt = $(str).css("color", "WHITE");
      elt.get(0).addEventListener("click", function(e){window.open(link)}, false);
      alertDiv.append(elt);
    }
  }
};

window.addEventListener("load", function () {
  gBrowser.addEventListener("DOMContentLoaded", function (event) {
    // 如果是iframe造成的這個事件就什麼事也不做(避免貼出重複的警告訊息)
    if(event.target instanceof Ci.nsIDOMHTMLDocument &&
    event.target != gBrowser.contentDocument) {
      return ;
    }

    main();
  }, false);
}, false);
