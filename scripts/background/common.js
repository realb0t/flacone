var background_store = {};

Store.Background = function() {
  return {
    load: function(property) {
      return background_store[property];
    },
    save: function(property, value) {
      background_store[property] = value;
      return this;
    }
  };
};

var Background = function() {
  return {
    Storage : Store.Background,
    Call    : function() {
      return {
        allTabsInCurrentWindow    : function(request, callback) {
          chrome.tabs.getAllInWindow(null, function(tabs) {
            tabs.each(function(tab){
              chrome.tabs.sendRequest(tab.id, request, callback);
            });
          });
        },
        allTabsInAllWindows       : function(request, callback) {
          chrome.windows.getAll(null, function(windows) {
            windows.each(function(window){
              chrome.tabs.getAllInWindow(window.id, function(tabs) {
                tabs.each(function(tab){
                    chrome.tabs.sendRequest(tab.id, request, callback);
                });
              });
            });
          });
        },
        currentTabInCurrentWindow : function(request, callback) {
          return this;  
        }
      };
    }
  }
};

var Handler = {
  'common' : function(request, sender, callback) {
    callback(JSON.encode(request));
  }
}

chrome.extension.onRequest.addListener(function(request, sender, callback){
  $H(request).each(function(value, key){
    try { request[key] = JSON.decode(value); } catch(e) {}
  });

  trace("request: ", request);

  $H(request).each(function(request, action){
      if (Handlers[action]) Handlers[action](request, sender, callback)
  });
});
