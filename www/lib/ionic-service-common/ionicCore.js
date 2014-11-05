angular.module('ionic.services.core', [])

/**
 * A core Ionic account identity provider. 
 *
 * Usage:
 * angular.module('myApp', ['ionic', 'ionic.services.common'])
 * .config(['$ionicAppProvider', function($ionicAccountProvider) {
 *   $ionicAppProvider.identify({
 *     app_id: 'x34dfxjydi23dx'
 *   });
 * }]);
 */
.provider('$ionicApp', function() {
  var app = {};

  var settings = {
    'api_server': 'http://ionic.io'
  };

  this.identify = function(opts) {
    app = opts;
  };

  /**
   * Set a config property.
   */
  this.set = function(k, v) {
    settings[k] = v;
  };

  this.setApiServer = function(server) {
    settings.api_server = server;
  };

  this.$get = [function() {
    return {
      getValue: function(k) {
        return settings[k];
      },
      getApiWriteKey: function() {
        return app.api_write_key;
      },
      getApiReadKey: function() {
        return app.api_read_key;
      },
      getApiUrl: function() {
        return this.getValue('api_server');
      },

      getApiEndpoint: function(service) {
        var app = this.getApp();
        if(!app) return null;

        return this.getApiUrl() + '/api/v1/' + app.app_id + '/' + service;
      },

      /**
       * Get the registered app for all commands.
       */
      getApp: function() {
        return app;
      }
    }
  }];
});

// Backwards compat
angular.module('ionic.services.common', ['ionic.services.core']);
