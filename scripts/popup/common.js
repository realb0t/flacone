var popup_store = {};

Store.Popup = function() {
  return {
    load: function(property) {
      return popup_store[property];
    },
    save: function(property, value) {
      popup_store[property] = value;
      return this;
    }
  };
};
