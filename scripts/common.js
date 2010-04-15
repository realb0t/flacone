var Store = {
  Config: function() {
    return {
      'version' : '0.0.0-alfa'
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
