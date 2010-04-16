var Store = {
  Config: function() {
    return {
      'version'          : '0.0.0-alfa',
      'display_debugs'   : false,
      'display_warnings' : true,
      'display_errors'   : true
    }
  },
  Locale: function() {
    if (localStorage) {
      return {
        load: function(property) {
          return localStorage[property];
        },
        save: function(property, value) {
          localStorage[property] = value;
          return this;
        }
      };
    } else {
      return {
        load: function() {
          return null;
        },
        save: function() {
          return this;
        }
      };
    }
  }
};

function debug(){
  if(console && console.log && Store.Config().display_debugs)
    return window.console.log.apply(console, arguments);
};

function warn() {
  if(console && console.warn && Store.Config().display_warnings)
    return window.console.warn.apply(console, arguments);  
}

function error() {
  if(console && console.error && Store.Config().display_errors)
    return window.console.error.apply(console, arguments);  
}

function alarm() {
  alert.apply(window, arguments.join(' '))
}
