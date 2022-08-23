(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const FORBIDDEN_DOMAINS=["chrome.google.com"];var tabListener=null;function isBackgroundScript(){return new Promise(function(e,n){chrome.extension.getBackgroundPage()===window?e():n()})}function addOnMessageCallback(e){chrome.runtime.onMessage.removeListener(e),chrome.runtime.onMessage.addListener(e)}function removeOnMessageCallback(e){chrome.runtime.onMessage.removeListener(e)}function sendMessageToTab(e,n,t){chrome.tabs.sendMessage(e.id,n,t)}function sendMessageToBackground(e,n){chrome.runtime.sendMessage(e,n)}function loadStorage(e){return new Promise(function(n,t){chrome.storage[e].get(null,function(e){chrome.runtime.lastError&&t(chrome.runtime.lastError.message),n(e)})})}function saveStorage(e,n){return new Promise(function(t,o){chrome.storage[n].set(e,function(){chrome.runtime.lastError?o(chrome.runtime.lastError.message):t()})})}function injectScriptToTab(e,n,t){return new Promise(function(o,r){chrome.tabs.executeScript(n.id,{file:e,runAt:!0===t?"document_idle":"document_start",allFrames:t},function(){chrome.runtime.lastError?r(chrome.runtime.lastError):o()})})}function listenForTabs(e){null!==tabListener&&chrome.tabs.onUpdated.removeListener(tabListener),tabListener=function(n,t,o){"complete"===t.status&&e(o)},chrome.tabs.onUpdated.addListener(tabListener)}function getActiveTab(){return new Promise(function(e,n){chrome.tabs.query({active:!0,lastFocusedWindow:!0},function(t){0===t.length?n():e(t[0])})})}function reloadTab(e){return new Promise(function(n){chrome.tabs.reload(e.id,n)})}function openOptionsPage(){chrome.runtime.openOptionsPage()}function setBadgeText(e,n,t){var o=n.length>4?"∞":n;chrome.browserAction.setBadgeBackgroundColor({color:t,tabId:e.id}),chrome.browserAction.setBadgeText({text:o,tabId:e.id})}function getURL(e){return chrome.extension.getURL(e)}module.exports={isBackgroundScript:isBackgroundScript,addOnMessageCallback:addOnMessageCallback,removeOnMessageCallback:removeOnMessageCallback,sendMessageToTab:sendMessageToTab,sendMessageToBackground:sendMessageToBackground,getURL:getURL,loadStorage:loadStorage,saveStorage:saveStorage,injectScriptToTab:injectScriptToTab,listenForTabs:listenForTabs,getActiveTab:getActiveTab,reloadTab:reloadTab,openOptionsPage:openOptionsPage,setBadgeText:setBadgeText,forbiddenDomains:FORBIDDEN_DOMAINS};

},{}],2:[function(require,module,exports){
var browser=require("browser"),domainFilter=require("domainFilter"),MessageClient=require("messageClient");const ILLEGAL_PAGE_ERROR="GTE cannot run on this page.";var activeTab,contentDiv,activeDomain,filterControlsDiv,pageFilterStatus,userSettings,client=new MessageClient;function initialize(){contentDiv=document.getElementById("content"),configureOpenSettingsButton(),browser.getActiveTab().then(function(e){activeTab=e,activeDomain=domainFilter.extractDomainFromAddress(e.url),!1===domainFilter.isURLLegal(e.url)?displayIllegalMessage():(client.listen(onMessage),client.messageBackground({header:"getAllSettings"}))})}function onMessage(e){"settings"===e.header&&(client.stopListening(),userSettings=e.payload,domainFilter.initialize(userSettings.domainFilterMode,userSettings.domainFilterList),updatePopup())}function displayIllegalMessage(){var e=document.createElement("div");for(e.className="error",e.textContent=ILLEGAL_PAGE_ERROR;contentDiv.hasChildNodes();)contentDiv.removeChild(contentDiv.lastChild);contentDiv.appendChild(e)}function updatePopup(){var e=domainFilter.getMatchingFilterRule(activeTab.url);pageFilterStatus=document.getElementById("pageFilterStatus"),displayFilterMode(),displayPageFilterStatus(e),configureFilterButtons(e)}function displayFilterMode(){var e=document.getElementById("filterMode"),t=document.createElement("b");t.textContent=userSettings.domainFilterMode,e.appendChild(t)}function displayPageFilterStatus(e){var t=document.createElement("b");0===userSettings.domainFilterList.length||null===e?t.textContent="Unfiltered":t.textContent="Filtered",pageFilterStatus.appendChild(t)}function configureFilterButtons(e){if(filterControlsDiv=document.getElementById("filterControls"),null!==e){var t=createInputButton("Remove Associated Rule");t.filteredRule=e,t.addEventListener("click",removeAssociatedRule),filterControlsDiv.appendChild(t)}else{var i=createInputButton(userSettings.domainFilterMode+" "+activeDomain+"/*"),n=createInputButton(userSettings.domainFilterMode+" This Exact Page");i.addEventListener("click",addDomainToList),n.addEventListener("click",addURLToList),filterControlsDiv.appendChild(i),filterControlsDiv.appendChild(n)}}function removeAssociatedRule(){userSettings.domainFilterList.splice(userSettings.domainFilterList.indexOf(this.filteredRule),1),client.messageBackground({header:"setSettingsEntry",payload:{key:"domainFilterList",value:userSettings.domainFilterList}}),disableButtons(),transformRefreshButton(this)}function addDomainToList(){userSettings.domainFilterList.push(activeDomain+"/*"),client.messageBackground({header:"setSettingsEntry",payload:{key:"domainFilterList",value:userSettings.domainFilterList}}),disableButtons(),transformRefreshButton(this)}function addURLToList(){userSettings.domainFilterList.push(domainFilter.removeProtocolFromAddress(activeTab.url)),client.messageBackground({header:"setSettingsEntry",payload:{key:"domainFilterList",value:userSettings.domainFilterList}}),disableButtons(),transformRefreshButton(this)}function configureOpenSettingsButton(){document.getElementById("openSettingsButton").addEventListener("click",function(){browser.openOptionsPage()})}function createInputButton(e){var t=document.createElement("input");return t.type="button",t.value=e,t}function transformRefreshButton(e){e.value="",e.className="refreshButton",e.disabled=!1,e.removeEventListener("click",removeAssociatedRule),e.removeEventListener("click",addDomainToList),e.removeEventListener("click",addURLToList),e.addEventListener("click",function(){browser.reloadTab(activeTab),this.disabled=!0,window.close()})}function disableButtons(){for(var e=document.querySelectorAll("input[type=button]"),t=0;t<e.length;++t)e[t].disabled=!0}document.addEventListener("DOMContentLoaded",function(){browser.isBackgroundScript().catch(initialize)},!1);

},{"browser":1,"domainFilter":3,"messageClient":4}],3:[function(require,module,exports){
var browser=require("./browser");const IS_VALID_URL_REGEX=/^(http|https|ftp)/i,PROTOCOL_REMOVAL_REGEX=/^(?:\w+:\/\/)?(?:www\.)?([^\s\/]+(?:\/[^\s\/]+)*)\/*$/i,HOSTNAME_EXTRACTION_REGEX=/^(?:\w+:\/\/)?(?:www\.)?([^\\\/]*)/i;var filterMode,filterList;function initialize(e,r){filterMode=e,filterList=r}function isAddressAllowed(e){var r=isURLLegal(e);!0===r&&filterList.length>0&&(r=null===getMatchingFilterRule(e),"Whitelist"===filterMode&&(r=!r));return r}function getMatchingFilterRule(e){var r=null;if(e)for(var t=removeProtocolFromAddress(e),i=0;i<filterList.length;++i){var o=createRegexFromRule(filterList[i]);if(null!==o&&!0===o.test(t)){r=filterList[i];break}}return r}function isURLLegal(e){var r=!1;if(e&&IS_VALID_URL_REGEX.test(e)){var t=removeProtocolFromAddress(e);r=!0;for(var i=0;i<browser.forbiddenDomains.length;++i)if(0===t.indexOf(browser.forbiddenDomains[i])){r=!1;break}}return r}function createRegexFromRule(e){var r=removeProtocolFromAddress(e||"");return r=new RegExp("^"+replaceCharactersWithRegexNotation(r)+"$","i")}function replaceCharactersWithRegexNotation(e){var r=e||"";return r=(r=(r=(r=(r=(r=r.trim()).replace(/\s+/g,"%20")).replace(/\\/g,"/")).replace(/\/\*/g,"*")).replace(/\*+/g,"*")).replace(/\*/g,".*")}function removeProtocolFromAddress(e){return PROTOCOL_REMOVAL_REGEX.test(e)?PROTOCOL_REMOVAL_REGEX.exec(e)[1]:e}function extractDomainFromAddress(e){return HOSTNAME_EXTRACTION_REGEX.test(e)?HOSTNAME_EXTRACTION_REGEX.exec(e)[1]:e}module.exports={initialize:initialize,isAddressAllowed:isAddressAllowed,getMatchingFilterRule:getMatchingFilterRule,isURLLegal:isURLLegal,removeProtocolFromAddress:removeProtocolFromAddress,extractDomainFromAddress:extractDomainFromAddress};

},{"./browser":1}],4:[function(require,module,exports){
var browser=require("browser");function MessageClient(){var e=null;function s(s){e&&e(s)}function n(s,n,r){return e&&e(s,r,n.tab),!0}this.listen=function(s){e=s,browser.addOnMessageCallback(n)},this.stopListening=function(){e=null,browser.removeOnMessageCallback(n)},this.messageTab=function(e,n){browser.sendMessageToTab(e,n,s)},this.messageBackground=function(e){browser.sendMessageToBackground(e,s)}}module.exports=MessageClient;

},{"browser":1}]},{},[2]);
