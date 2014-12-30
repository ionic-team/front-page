// Ionic FrontPage App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'frontpage' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
// 'frontpage.services' is found in services.js
angular.module('frontpage', [
  'ngAnimate',
  'ionic',
  'frontpage.controllers',
  'frontpage.services',
  'frontpage.directives',
  'ionic.services.analytics',
  'ionic.services.update',
  'cfp.loadingBar'
])

.run(function($ionicPlatform, $http, $ionicTrack, $ionicUpdate) {
//.run(function($ionicPlatform, $templateCache, $http) {
  $ionicPlatform.ready(function() {
    // for ios7 style header bars
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    // hide the prev/next buttons on the keyboard input
    if(window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard){
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    // hide the splash screen only after everything's ready (avoid flicker)
    // requires keyboard plugin and confix.xml entry telling the splash screen to stay until explicitly told
    if(navigator.splashscreen){
      navigator.splashscreen.hide();
    }

    $ionicUpdate.initialize(ionic.Config.app_id);
    $ionicUpdate.check().then(function(response) {
      console.log('got a response', response);
      // response will be true/false
      if (response) {
         // Download the updates
        console.log('downloading updates');
        $ionicUpdate.download().then(function() {
          // Extract the updates
          console.log('extracting updates');
          $ionicUpdate.extract().then(function() {
            console.log('update extracted, loading');
            // Load the updated version
            $ionicUpdate.load();
          }, function(error) {
            console.log('error extracting');
             // Error extracting
          }, function(progress) {
            // Do something with the zip extraction progress
            console.log('extraction progress',progress);
          });
        }, function(error) {
          console.log('error downloading');
          // Error downloading the updates
        }, function(progress) {
          // Do something with the download progress
          console.log('progress downloading',progress);
        });
      } else {
        // No updates, load the most up to date version of the app
        console.log('no update, loading');
        $ionicUpdate.load();
      }
     }, function(error) {
      console.log('error checking for update');
      // Error checking for updates
     })
  });
})
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }])
.config(function($stateProvider, $urlRouterProvider, $ionicAppProvider, $compileProvider) {
  try{
    $ionicAppProvider.identify({
      "app_id": ionic.Config.app_id,
      "api_write_key": ionic.Config.api_write_key
    });
  } catch(e) {
    console.error('ionic.Config not set. Make sure config.js is loaded', e)
  }

  $compileProvider.debugInfoEnabled(false);

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // setup an abstract state for the tabs directive
    // the tab state isn't an actual page we navigate to, but a necessary state for ionic tabs
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: function() {
        if (ionic.Platform.isAndroid()) {
          return "templates/tabs-android.html";
        }
        return "templates/tabs.html";
      }
    })

    // Each tab has its own nav history stack:
    // Font page and Newest are nearly identical and could probably share a template and possibly even a controller
    // It's reasonable to expect they'll diverge as the app matures though, so we'll keep them separate
    // Check the comments page to see an example of how to reuse a template/controller
    .state('tab.front-page', {
      url: '/front-page',
      views: {
        'tab-front-page': {
          templateUrl: 'templates/tab-feed.html',
          controller: 'FrontPageCtrl'
        }
      }
    })

    .state('tab.newest', {
      url: '/newest',
      views: {
        'tab-newest': {
          templateUrl: 'templates/tab-feed.html',
          controller: 'NewestCtrl'
        }
      }
    })
    .state('tab.search', {
        url: '/search',
        views: {
            'tab-search': {
                templateUrl: 'templates/tab-search.html',
                controller: 'SearchCtrl'
            }
        }
    })
    // the comments pages are identical but we'd like to have each tab have their own,
    // so we'll just reuse the controller and template for each one
    .state('tab.front-page-comments', {
      url: '/front-page/comments/:storyID',
      views: {
        'tab-front-page': {
          templateUrl: 'templates/tab-comments.html',
          controller: 'CommentsCtrl'
        }
      }
    })
    .state('tab.newest-comments', {
      url: '/newest/comments/:storyID',
      views: {
        'tab-newest': {
          templateUrl: 'templates/tab-comments.html',
          controller: 'CommentsCtrl'
        }
      }
    })
    .state('tab.search-comments', {
      url: '/search/comments/:storyID',
      views: {
        'tab-search': {
          templateUrl: 'templates/tab-comments.html',
          controller: 'CommentsCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/front-page');

})

.filter('timeAgo', function (){
  var cache = [];
  return function(date) {
    if(typeof cache[date] === 'string')return cache[date];
    var prettyDate = moment(date, 'X').fromNow();
    cache[date] = prettyDate;
    return prettyDate;
  }
})

;