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
          return this;
        },
        allTabsInAllWindows       : function(request, callback) {
          return this;
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
  // TODO реализовать вызов хендлеров
});
