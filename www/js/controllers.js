angular.module('frontpage.controllers', ['ionic.services.analytics'])

.controller('MainCtrl', function($scope, $ionicTrack, cfpLoadingBar, $window){
  $scope.open = function(url){
    // Send event to analytics service
    $ionicTrack.track('open', {
      url: url
    });

    // open the page in the inAppBrowser plugin. Falls back to a blank page if the plugin isn't installed
    var params = 'location=no,' +
      'enableViewportScale=yes,' +
      'toolbarposition=top,' +
      'closebuttoncaption=Done';
    var iab = window.open(url,'_blank',params);
    // cordova tends to keep these in memory after they're gone so we'll help it forget
    iab.addEventListener('exit', function() {
      iab.removeEventListener('exit', argument.callee);
      iab.close();
      iab = null;
    });
  };
  //make sure we always clear any existing loading bars before navigation
  $scope.$on('$ionicView.beforeLeave', function(){
    cfpLoadingBar.complete();
  });

  var halfHeight = null
  $scope.getHalfHeight = function(){
    if(ionic.Platform.isAndroid()) return 0;
    if(!halfHeight){
      halfHeight = (document.documentElement.clientHeight/2) - 200;
    }
    return halfHeight;
  }
})

.controller('FrontPageCtrl', function($scope, HNFirebase, $state, cfpLoadingBar, $timeout, $ionicScrollDelegate) {
  $scope.pageName = 'Frontpage';
  cfpLoadingBar.start();
  HNFirebase.fetchTopStories();
  // just kicking the tires
  $scope.$on('$ionicView.afterEnter', function(){
    $timeout(function(){
      $scope.posts = HNFirebase.getTopStories();
      $ionicScrollDelegate.resize();
    },100);
  });

  $scope.$on('HNFirebase.topStoriesUpdated',function(){
    $scope.posts = HNFirebase.getTopStories();
  });

  $scope.$watch(function() {
    return HNFirebase.getTopStoriesPercentLoaded() ;
  }, function(percentComplete){
    if(percentComplete >= 1){
      $scope.$broadcast('scroll.refreshComplete');
      cfpLoadingBar.complete();
    }else{
      cfpLoadingBar.set(percentComplete);
    }
  });

  $timeout(function(){
    if($scope.posts.length < 1){
      cfpLoadingBar.complete();
      $scope.timesUp = true;
    }
  },5000);

  $scope.loadComments = function(storyID, commentNum, $event){
    $event.stopPropagation();
    if(commentNum) $state.go('tab.front-page-comments',{storyID:storyID});
  };
})

.controller('NewestCtrl', function($scope, HNFirebase, $state, cfpLoadingBar, $timeout, $ionicScrollDelegate) {
  // This is nearly identical to FrontPageCtrl and should be refactored so the pages share a controller,
  // but the purpose of this app is to be an example to people getting started with angular and ionic.
  // Therefore we err on repeating logic and being verbose
  $scope.pageName = 'Newest';
  cfpLoadingBar.start();
  HNFirebase.fetchNewStories();
  // just kicking the tires
  $scope.$on('$ionicView.afterEnter', function(){
    $timeout(function(){
      $scope.posts = HNFirebase.getNewStories();
      $ionicScrollDelegate.resize();
    },100);
  });

  $scope.$on('HNFirebase.newStoriesUpdated',function(){
    $scope.posts = HNFirebase.getNewStories();
  });

  $scope.loadMore = function(){
    cfpLoadingBar.start();
    HNFirebase.increaseNewStoriesCount(15);
  };

  // update the loading bar
  $scope.$watch(function($scope) {
    return HNFirebase.getNewStoriesPercentLoaded();
  }, function(percentComplete){
    if(percentComplete >= 1) {
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.$broadcast('scroll.refreshComplete');
      cfpLoadingBar.complete();
    }else{
      //cfpLoadingBar.set(HNFirebase.getNewStoriesPercentLoaded());
    }
  });

  $timeout(function(){
    if($scope.posts.length < 1){
      cfpLoadingBar.complete();
      $scope.timesUp = true;
    }
  },5000);

  $scope.loadComments = function(storyID, commentNum, $event){
    $event.stopPropagation();
    if(commentNum) $state.go('tab.front-page-comments',{storyID:storyID});
  };
})

.controller('CommentsCtrl', function($scope, HNFirebase, $stateParams, $sce, $timeout) {
  // requests take time, so we do a few things to keep things smooth.
  // we don't load comments until the page animation is over.
  // if after the page animation, the comments are still not available, we show a loading screen
  $scope.$on('$ionicView.beforeEnter', function(){
    HNFirebase.fetchComments($stateParams.storyID);
    $timeout(function(){$scope.timesUp = true},10000);
    $scope.delay = true;
    $scope.starting = true;

  });
  $scope.$on('$ionicView.afterEnter', function(){
    $timeout(function(){$scope.starting = false},0);
  })
  $scope.$on('HNFirebase.commentsUpdated', function(){
  //$timeout(function(){
    $scope.percentLoaded = HNFirebase.getCommentsPercentLoaded();
    $scope.comments = HNFirebase.getComments();
    $timeout(function(){
      if($scope.comments.length && $scope.delay)$scope.delay = false
    },1500)

  });
  $scope.$on('$ionicView.afterLeave', function(){
    $scope.timesUp = false;
    //cleanup so simplify returning
    $scope.comments = [];
    $scope.delay = true;
  });

  $scope.trust = function(comment){
    return '<p>'+$sce.trustAsHtml(comment);
  };
  $scope.bubbleCheck = function(e){
    if(e.toElement.tagName == "A"){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
})

.controller('SearchCtrl', function($scope, Algolia, $state, $timeout) {
  $scope.focused= 'centered';
  $scope.searchTerm = '';
  $scope.posts = [];
  $scope.$on('$ionicView.beforeEnter', function(){
    $scope.starting = true;
    $scope.searching = false;
    $timeout(function(){$scope.starting = false},500)
  });
  if(typeof localStorage.searchCache != 'undefined'){
    var sc = JSON.parse(localStorage.searchCache);
    $scope.searchTerm = sc.term;
    $scope.posts = sc.results;
    $scope.focused = 'left';
  }
  $scope.search = function(searchTerm){
    if(searchTerm === '')return;
    $scope.posts = [];
    $scope.searching = true;
    document.getElementById('searchInput').blur();
    Algolia.search(searchTerm).then(function(searchResults){
      $timeout(function(){$scope.posts = searchResults.hits;},500);
      localStorage.searchCache = JSON.stringify({term:searchTerm,results:searchResults.hits});
      $scope.searching = false;
      $scope.error = false;
    },function(){
      $scope.posts = [];
      $scope.searching = false;
      $scope.error = true;
    });
  };
  $scope.$on('fpSearchBar.clear', function(){
    $scope.posts = [];
    $scope.searchTerm = '';
    delete localStorage.searchCache;
  });
  $scope.loadComments = function(storyID){
    $state.go('tab.search-comments',{storyID:storyID});
  }
});