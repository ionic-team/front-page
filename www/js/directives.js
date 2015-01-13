/**
 * Created by perry on 7/31/14.
 */

angular.module('frontpage.directives', [])
.directive('fpSearchBar', function($rootScope, $timeout) {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    scope: {
      searchModel: '=?',
      focused: '=?',
      submit: '&'
    },
    template:function(){
      if(ionic.Platform.isAndroid()){
        return '<form class="bar bar-header bar-energized item-input-inset" ng-submit="submit()">' +
          '<div class="item-input-wrapper light-bg" ng-class="alignment" ng-click="focus()">' +
          '<i class="icon ion-android-search placeholder-icon"></i>' +
          '<input type="search"' +
          'id="searchInput"' +
          'placeholder="Search HN"' +
          'ng-model="searchModel"' +
          'ng-focus="alignment = \'text-left\'"' +
          'ng-blur="alignment = searchModel.length?\'left\':\'centered\'">' +
          '</div>' +
          '<i class="icon ion-ios7-close dark" ng-show="searchModel.length" ng-click="clear()"></i>' +
          '</form>'
      }
      return '<form class="bar bar-header bar-energized item-input-inset" ng-submit="submit()">' +
        '<div class="item-input-wrapper energized-bg" ng-class="alignment" ng-click="focus()">' +
        '<i class="icon ion-ios7-search placeholder-icon"></i>' +
        '<input type="search"' +
        'id="searchInput"' +
        'placeholder="Search"' +
        'ng-model="searchModel"' +
        'ng-focus="alignment = \'left\'"' +
        'ng-blur="alignment = searchModel.length?\'left\':\'centered\'">' +
        '</div>' +
        '<i class="icon ion-ios7-close dark ng-hide" ng-show="searchModel.length" ng-click="clear()"></i>' +
        '</form>'
    },
    link: function(scope, elem){
      var input = elem[0].querySelector('#searchInput');
      scope.focus = function(){
        input.focus()
        $timeout(function(){input.focus()},200);

      };
      scope.alignment = scope.searchModel.length? 'left':'centered';
      // grab the cached search term when the user re-enters the page
      $rootScope.$on('$ionicView.beforeEnter', function(){
        if(typeof localStorage.searchCache != 'undefined') {
          var sc = JSON.parse(localStorage.searchCache);
          scope.searchModel = sc.term;
        }
      });
      scope.clear = function(){
        scope.searchModel = '';
        scope.alignment = 'centered';
        input.blur();

        scope.$emit('fpSearchBar.clear');
      };
    }
  };
})
// custom directive to bind to hold events and trigger the sharing plugin
// expects the parent scope to contain a post item from the HNAPI service
.directive('fpShare', function($ionicGesture) {
  return {
    restrict :  'A',
    link : function(scope, elem) {
      $ionicGesture.on('hold',share , elem);

      function share(){
        if(typeof window.plugins === 'undefined' || typeof window.plugins.socialsharing === 'undefined'){
          console.error("Social Sharing Cordova Plugin not found. Disregard if on a desktop browser.");
          return;
        }
        window.plugins
          .socialsharing
          .share(
            scope.$parent.post.title,
            null,
            null,
            scope.$parent.post.url
          )
      }
    }
  }
});