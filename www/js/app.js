// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('frontpage', ['ionic', 'frontpage.controllers', 'frontpage.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
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
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:

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
.factory('cacheInterceptor', function($q, RequestCache) {
  // keep this light, it runs before any request is returned, avoid async here
  return {
    // catch successful requests and send them to the RequestCache service
    'response': function(response) {
      RequestCache.entry(response);
      return response || $q.when(response);
    }
  }
});