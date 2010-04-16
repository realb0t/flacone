var content_store = {};

Store.Content = function() {
  return {
    load: function(property) {
      return content_store[property];
    },
    save: function(property, value) {
      content_store[property] = value;
      return this;
    }
  };
}

var Handler = {
  'common' : function(request, sender, callback) {
    callback(request);
  }
}

chrome.extension.onRequest.addListener(function(request, sender, callback){
  $H(request).each(function(value, key){
    try { request[key] = JSON.decode(value); } catch(e) {}
  });
  // TODO реализовать вызов хендлеров
});
