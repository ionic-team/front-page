var IonicServiceAnalyticsModule = angular.module('ionic.services.analytics', ['ionic.services.common']);

IonicServiceAnalyticsModule

/**
 * @private
 * When the app runs, add some heuristics to track for UI events.
 */
.run(['$ionicTrack', 'scopeClean', '$timeout', function($ionicTrack, scopeClean, $timeout) {
  // Load events are how we track usage
  $timeout(function() {
    $ionicTrack.send('load', {});
  }, 2000);

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

.factory('domSerializer', function() {
  var getElementTreeXPath = function(element) {
    // Calculate the XPath of a given element
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
    serializeElement: function(element) {
      // Code appropriated from open source project FireBug
      if (element && element.id)
        return '//*[@id="' + element.id + '"]';
      else
        return getElementTreeXPath(element);
    },

    deserializeElement: function(xpath, context) {
      var searchResult = document.evaluate(xpath, context || document);
      return searchResult.iterateNext();
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


/**
 * @ngdoc service
 * @name $ionicUser
 * @module ionic.services.analytics
 * @description
 *
 * An interface for storing data to a user object which will be sent with all analytics tracking.
 *
 * Add tracking data to the user by passing objects in to the identify function.
 * Identify a user with a user_id (from, e.g., logging in) to track a single user's
 * activity over multiple devices.
 *
 * @usage
 * ```javascript
 * $ionicUser.get();
 *
 * // Add info to user object
 * $ionicUser.identify({
 *   username: "Timmy"
 * });
 *
 * $ionicUser.identify({
 *   user_id: 123
 * });
 * ```
 */
.factory('$ionicUser', [
  '$q',
  '$timeout',
  '$window',
  '$ionicApp',
function($q, $timeout, $window, $ionicApp) {
  // User object we'll use to store all our user info
  var storageKeyName = 'ionic_analytics_user_' + $ionicApp.getApp().app_id;;
  var user = getObject(storageKeyName) || {};

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
    storeObject(storageKeyName, user);
  }

  function generateGuid() {
    // Some crazy bit-twiddling to generate a random guid
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

  return {
    identify: function(userData) {
      // Copy all the data into our user object
      angular.extend(user, userData);

      // Write the user object to our local storage
      storeObject(storageKeyName, user);
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
 * $ionicTrack.track('open', {
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
  '$interval',
  '$window',
  '$http',
  'domSerializer',
function($q, $timeout, $state, $ionicApp, $ionicUser, $ionicAnalytics, $interval, $window, $http, domSerializer) {
  var _types = [];

  var storedQueue = $window.localStorage.getItem('ionic_analytics_event_queue'),
      eventQueue;
  try {
    eventQueue = storedQueue ? JSON.parse(storedQueue) : {};
  } catch (e) {
    eventQueue = {};
  }

  var useEventCaching = true,
      dispatchInProgress = false,
      dispatchInterval,
      dispatchIntervalTime;
  setDispatchInterval(2 * 60);
  $timeout(function() {
    dispatchQueue();
  });

  function connectedToNetwork() {
    // Can't access navigator stuff? Just assume connected.
    if (typeof navigator.connection === 'undefined' ||
        typeof navigator.connection.type === 'undefined' ||
        typeof Connection === 'undefined') {
      return true;
    }

    // Otherwise use the PhoneGap Connection plugin to determine the network state
    var networkState = navigator.connection.type;
    return networkState == Connection.ETHERNET ||
           networkState == Connection.WIFI ||
           networkState == Connection.CELL_2G ||
           networkState == Connection.CELL_3G ||
           networkState == Connection.CELL_4G ||
           networkState == Connection.CELL;
  }

  function dispatchQueue() {
    if (Object.keys(eventQueue).length === 0) return;
    if (!connectedToNetwork()) return;
    if (dispatchInProgress) return;

    console.log('dipatching queue', eventQueue);
    dispatchInProgress = true;

    // Perform a bulk dispatch of all events in the event queue
    // https://keen.io/docs/data-collection/bulk-load/
    var client = $ionicAnalytics.getClient().client,
        url = client.endpoint + '/projects/' + client.projectId + '/events';
    $http.post(url, eventQueue, {
      headers: {
        "Authorization": client.writeKey,
        "Content-Type": "application/json"
      }
    })
    .success(function() {
      // Clear the event queue and write this change to disk.
      eventQueue = {};
      $window.localStorage.setItem('ionic_analytics_event_queue', JSON.stringify(eventQueue));
      dispatchInProgress = false;
    })
    .error(function(data, status, headers, config) {
      console.log("Error sending tracking data", data, status, headers, config);
      dispatchInProgress = false;
    });

  }

  function enqueueEvent(eventName, data) {
    console.log('enqueueing event', eventName, data);

    // Add timestamp property to the data
    if (!data.keen) {
      data.keen = {};
    }
    data.keen.timestamp = new Date().toISOString();

    // Add the data to the queue
    if (!eventQueue[eventName]) {
      eventQueue[eventName] = [];
    }
    eventQueue[eventName].push(data);

    // Write the queue to disk
    $window.localStorage.setItem('ionic_analytics_event_queue', JSON.stringify(eventQueue));
  }

  function setDispatchInterval(value) {
    // Set how often we should send batch events to Keen, in seconds.
    // Set this to a nonpositive number to disable event caching
    dispatchIntervalTime = value;

    // Clear the existing interval and set a new one.
    if (dispatchInterval) {
      $interval.cancel(dispatchInterval);
    }

    if (value > 0) {
      dispatchInterval = $interval(function() { dispatchQueue() }, value * 1000);
      useEventCaching = true;
    } else {
      useEventCaching = false;
    }
  }

  function getDispatchInterval() {
    return dispatchIntervalTime;
  }

  return {
    setDispatchInterval: setDispatchInterval,
    getDispatchInterval: getDispatchInterval,
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

      if (useEventCaching) {
        enqueueEvent(app.app_id + '-' + eventName, data);
      } else {
        console.log('Immediate event dispatch', eventName, data);
        $ionicAnalytics.getClient().addEvent(app.app_id + '-' + eventName, data);
      }
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
      var elementSerialized = domSerializer.serializeElement(target);

      return this.send('tap', {
        normCoords: {
          x: normX,
          y: normY
        },
        coords: {
          x: x,
          y: y
        },
        element: elementSerialized,
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

.directive('ionTrackClick', ionTrackDirective('click'))
.directive('ionTrackTap', ionTrackDirective('tap'))
.directive('ionTrackDoubletap', ionTrackDirective('doubletap'))
.directive('ionTrackHold', ionTrackDirective('hold'))
.directive('ionTrackRelease', ionTrackDirective('release'))
.directive('ionTrackDrag', ionTrackDirective('drag'))
.directive('ionTrackDragLeft', ionTrackDirective('dragleft'))
.directive('ionTrackDragRight', ionTrackDirective('dragright'))
.directive('ionTrackDragUp', ionTrackDirective('dragup'))
.directive('ionTrackDragDown', ionTrackDirective('dragdown'))
.directive('ionTrackSwipeLeft', ionTrackDirective('swipeleft'))
.directive('ionTrackSwipeRight', ionTrackDirective('swiperight'))
.directive('ionTrackSwipeUp', ionTrackDirective('swipeup'))
.directive('ionTrackSwipeDown', ionTrackDirective('swipedown'))
.directive('ionTrackTransform', ionTrackDirective('hold'))
.directive('ionTrackPinch', ionTrackDirective('pinch'))
.directive('ionTrackPinchIn', ionTrackDirective('pinchin'))
.directive('ionTrackPinchOut', ionTrackDirective('pinchout'))
.directive('ionTrackRotate', ionTrackDirective('rotate'))


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
}]);

/**
 * Generic directive to create auto event handling analytics directives like:
 *
 * <button ion-track-click="eventName">Click Track</button>
 * <button ion-track-hold="eventName">Hold Track</button>
 * <button ion-track-tap="eventName">Tap Track</button>
 * <button ion-track-doubletap="eventName">Double Tap Track</button>
 */
function ionTrackDirective(domEventName) {
  return ['$ionicTrack', '$ionicGesture', 'scopeClean', function($ionicTrack, $ionicGesture, scopeClean) {

    var gesture_driven = [
      'drag', 'dragstart', 'dragend', 'dragleft', 'dragright', 'dragup', 'dragdown',
      'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown',
      'tap', 'doubletap', 'hold',
      'transform', 'pinch', 'pinchin', 'pinchout', 'rotate'
    ];
    // Check if we need to use the gesture subsystem or the DOM system
    var isGestureDriven = false;
    for(var i = 0; i < gesture_driven.length; i++) {
      if(gesture_driven[i] == domEventName.toLowerCase()) {
        isGestureDriven = true;
      }
    }
    return {
      restrict: 'A',
      link: function($scope, $element, $attr) {
        var capitalized = domEventName[0].toUpperCase() + domEventName.slice(1);
        // Grab event name we will send
        var eventName = $attr['ionTrack' + capitalized];

        if(isGestureDriven) {
          var gesture = $ionicGesture.on(domEventName, handler, $element);
          $scope.$on('$destroy', function() {
            $ionicGesture.off(gesture, domEventName, handler);
          });
        } else {
          $element.on(domEventName, handler);
          $scope.$on('$destroy', function() {
            $element.off(domEventName, handler);
          });
        }


        function handler(e) {
          var eventData = $scope.$eval($attr.ionTrackData) || {};
          if(eventName) {
            $ionicTrack.track(eventName, eventData);
          } else {
            $ionicTrack.trackClick(e.pageX, e.pageY, e.target, {
              data: eventData
              //scope: scopeClean(angular.element(e.target).scope())
            });
          }
        }
      }
    }
  }];
}
