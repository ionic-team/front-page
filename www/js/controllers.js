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
      console.log($scope.posts);
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
      console.log($scope.posts);
    });
  }
})

.controller('PostDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('SearchCtrl', function($scope, HNAPI) {
  $scope.searchTerm = '';
  $scope.posts = [];
  $scope.search = function(searchTerm){
    HNAPI.search(searchTerm).then(function(searchResults){
      $scope.posts = searchResults;
    });
  };
  $scope.open = function(url){
    window.open(url,'_system');
  }
})
;
