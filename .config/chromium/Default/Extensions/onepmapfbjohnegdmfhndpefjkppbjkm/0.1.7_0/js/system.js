var ext = function () {
  var debug = 0;
  var extid = chrome.runtime.id;
  var domains;
  this.popup = function () {
    $(document).ready(function () {
      domains = getStorage('domains') || [];
      //当前域名
      chrome.tabs.getSelected(function (tab) {
        var tabid = tab.id;
        var domain = getDomain(tab.url);
        var icon = tab.favIconUrl ? tab.favIconUrl : 'img/tab.png';
        if (!domain && (typeof tab.pendingUrl) != 'undefined') {
          domain = getDomain(tab.pendingUrl);
        }
        if (domain) {
          $('#popup .domain .icon').html('<img src="' + icon + '">');
          $('#popup .domain .url').html(domain);
          if (domains.indexOf(domain) > -1) {
            $('#popup .copy').removeClass('off').addClass('on');
            $('#popup .copy .tips').html(l('crackTips'));
          } else {
            $('#popup .copy').removeClass('on').addClass('off');
            $('#popup .copy .tips').html(l('crackTips'));
          }
          $('#popup .copy').on('mouseover mouseout', '', function (event) {
            var turn = $('#popup .copy').hasClass('on') ? 'off' : 'on';
            if (event.type == "mouseover") {
              //鼠标悬浮
              if (turn == 'on') {
                $('#popup .copy .tips').html(l('enableTips'));
              } else {
                $('#popup .copy .tips').html(l('disableTips'));
              }
            } else if (event.type == "mouseout") {
              //鼠标离开
              $('#popup .copy .tips').html(l('crackTips'));
            }
          });
          $('#popup .copy').on('click', '', function () {
            var turn = $('#popup .copy').hasClass('on') ? 'off' : 'on';
            chrome.runtime.sendMessage({
              super_type: "copy",
              turn: turn
            }, function (res) {
              if (turn == 'on') {
                $('#popup .copy').removeClass('off').addClass('on');
              } else {
                $('#popup .copy').removeClass('on').addClass('off');
              }
              $('#popup .copy .tips').html(l('crackTips'));
            });
          });
        } else {
          $('#popup .copy').removeClass('on').addClass('off');
          $('#popup .copy .tips').html(l('cannotTips'));
        }

        $("#super_version").html(chrome.runtime.getManifest().version);
        if (navigator.language == 'zh-CN' || navigator.language == 'zh-TW') {
          document.getElementById('super_home_url').href = 'https://www.crxfun.com/detail?id=onepmapfbjohnegdmfhndpefjkppbjkm';
          $('#popup .qqgroup').html('<div class="icon"></div><a href="https://jq.qq.com/?_wv=1027&k=Ov6fbCW0" target="_blank">' + l('qqgroup') + ':735652272</a>');
          $('#popup .findmore').html('<div class="icon"></div><a href="https://www.crxfun.com?hmsr=supercopy&hmpl=&hmcu=&hmkw=&hmci=" target="_blank">发现更多扩展 crxfun.com</a>');
          // document.getElementById("extinfo").style.display = "block";
        } else {
          // $('#popup .qqgroup').style.display = "none"
          document.getElementById("qqgroup").style.display = "none";
          document.getElementById("findmore").style.display = "none";
        }

        if (matchBaiduWk(tab.url)) {
          chrome.permissions.contains({
            permissions: ['webRequest', 'webRequestBlocking'],
            origins: ['https://*.baidu.com/*']
          }, (result) => {
            if (result) {
              document.getElementById("panel-tip").style.display = "none";
            } else {
              document.getElementById("panel-tip").style.display = "block";
            }
          });
        }

        if(localStorage.getItem("supercopycheckcrxrecommend")) {
          var nowtime = new Date().getTime();
          // console.log(nowtime - localStorage.getItem("supercopycheckcrxrecommend"));
          if((nowtime - localStorage.getItem("supercopycheckcrxrecommend")) > 1 * 1 * 24 * 60 * 1000) {
            $.ajax({
              type: "POST",
              url: "https://www.crxfun.com/crxrecommend",
              dataType: "json",
              data: { "language": navigator.language }, 
              success: function (data) {
                if(data) {
                  localStorage.setItem("supercopycrxrecommend", JSON.stringify(data));
                  localStorage.setItem("supercopycheckcrxrecommend", new Date().getTime());
                  $('#popup .recommend').html('<div class="icon"></div>' + '<div style="color:#d4237a">' + data.hot + '</div><div><a href="' + data.crxurl + '" target="_blank" style="color:#d4237a">' + data.name + ':' + data.desc + '</a></div>');
                  document.getElementById("recommend").style.display = "block";
                }
              },
              error: {}
            });
            
          } else {
            if(localStorage.getItem("supercopycrxrecommend")) {
              var data = JSON.parse(localStorage.getItem("supercopycrxrecommend"))
              $('#popup .recommend').html('<div class="icon"></div>' + '<div style="color:#d4237a">' + data.hot + '</div><div><a href="' + data.crxurl + '" target="_blank" style="color:#d4237a">' + data.name + ':' + data.desc + '</a></div>');
              document.getElementById("recommend").style.display = "block";
            }
          }
        } else {
          $.ajax({
            type: "POST",
            url: "https://www.crxfun.com/crxrecommend",
            dataType: "json",
            data: { "language": navigator.language }, 
            success: function (data) {
              if(data) {
                localStorage.setItem("supercopycrxrecommend", JSON.stringify(data));
                localStorage.setItem("supercopycheckcrxrecommend", new Date().getTime());
                $('#popup .recommend').html('<div class="icon"></div>' + '<div style="color:#d4237a">' + data.hot + '</div><div><a href="' + data.crxurl + '" target="_blank" style="color:#d4237a">' + data.name + ':' + data.desc + '</a></div>');
                document.getElementById("recommend").style.display = "block";
              }
            },
            error: {}
          });
        }
        
      });
      //禁止右键
      document.oncontextmenu = function () {
        if (!debug) {
          return false;
        }
      };
      //打开配置页
      $('#popup .option').on('click', function () {
        opentab('option.html', true, true);
      });

      document.querySelector('#my-button').addEventListener('click', function (event) {
        // Permissions must be requested from inside a user gesture, like a button's
        // click handler.
        chrome.permissions.request({
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['https://*.baidu.com/*']
        }, function (granted) {
          if (granted) {
            chrome.runtime.sendMessage({
              super_type: "checkpermission"
            }, function (res) {

            })

            chrome.runtime.sendMessage({
              super_type: "trackevent_on"
            }, function (res) {});
          } else {
            chrome.runtime.sendMessage({
              super_type: "trackevent_off"
            }, function (res) {});

          }
        });
      });
    });

    //刷新当前tab
    var refreshTab = function () {
      chrome.tabs.getSelected(function (tab) {
        if (tab.id > -1) {
          chrome.tabs.reload(tab.id);
        }
      });
    };
  };
  this.option = function () {
    domains = getStorage('domains') || [];
    //展示域名列表
    var html = '';
    domains.forEach(function (dm) {
      html = '<li class="list-group-item"><span class="badge" title="' + l('delete') + '"><i class="glyphicon glyphicon-remove"></i></span> <a href="http://' + dm + '" target="_blank">' + dm + '</a></li>';
      $('#option .domains .list-group').append(html);
    });
    //多语言
    $('#option .domains .alert').html('<strong>' + l('tips') + '</strong> ' + l('domainListsTips'));
    $('#option .nav .domainLists').html(l('domainLists'));
    $('#option .nav .rate').html(l('rate'));
    $('#option .main .panel-heading').html(l('domainLists'));

    //删除域名
    $('#option .domains .list-group').on('click', '.badge', function () {
      var _li = $(this).parent('li');
      var domain = _li.text();
      var index = domains.indexOf(domain);
      domains.splice(index, 1);
      setStorage('domains', domains);
      _li.remove();
    });
  };
  this.background = function () {
    $(document).ready(function () {
      domains = getStorage('domains') || [];
      //监听通讯请求
      chrome.runtime.onMessage.addListener(function (message, sender, reply) {
        if (!message.super_type) {
          return;
        }

        if (message.super_type == 'trackevent_on') {
          console.log('grant-on');
          _gaq.push(['_trackEvent', 'grant-on', chrome.runtime.getManifest().version]);
          return;
        }

        if (message.super_type == 'trackevent_off') {
          console.log('grant-off');
          _gaq.push(['_trackEvent', 'grant-off', chrome.runtime.getManifest().version]);
          return;
        }

        if (message.super_type == 'checkpermission') {
          checkPermission().then(result => {
            reply(result);
          })
          return true;
        }

        if (message.super_type == 'requestpermission') {
          chrome.tabs.create({
            url: `/access.html`
          })
          return;
        }

        // if(message.super_type == 'grantpermission'){
        //   grantPermission().then(result => {
        //     reply(result);
        //   })
        //   return true;
        // }

        if (message.super_type == 'addpermission') {
          enableBdwk();
          return true;
        }

        if (message.super_type == 'checkrestart') {
          if (localStorage.getItem("supercopycheckrestarttip")) {
            reply(localStorage.getItem("supercopycheckrestarttip"));
          } else {
            localStorage.setItem("supercopycheckrestarttip", new Date().getTime());
            reply('');
          }
          return;
        }

        //doc88跨域访问
        if (message.super_type == 'getsupercopydoc88path') {
          doAjaxThings().then(result => reply(result));
          return true;
        }

        if (message.super_type == 'getsupercopyinstalldate') {
          reply(localStorage.getItem("supercopyinstalldate"));
          return;
        }
        if (message.super_type == 'opentab') {
          chrome.tabs.create({
            url: "https://www.crxfun.com/detail?id=onepmapfbjohnegdmfhndpefjkppbjkm"
          });
          return;
        }
        var status = 1;
        if (message.super_type == 'copy') {
          chrome.tabs.getSelected(function (tab) {
            var tabid = tab.id;
            var domain = getDomain(tab.url);
            if (message.turn == 'on') {
              _gaq.push(['_trackEvent', 'on', domain]);
              turn('on', tabid, domain);
            } else {
              _gaq.push(['_trackEvent', 'off', domain]);
              turn('off', tabid, domain);
            }
          });
        } else if (message.super_type == 'reload') {
          window.location.reload();
        }
        reply({
          status: status
        });
      });
      //切换
      chrome.tabs.onSelectionChanged.addListener(function (tabId, selectInfo) {
        try {
          chrome.tabs.get(tabId, function (tab) {
            var domain = getDomain(tab.url);
            var icon = 'img/ico19.png';
            if (!inDomains(domain)) {
              icon = 'img/ico19_disable.png';
            }
            chrome.browserAction.setIcon({
              path: icon,
              tabId: tabId
            });
          });
        } catch (error) {
          log(error);
        }
      });
      //更新
      chrome.tabs.onUpdated.addListener(function (tabid, info, tab) {
        var domain = getDomain(info.url || tab.url);
        if (inDomains(domain)) {
          if (info.status == 'complete') {
            turn('on', tabid, domain);
          }
        } else {
          setIcon('off', tabid);
        }
      });
    });
    var turn = function (type, tabid, domain) {
      if (!domain) {
        return false;
      }
      domains = getStorage('domains') || [];
      var index = domains.indexOf(domain);
      if (type == 'on') {
        //增加域名
        if (index == -1) {
          domains.push(domain);
        }
        chrome.tabs.sendMessage(tabid, {
          msg: "super_crack"
        }, function (response) {
          if (response.super_result) {
            setIcon(type, tabid);
            console.log('执行特殊脚本');
          } else {
            console.log('执行通用脚本');
            //执行程序
            var src = chrome.runtime.getURL('js/code.js');
            var code = "var script = document.createElement('script');script.src = '" + src + "';document.body.appendChild(script);"
            var script = {
              code: code,
              allFrames: true
            };
            try {
              setIcon(type, tabid);
              chrome.tabs.executeScript(tabid, script);
            } catch (error) {
              log(error);
            }
          }
        });
      } else {
        //设置icon
        setIcon(type, tabid);
        //删除域名
        if (index > -1) {
          domains.splice(index, 1);
        }
        //刷新页面
        chrome.tabs.reload(tabid);
      }
      setStorage('domains', domains);
    };
    var inDomains = function (domain) {
      domains = getStorage('domains') || [];
      var index = domains.indexOf(domain);
      return index === -1 ? false : true;
    };
    var setIcon = function (type, tabid) {

      console.log("setIcon....")
      if (type == 'on') {
        chrome.browserAction.setIcon({
          path: 'img/ico19.png',
          tabId: tabid
        });
      } else {
        chrome.browserAction.setIcon({
          path: 'img/ico19_disable.png',
          tabId: tabid
        });
      }
    };
  };
  //打开页面
  var opentab = function (url, unique, selected) {
    var current = 0;
    if (url == '') {
      return false;
    }
    if (unique !== false) {
      unique = true;
    }
    if (selected !== false) {
      selected = true;
    }
    //判断是否声明 tabs 权限
    var permissions = chrome.app.getDetails()['permissions'];
    var permis = permissions.indexOf('tabs') > -1 ? true : false;
    if (permis && unique === true) {
      chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].url == url) {
            chrome.tabs.update(tabs[i].id, {
              selected: true
            });
            return true;
          }
        }
        chrome.tabs.create({
          url: url,
          selected: true
        });
        return true;
      });
    } else {
      chrome.tabs.create({
        url: url,
        selected: selected
      });
      return true;
    }
  };

  async function checkPermission() {
    let p = new Promise(function (resolve, reject) {
      chrome.permissions.contains({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*']
      }, (result) => {
        // The extension has the permissions.
        if (result) {
          let hasListener = chrome.webRequest.onBeforeSendHeaders.hasListener(wkheader)
          console.log("hasListener", hasListener)
          if (!hasListener) {
            enableBdwk()
          }
          resolve(result)
        } else {
          resolve(false)
          // The extension doesn't have the permissions.
        }
      });
    })
    return p;
  }

  async function grantPermission() {
    let p = new Promise(function (resolve, reject) {
      chrome.permissions.request({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['https://*.baidu.com/*']
      }, function (granted) {
        // The callback argument will be true if the user granted the permissions.
        if (granted) {
          enableBdwk();
          resolve(granted)
        } else {
          resolve(false)
        }
      });
    })
    return p;
  }

  var superUserAgent = ["Baiduspider", "Googlebot", "MSNBot", "bingbot"];
  var n = Math.floor(Math.random() * superUserAgent.length + 1) - 1;
  var userAgent = superUserAgent[n];

  function wkheader(details) {
    console.log("add wkheader");
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = userAgent
        break;
      }
    }
    return {
      requestHeaders: details.requestHeaders
    };
  }

  function enableBdwk() {
    try {
      //chrome72版本后需要extraHeaders才可以需要部分header
      chrome.webRequest.onBeforeSendHeaders.addListener(
        wkheader, {
          urls: ["https://wenku.baidu.com/view*seo=google&tag=mhloojimgila1op3mlc4kiidgbbnelip"],
        },
        ["blocking", "requestHeaders", "extraHeaders"]
      );
    } catch (e) {
      console.log(e)
      chrome.webRequest.onBeforeSendHeaders.addListener(
        wkheader, {
          urls: ["https://wenku.baidu.com/view*seo=google&tag=mhloojimgila1op3mlc4kiidgbbnelip"],
        },
        ["blocking", "requestHeaders"]
      );
    }
  }

  function disableBdwk() {
    chrome.webRequest.onBeforeSendHeaders.removeListener(wkheader);
  }

  async function doAjaxThings() {
    let result = await makeRequest("GET", "https://static.doc88.com/resources/js/modules/main-v2.min.js?v=2.45");
    let doc_88_path = /\("#cp_textarea"\).val\(([\S]*?)\);/.exec(result)[1]
    return doc_88_path;
  }

  var makeRequest = function (method, url) {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    });
  }

  var matchBaiduWk = function (url) {
    var regexp = new RegExp("wenku.baidu.com/view/.*");
    return regexp.test(url)
  }

  //获取域名
  var getDomain = function (url) {
    if (!url) {
      return false;
    }
    url = url.toLowerCase()
    var scheme = url.split("://")[0];
    if (scheme != "http" && scheme != "https") {
      return false;
    }
    var e = url.split("://")[1].split("/")[0].split(":")[0];
    var k = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    if (k.test(e)) {
      if (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) {
        if (RegExp.$1 == 192 && RegExp.$2 == 168) {
          return false
        }
        if (RegExp.$1 == 10) {
          return false
        }
        return e
      } else {
        return false
      }
    } else {
      if (e.substr(0, 4) == "www.") {
        e = e.substr(4)
      }
      return e
    }
  };
  var getUrlParam = function (key, url) {
    chrome.storage.local.get(['key'], function (result) {
      if (Object.values(result)[0] != undefined) {
        object1.innerHTML = Object.values(result)[0].val;
      }
    });

  };
  const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
        if (result[key] === undefined) {
          reject();
        } else {
          resolve(result[key]);
        }
      });
    });
  };
  //提取URL参数
  //url : http://www.abc.com/test?key=value 返回 value
  var getUrlParam = function (key, url) {
    var reg = new RegExp("(/?|^|&)" + key + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = url.substr(1).match(reg); //匹配目标参数
    if (r != null) {
      return decodeURIComponent(r[2]);
    }
    return null;
  };
  //获取本地缓存getStorage
  var getStorage = function (key) {
    result = null;
    if (typeof (window.localStorage['e__' + key]) !== "undefined") {
      result = JSON.parse(de(window.localStorage['e__' + key]));
    }
    return result;
  };
  //保存本地缓存setStorage
  var setStorage = function (key, val) {
    return window.localStorage['e__' + key] = en(JSON.stringify(val));
  };
  //清空本地缓存clearStorage
  var clearStorage = function (key) {
    window.localStorage.removeItem('e__' + key);
  };
  //调试log记录
  var log = function (text) {
    debug && console.log(text);
  };
  //语言
  var l = function (id) {
    return chrome.i18n.getMessage(id);
  };
  var en = function (input) {
    var output = "";
    if (!input) {
      return output;
    }
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = utf16to8(input);
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output + b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
    }
    return output;
  };
  var de = function (input) {
    var output = "";
    if (!input) {
      return output;
    }
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
      enc1 = b64.indexOf(input.charAt(i++));
      enc2 = b64.indexOf(input.charAt(i++));
      enc3 = b64.indexOf(input.charAt(i++));
      enc4 = b64.indexOf(input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
    }
    output = utf8to16(output);
    return output;
  };
  var utf16to8 = function (str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
      } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      } else {
        out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      }
    }
    return out;
  };
  var utf8to16 = function (str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
      c = str.charCodeAt(i++);
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out += str.charAt(i - 1);
          break;
        case 12:
        case 13:
          // 110x xxxx 10xx xxxx
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          // 1110 xxxx 10xx xxxx 10xx xxxx
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }
    return out;
  };
};