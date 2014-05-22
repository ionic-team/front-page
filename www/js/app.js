// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('frontpage', ['ionic', 'frontpage.controllers', 'frontpage.services'])

.run(function($ionicPlatform, $collectionRepeatManager) {
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
  });
})

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  // Listen to all successful requests, so we can cache some queries
  $httpProvider.interceptors.push('cacheInterceptor');

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
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:
    // Font page and Newest are nearly identical and could probably share a template and possibly even a controller
    // It's reasonable to expect they'll diverge as the app matures though, so we'll keep them separate
    // Check the comments page to see an example of how to reuse a template/controller
    .state('tab.front-page', {
      url: '/front-page',
      views: {
        'tab-front-page': {
          templateUrl: 'templates/tab-front-page.html',
          controller: 'FrontPageCtrl'
        }
      }
    })

    .state('tab.newest', {
      url: '/newest',
      views: {
        'tab-newest': {
          templateUrl: 'templates/tab-newest.html',
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
// a basic HTTP interceptor that passes each successful response through the 'response' method
.factory('cacheInterceptor', function($q, RequestCache) {
  // keep this light, it runs before any request is returned, avoid async here
  return {
    // catch successful requests and send them to the RequestCache service
    'response': function(response) {
      RequestCache.entry(response);
      return response || $q.when(response);
    }
  }
})
// custom directive to bind to hold events and trigger the sharing plugin
// expects the parent scope to contain a post item from the HNAPI service
.directive('fpShare', function($ionicGesture) {
  return {
    restrict :  'A',
    link : function(scope, elem, attrs) {
      $ionicGesture.on('hold', function(){
        if(typeof window.plugins === 'undefined' || typeof window.plugins.socialsharing === 'undefined'){
          console.error("Social Sharing Cordova Plugin not found. Disregard if on a desktop browser.");
          return;
        }
        window.plugins
              .socialsharing
              .share(scope.$parent.post.title+' - Via FrontPage the Ionic Framework Hacker News App',
                     null,
                     null,
                     scope.$parent.post.url)
      }, elem);
    }
  }
});