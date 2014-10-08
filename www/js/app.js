// Ionic FrontPage App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'frontpage' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
// 'frontpage.services' is found in services.js
angular.module('frontpage', ['ngAnimate', 'ionic', 'frontpage.controllers', 'frontpage.services', 'frontpage.directives',
//                             'ionic.services.analytics', 'ionic.services.update'
])

//.run(function($ionicPlatform, $templateCache, $http, $ionicTrack, $ionicUpdate) {
.run(function($ionicPlatform, $templateCache, $http) {
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

    // Lastly, we pre-load templates so page transitions are sexy-smooth
    var templates = [
      "tab-feed",
      "tab-search",
      "tab-comments"
    ];
    templates.forEach(function(tpl){
      $http.get('templates/'+tpl+'.html', { cache: $templateCache });
    });

    //$ionicTrack.identify({
    //  user_id: '99',
    //  name: 'Perry Govier',
    //  email: 'perry@drifty.com'
    //});

    //$ionicUpdate.initialize('8cdd99a2')
    //$ionicUpdate.check().then(function(somevar){
    //  alert(somevar)
    //}, function(error){
    //  alert(error);
    //})
  });
})

//.config(function($stateProvider, $urlRouterProvider, $httpProvider, $ionicAppProvider) {
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  // Listen to all successful requests, so we can cache some queries
  $httpProvider.interceptors.push('cacheInterceptor');

  // register app with analytics
  //$ionicAppProvider.identify({
  //  app_id: 'b661da31',
  //  write_key: 'd4ddb1d982c3ce52a16a230383d1e7c080f96fe9ba89704e55676c30ebaeb5be693a6c08d0141b2bae93c9cd6c5e7c1cdeb558d64626ad1a33bf554edd8289c6e7e7711233a7901ee91d584c92e15e0f55d1fdb16fa95aefe8e44bfee38e1ee186ccec1d3b159d68869557d15b9e5e8789c7cc16016073a1e7557d80b725c466a69a98615af958a5c1474e7937d914a0'
  //});

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
;