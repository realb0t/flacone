var options_store = {};

Store.Options = function() {
  return {
    load: function(property) {
      return options_store[property];
    },
    save: function(property, value) {
      options_store[property] = value;
      return this;
    }
  };
};
