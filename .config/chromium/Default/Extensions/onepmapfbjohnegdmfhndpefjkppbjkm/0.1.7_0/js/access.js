document.querySelector('#my-button').addEventListener('click', function (event) {
  // Permissions must be requested from inside a user gesture, like a button's
  // click handler.
  chrome.permissions.request({
    permissions: ['webRequest', 'webRequestBlocking'],
    origins: ['https://*.baidu.com/*']
  }, function (granted) {
    if (granted) {
      // chrome.runtime.sendMessage({
      //   super_type: "addpermission"
      // }, function (res) {
      //   if (res) {
      //     console.log("grant", res)
      //   }
      // });

      chrome.runtime.sendMessage({
        super_type: "trackevent_on"
      }, function (res) {});

      document.getElementById("grant-tip").style.display = "none";
      document.getElementById("success-tip").style.display = "block";

      setTimeout(function () {
        alert("授权完成后，重启浏览器后才能生效!");
      }, 500);

     

    } else {
      chrome.runtime.sendMessage({
        super_type: "trackevent_off"
      }, function (res) {});
      document.getElementById("grant-tip").style.display = "none";
      document.getElementById("fail-tip").style.display = "block";
    }
  });
});

document.querySelector('#fresh-button').addEventListener('click', function (event) {
  window.location.reload();
});

chrome.permissions.contains({
  permissions: ['webRequest', 'webRequestBlocking'],
  origins: ['https://*.baidu.com/*']
}, (result) => {
  if (result) {
    document.getElementById("success-tip").style.display = "block";
  } else {
    document.getElementById("grant-tip").style.display = "block";
  }
});