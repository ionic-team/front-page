angular.module('ionic.services.analytics', ['ionic.services.common'])

/**
 * @private
 * When the app runs, add some heuristics to track for UI events.
 */
.run(['$ionicTrack', 'scopeClean', function($ionicTrack, scopeClean) {
  // Load events are how we track usage
  $ionicTrack.track('load');

  $ionicTrack.addType({
    name: 'button',
    shouldHandle: function(event) {
    },
    handle: function(event, data) {
      if(!event.type === 'click' || !event.target || !event.target.classList.contains('button')) {
        return;
      }
      $ionicTrack.trackClick(event.pageX, event.pageY, event.target);
    }
  });

  $ionicTrack.addType({
    name: 'tab-item',
    handle: function(event, data) {
      console.log(event);
      if(!event.type === 'click' || !event.target) {
        return;
      }
      var item = ionic.DomUtil.getParentWithClass(event.target, 'tab-item', 3);
      if(!item) {
        return;
      }

      var itemScope = angular.element(item).scope();

      $ionicTrack.trackClick(event.pageX, event.pageY, event.target, {
        scope: scopeClean(itemScope)
      });
    }
  });
}])

.provider('$ionicAnalytics', function() {
  return {
    $get: ['$ionicApp', function($ionicApp) {
      var client = new Keen({
        projectId: "5377805cd97b857fed00003f",
        writeKey: $ionicApp.getApiWriteKey()
      });

      return {
        getClient: function() {
          return client;
        }
      }
    }]
  }
})

.factory('xPathUtil', function() {
  var getElementTreeXPath = function(element) {
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode)
    {
      var index = 0;
      for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
      {
        // Ignore document type declaration.
        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
          continue;

        if (sibling.nodeName == element.nodeName)
          ++index;
      }

      var tagName = element.nodeName.toLowerCase();
      var pathIndex = (index ? "[" + (index+1) + "]" : "");
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
  }

  return {
    getElementXPath: function(element) {
      // Code appropriated from open source project FireBug
      if (element && element.id)
        return '//*[@id="' + element.id + '"]';
      else
        return getElementTreeXPath(element);
    },

    getElementByXPath: function(path, context) {
      var xResult = document.evaluate(path, context || document);
      return xResult.iterateNext();
    }
  }
})


/**
 * @private
 * Clean a given scope (for sending scope data to the server for analytics purposes.
 * This removes things we don't care about and tries to just expose
 * useful scope data.
 */
