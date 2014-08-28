angular.module('frontpage.controllers', [])

.controller('FrontPageCtrl', function($scope, HNAPI, RequestCache, $state) {


  $scope.pageName = 'Front Page';
  $scope.posts = RequestCache.get('frontpage/1');
  var currentPage = 1;
  $scope.refresh = function(){
    // refresh the list with a new API call
    HNAPI.frontpage(1).then(function(posts){
      if(!angular.equals($scope.posts, posts))$scope.posts = posts;
      currentPage = 1;
      $scope.$broadcast('scroll.refreshComplete');
    });
  };
  $scope.refresh();
  $scope.open = function(url){
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
  $scope.loadMoreData = function(){
    currentPage++;
    console.log('loading page '+currentPage);
    HNAPI.frontpage(currentPage).then(function(posts){
      $scope.posts = $scope.posts.concat(posts);
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.error = false;
    }, function(){$scope.error = true;});
  };
  $scope.loadComments = function(storyID){
    $state.go('tab.front-page-comments',{storyID:storyID});
  }
})

.controller('NewestCtrl', function($scope, HNAPI, RequestCache, $state) {
  $scope.pageName = 'Newest';
  $scope.posts = RequestCache.get('new/1');
  var currentPage = 1;
  $scope.refresh = function(){
    HNAPI.newest(1).then(function(posts){
      if(!angular.equals($scope.posts, posts))$scope.posts = posts;
      currentPage = 1;
      $scope.$broadcast('scroll.refreshComplete');
    }, function(){$scope.error = true;});
  };
  $scope.refresh();
  $scope.open = function(url){
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
  $scope.loadMoreData = function(){
    currentPage++;
    console.log('loading page '+currentPage);
    HNAPI.newest(currentPage).then(function(posts){
      $scope.posts = $scope.posts.concat(posts);
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.error = false;
    },function(){$scope.error = true;});
  };
  $scope.loadComments = function(storyID){
    $state.go('tab.newest-comments',{storyID:storyID});
  }
})

.controller('CommentsCtrl', function($scope, HNAPI, $stateParams, $sce, $timeout) {
  // requests take time, so we do a few things to keep things smooth.
  // we don't load comments until the page animation is over.
  // if after the page animation, the comments are still not available, we show a loading screen
  var commentsStaging = [];
  $scope.animating = true;
  $scope.loading = true;
  HNAPI.comments($stateParams.storyID).then(function(comments){
    $scope.loading = false;
    commentsStaging = comments;
    if(!$scope.animating){
      $scope.comments = commentsStaging;
    }
  },$scope.requestFail);

  $timeout(function(){
    $scope.animating = false;
    $scope.comments = commentsStaging;
  },333);

  $timeout(function(){
    console.log(commentsStaging.length);
    if(commentsStaging.length < 1)$scope.requestFail();
  }, 10000);

  $scope.requestFail = function(){
    console.log('request failed');
    commentsStaging = [];
    $scope.comments = [];
    $scope.requestFailed = true;
    if($scope.loading === false)return;
    $scope.loading = false;
  };
  $scope.trust = function(comment){
    return $sce.trustAsHtml(comment);
  };
  $scope.bubbleCheck = function(e){
    if(e.toElement.tagName == "A"){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
})

.controller('SearchCtrl', function($scope, HNAPI, $ionicLoading, $state) {
  $scope.focused= 'centered';
  $scope.searchTerm = '';
  $scope.posts = [];
  console.log(localStorage.searchCache);
  if(typeof localStorage.searchCache != 'undefined'){
    var sc = JSON.parse(localStorage.searchCache);
    $scope.searchTerm = sc.term;
    $scope.posts = sc.results;
    $scope.focused = 'left';
  }
  $scope.search = function(searchTerm){
    if(searchTerm === '')return;
    $ionicLoading.show({
      template: 'Searching...'
    });
    document.getElementById('searchInput').blur();
    HNAPI.search(searchTerm).then(function(searchResults){
      $scope.posts = searchResults;
      localStorage.searchCache = JSON.stringify({term:searchTerm,results:searchResults});
      $ionicLoading.hide();
      $scope.error = false;
    },function(){
      $scope.posts = [];
      $ionicLoading.hide();
      $scope.error = true;
    });
  };
  $scope.open = function(url){
    // open the page in the inAppBrowser plugin. Falls back to a blank page if the plugin isn't installed
    var params = 'location=no,' +
      'enableViewportScale=yes,' +
      'toolbarposition=top,' +
      'transitionstyle=crossdissolve,' +
      'closebuttoncaption=Done';
    var iab = window.open(url,'_blank',params);
    // cordova tends to keep these in memory after they're gone so we'll help it forget
    iab.addEventListener('exit', function() {
      iab.removeEventListener('exit', argument.callee);
      iab.close();
      iab = null;
    });
  };
  $scope.clear = function(){
    $scope.posts = [];
    $scope.searchTerm = '';
    $scope.focused = 'centered';
    document.getElementById('searchInput').blur();
    delete localStorage.searchCache;
  };
  $scope.loadComments = function(storyID){
    $state.go('tab.search-comments',{storyID:storyID});
  }
})
;
