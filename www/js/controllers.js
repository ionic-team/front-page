angular.module('frontpage.controllers', [])

.controller('FrontPageCtrl', function($scope, HNAPI, RequestCache) {
  $scope.posts = RequestCache.get('frontpage/0');
  var currentPage = 0;
  HNAPI.frontpage(0).then(function(posts){
    $scope.posts = posts;
  });
  $scope.open = function(url){
    window.open(url,'_system');
  }
  $scope.loadMoreData = function(){
    currentPage++;
    console.log('loading page '+currentPage);
    HNAPI.frontpage(currentPage).then(function(posts){
      $scope.posts = $scope.posts.concat(posts);
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  }
})

.controller('NewestCtrl', function($scope, HNAPI, RequestCache) {
  $scope.posts = RequestCache.get('frontpage/0');
  var currentPage = 0;
  HNAPI.newest(0).then(function(posts){
    $scope.posts = posts;
  });
  $scope.open = function(url){
    window.open(url,'_system');
  }
  $scope.loadMoreData = function(){
    currentPage++;
    console.log('loading page '+currentPage);
    HNAPI.newest(currentPage).then(function(posts){
      $scope.posts = $scope.posts.concat(posts);
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  }
})

.controller('CommentsCtrl', function($scope, HNAPI, $stateParams, $ionicLoading) {
  $ionicLoading.show({
    template: 'Loading...'
  });
  HNAPI.comments($stateParams.storyID).then(function(comments){
    $scope.comments = comments;
    $ionicLoading.hide();
  });
})

.controller('SearchCtrl', function($scope, HNAPI, $ionicLoading) {
  $scope.focused= 'text-center'
  $scope.searchTerm = '';
  $scope.posts = [];
  $scope.search = function(searchTerm){
    $ionicLoading.show({
      template: 'Searching...'
    });
    HNAPI.search(searchTerm).then(function(searchResults){
      $scope.posts = searchResults;
      $ionicLoading.hide();
    });
  };
  $scope.open = function(url){
    window.open(url,'_system');
  }
  $scope.clear = function(){
    $scope.posts = [];
    $scope.searchTerm = '';
    $scope.focused = 'text-center';
    document.getElementById('searchInput').blur();
  }
})
;