.factory('scopeClean', function() {
  var clean = function(scope) {
    // Make a container object to store all our cloned properties
    var cleaned = angular.isArray(scope) ? [] : {};

    for (var key in scope) {
      // Check that the property isn't inherited
      if (!scope.hasOwnProperty(key))
        continue;

      var val = scope[key];

      // Filter out bad property names / values
      if (key === 'constructor' || key === 'this' ||
          typeof val === 'function' ||
          key.indexOf('$') != -1 ) {
        continue;
      }

      // Recurse if we're looking at an object or array
      if (typeof val === 'object') {
        cleaned[key] = clean(val);
      } else {
        // Otherwise just pop it onto the cleaned object
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
  return clean;
})

.factory('$ionicUser', [
  '$q',
  '$timeout',
  '$window',
function($q, $timeout, $window) {
  // Some crazy bit-twiddling to generate a random guid
  function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
  }

  function storeObject(objectName, object) {
    // Convert object to JSON and store in localStorage
    var jsonObj = JSON.stringify(object);
    $window.localStorage.setItem(objectName, jsonObj);
  }

  function getObject(objectName) {
    // Deserialize the object from JSON and return
    var jsonObj = $window.localStorage.getItem(objectName);
    if (jsonObj == null) { // null or undefined, return null
      return null;
    }
    try {
      return JSON.parse(jsonObj);
    } catch (err) {
      return null;
    }
  }

  // User object we'll use to store all our user info
  var storedUser = getObject('user');
  var user = storedUser || {};

  // Generate a device and user ids if we don't have them already
  var isUserDirty = false;
  if (!user.user_id) {
    user.user_id = generateGuid();
    isUserDirty = true;
  }
  if (!user.device_id) {
    user.device_id = generateGuid();
    isUserDirty = true;
  }

  // Write to local storage if we changed anything on our user object
  if (isUserDirty) {
    storeObject('user', user);
  }

  return {
    identify: function(userData) {
      // Copy all the data into our user object
      angular.extend(user, userData);

      // Write the user object to our local storage
      storeObject('user', user);
    },
    get: function() {
      return user;
    }
  }
}])

/**
 * @ngdoc service
 * @name $ionicTrack
 * @module ionic.services.analytics
 * @description
 *
 * A simple yet powerful analytics tracking system.
 *
 * The simple format is eventName, eventData. Both are arbitrary but should be
 * the same as previous events if you wish to query on them later.
 *
 * @usage
 * ```javascript
 * $ionicTrack.track('Load', {
 *   what: 'this'
 * });
 *
 * // Click tracking
 * $ionicTrack.trackClick(x, y, {
 *   thing: 'button'
 * });
 * ```
 */
.factory('$ionicTrack', [
  '$q',
  '$timeout',
  '$state',
  '$ionicApp',
  '$ionicUser',
  '$ionicAnalytics',
  'xPathUtil',
function($q, $timeout, $state, $ionicApp, $ionicUser, $ionicAnalytics, xPathUtil) {
  var _types = [];

  return {
    addType: function(type) {
      _types.push(type);
    },
    getTypes: function() {
      return _types;
    },
    getType: function(event) {
      var i, j, type;
      for(i = 0, j = _types.length; i < j; i++) {
        type = _types[i];
        if(type.shouldHandle(event)) {
          return type;
        }
      }
      return null;
    },
    send: function(eventName, data) {
      // Copy objects so we can add / remove properties without affecting the original
      var app = angular.copy($ionicApp.getApp());
      var user = angular.copy($ionicUser.get());

      // Don't expose api keys, etc if we don't have to
      delete app.api_write_key;
      delete app.api_read_key;

      // Add user tracking data to everything sent to keen
      data = angular.extend(data, {
        activeState: $state.current.name,
        _app: app
      });

      if(user) {
        data = angular.extend(data, {
          user: user
        });
      }
      console.trace();

      var deferred = $q.defer();
      $timeout(function() {
        console.log('Sending', {
          'status': 'sent',
          'message': data
        });
        $ionicAnalytics.getClient().addEvent(app.app_id + '-' + eventName, data);
        deferred.resolve({
          'status': 'sent',
          'message': data
        });
      });

      return deferred.promise;
    },
    track: function(eventName, data) {
      return this.send(eventName, {
        data: data
      });
    },

    trackClick: function(x, y, target, data) {
      // We want to also include coordinates as a percentage relative to the target element
      var box = target.getBoundingClientRect();
      var width = box.right - box.left,
          height = box.bottom - box.top;
      var normX = (x - box.left) / width,
          normY = (y - box.top) / height;

      // Now get an xpath reference to the target element
      var xPath = xPathUtil.getElementXPath(target);

      return this.send('tap', {
        normCoords: {
          x: normX,
          y: normY
        },
        coords: {
          x: x,
          y: y
        },
        element: xPath,
        data: data
      });
    },

    identify: function(userData) {
      $ionicUser.identify(userData);
    }
  }
}])

/**
 * @ngdoc directive
 * @name ionTrackClick
 * @module ionic.services.analytics
 * @restrict A
 * @parent ionic.directive:ionTrackClick
 *
 * @description
 *
 * A convenient directive to automatically track a click/tap on a button
 * or other tappable element.
 *
 * @usage
 * ```html
 * <button class="button button-clear" ion-track-click ion-track-event="cta-tap">Try now!</button>
 * ```
 */
.directive('ionTrackClick', ['$ionicTrack', 'scopeClean', function($ionicTrack, scopeClean) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var eventName = $attr.ionTrackEvent;
      $element.on('click', function(e) {
        $ionicTrack.trackClick(e.pageX, e.pageY, e.target, {
          scope: scopeClean(angular.element(e.target).scope())
        });
      });
    }
  }
}])

/**
 * @ngdoc directive
 * @name ionTrackAuto
 * @module ionic.services.analytics
 * @restrict A
 * @parent ionic.directive:ionTrackAuto
 *
 * @description
 *
 * Automatically track events on UI elements. This directive tracks heuristics to automatically detect
 * taps and interactions on common built-in Ionic components.
 *
 * None: this element should be applied on the body tag.
 *
 * @usage
 * ```html
 * <body ion-track-auto></body>
 * ```
 */
.directive('ionTrackAuto', ['$document', '$ionicTrack', 'scopeClean', function($document, $ionicTrack, scopeClean) {
  var getType = function(e) {
    if(e.target.classList) {
      var cl = e.target.classList;
      if(cl.contains('button')) {
        return ButtonType;
      }
    }
    return null;
  };
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      $document.on('click', function(event) {
        var i, j, type, _types = $ionicTrack.getTypes();
        for(i = 0, j = _types.length; i < j; i++) {
          type = _types[i];
          if(type.handle(event) === false) {
            return false;
          }
        }

        $ionicTrack.trackClick(event.pageX, event.pageY, event.target, {});
      });
    }
  }
}])
