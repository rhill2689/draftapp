import angular from 'angular';
import angularMeteor from 'angular-meteor';
import ngRoute from 'angular-route';
import 'bootstrap/dist/css/bootstrap.css';
import 'ng-dialog/css/ngDialog.css';
import 'ng-dialog/css/ngDialog-theme-plain.css';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import uiBootstrap from 'angular-ui-bootstrap';
import ngDialog from 'ng-dialog';
import { Tracker } from 'meteor/tracker';

//subscribe to all collections
Meteor.subscribe('users');
Meteor.subscribe('draft');
Meteor.subscribe('draftTracker');

//configure the application with dependencies, will be loaded when app loads
//Cannot change the name of the duckdrawapp meteor must be setting it somewhere
var app=angular.module('draftapp',[angularMeteor, ngRoute, uiBootstrap, ngDialog]);

/* run function, gets called everywhere on the site */
app.run(function($rootScope, $location, ngDialog){

    //configure the back button if needed
    var history = [];
    $rootScope.$on('$locationChangeSuccess', function(){
        history.push($location.$$path);

    });
    //if they have not logged in send them to login page
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        var loggedIn = sessionStorage.getItem('loggedIn');
        if(loggedIn == false || loggedIn == null || loggedIn =='false'){
            $location.path('login');
        }
    });

    $rootScope.back=function(){
        var prevUrl = history.length > 1 ? history.splice(-2)[0] : '/home';
        $location.path(prevUrl);
    };
    $rootScope.showDialog=function(text, scope){
        ngDialog.open({
            className:'ngdialog-theme-plain',
            template: '<div class="dialog-padding"><span>'+ text +'</span></div>',
            scope:scope,
            plain:true,
            closeByEscape:true,
            closeByDocument:true
        });
    };
});

//Configure the routes
app.config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl:'client/login.html',
        controller:'logincontroller'
    }).
    when('/login', {
        templateUrl:'client/login.html',
        controller:'logincontroller'
    }).
    when('/home', {
        templateUrl:'client/home.html'
    //    controller:'homecontroller'
    }).
    when('/admin', {
        templateUrl:'client/admin.html',
        controller:'admincontroller'
    }).
    when('/useroptions', {
        templateUrl:'client/useroptions.html',
        controller:'useroptionscontroller'
    }).
    when('/reports', {
        templateUrl:'client/reports.html',
        controller:'reportscontroller'
    }).
     otherwise({redirectTo:'/'});
});

//configure directives
app.directive('header', function () {
   return{
       restrict: 'A',
       replace: true,
       link : function(scope){
           //scope.onLogout= function(){
           //    alert("log out");
           //}
       },
       controller : function($scope, $location, $meteor){
           $scope.onLogout= function () {
               Meteor.logout();
               sessionStorage.setItem('loggedIn', false);
               $location.path('/login');
           };

           $scope.adminStatus ={};
           if(sessionStorage.getItem('isAdmin')==='true'){
               $scope.adminStatus.isAdmin = true;
           }
           else{
               $scope.adminStatus.isAdmin = false;
           }
           //console.log('isAdmin', $scope.adminStatus.isAdmin);

       },
       templateUrl: function(elem, attr){
           return 'client/header.html';
       }
   }
});

app.directive('loading', function ($http) {
    return {
        restrict: 'A',
        link: function (scope, elm, attrs) {
            scope.isLoading = function () {
                return $http.pendingRequests.length > 0;
            };

            scope.$watch(scope.isLoading, function (v) {
                if (v) {
                    elm.show();
                } else {
                    elm.hide();
                }
            });
        }
    };
});

//Controllers, figure out how to move them at some point
app.controller('logincontroller', function ($scope, $location, $rootScope) {
    'ngInject';

    $scope.rememberMeData={};
    $scope.agreeTerms = {};

    if(localStorage.rememberme){
        var obj = JSON.parse(localStorage.rememberme);
        if(obj.chkbx){

            $scope.email= obj.email;
            $scope.rememberMeData.chkbx = obj.chkbx;
        }
        else{
            $scope.email="";
            $scope.rememberMeData.chkbx=false;
        };

    }
    else{
        $scope.email="";
        $scope.rememberMeData.chkbx=false;

    };
    //$scope.password="";

    $scope.onLogin=function(){
        Meteor.loginWithPassword($scope.email, $scope.password, function(error){
            Meteor.logoutOtherClients(function(error){
                if(error){
                    console.log(error);
                }
            });
            if(Meteor.user()){
                sessionStorage.setItem('loggedIn', true);
                if(Meteor.user().profile.isAdmin){
                    sessionStorage.setItem('isAdmin', true);
                }
                else{
                    sessionStorage.setItem('isAdmin', false);
                };
                if($scope.rememberMeData.chkbx){
                    $scope.rememberMeData.email=$scope.email;
                    //$scope.rememberMeData.chkbx = true;
                    localStorage.setItem('rememberme', JSON.stringify($scope.rememberMeData));
                }
                else{
                    $scope.rememberMeData.email="";
                    $scope.rememberMeData.chkbx=false;
                    localStorage.setItem('rememberme', JSON.stringify($scope.rememberMeData));
                }
                $location.path('/home');
            }
            else{
                $rootScope.showDialog("Invalid login", $scope);
                sessionStorage.setItem('loggedIn', false);
                console.log(error.reason);
                $scope.password="";
            }
        });
    };

    $scope.forgotPassword = function(){
        $rootScope.showDialog("Functionality not available yet, please contact the web master to reset your password", $scope);
    }

});

app.controller('homecontroller', function ($scope, $timeout, $reactive, $rootScope) {
    'ngInject';

    $reactive(this).attach($scope);

    //init $scope vars
    this.blindSelected;
    this.isBlindPicked;
    if(sessionStorage.getItem("isBlindPicked")){
        if(sessionStorage.getItem("isBlindPicked")=="true"){
            this.isBlindPicked = true;
        }
        else{
            this.isBlindPicked = false;
        }
    }
    else{
        this.isBlindPicked = false;
    }

    this.isBlindPicked;
    //current logged in user
    this.helpers({
        current: () => Meteor.user()
    });

    //all users
    this.helpers({
        Users(){
            return Meteor.users.find({});
        }
    });

    this.helpers({
        draft: () => Draft.findOne({status: { '$in': ['active', 'open']}})
    });

    this.helpers({
        tracker: () => DraftTracker.findOne({draft_id: this.getReactively('draft._id')})
    });

    this.timeLeft = function() {
        return this.mmss(this.getReactively('tracker.timeLeft'));
    };

    this.mmss = function(secs) {
        function pad(num) {
            return ("0"+num).slice(-2);
        }
        var minutes = Math.floor(secs / 60);
        secs = secs%60;
        return pad(minutes)+":"+pad(secs);
    };

    //start draft build initial reservations collection with users and their pick order
    this.startDraft = function () {
        Meteor.call("startDraft", {}, function(error, draft) {
           // console.log('started draft: ', draft);
        });
    };

    this.endDraft = function(){
        Meteor.call('endDraft', this.draft._id);
        this.isBlindPicked = false;
        sessionStorage.setItem("isBlindPicked",false);
    };

    this.selectBlind = function () {
        if(!this.blindSelected){
            $rootScope.showDialog("Please select a pick from the drop down menu", $scope);
            return;
        }
        Meteor.call("pick", this.draft._id, this.blindSelected, function(error, draft) {
            //console.log('Pick submitted', this.draft.selections);
            this.isBlindPicked = true;
            sessionStorage.setItem("isBlindPicked",true);

        }.bind(this));
    };

    this.releaseBlind = function (){
        Meteor.call("release", this.draft._id, function(error, draft){
            this.isBlindPicked = false;
            sessionStorage.setItem("isBlindPicked",false);
        }.bind(this))
    };
});

app.controller('admincontroller', function ($scope, $location, $rootScope) {
    'ngInject';
    Meteor.subscribe('users');
    //Meteor.subscribe('userData');

    $scope.userFound=false;
    $scope.userFoundDelete=false;
    $scope.search = {email:""};


    function initUser(){
        $scope.modifyuser={
            _id:"",
            emails:[],
            profile:{
                name:""
            },
            password:""
        };
    };

    initUser();

    function initNewUser(){
        $scope.newUser = {
            "username":"",
            "emails":[],
            "profile":{
                "name":"",
                "isAdmin":false,
                "isMember":true
            }
        };
    }

    initNewUser();

    $scope.onAddUser=function(){
        Accounts.createUser($scope.newUser, function(error){
            if(error){
                console.log(error);
                $rootScope.showDialog("Error creating User", $scope);
            }
            else{
                $rootScope.showDialog("New User Created", $scope);
                initNewUser();
            }
        });
    };
    $scope.onTab=function(){

    };
    $scope.onLookUpUser=function(){
       $scope.modifyuser =  Meteor.users.findOne({"emails.address":$scope.search.email});

        if($scope.modifyuser){

            $scope.userFound=true;
        }
        else{
            $rootScope.showDialog("Error finding User", $scope);
        }
    };

    $scope.onModifyUser= function () {
        if(!$scope.modifyuser.password){
            $scope.modifyuser.password="";
        }
        Meteor.call('userUpdate',$scope.modifyuser._id, $scope.modifyuser);
        $rootScope.showDialog("User updated", $scope);
        initUser();
    };

    $scope.onDeleteUser = function () {
        Meteor.call('userRemove',$scope.modifyuser._id, $scope.modifyuser);
        $rootScope.showDialog("User deleted", $scope);
        initUser();
    };

    //all users
    $scope.helpers({
        Users(){
            return Meteor.users.find({});
        }
    });

    $scope.clearData = function(){
        Meteor.call('clearAllDraftData');
    }

});
app.controller('useroptionscontroller',function($scope, $location){
    'ngInject';
    Meteor.subscribe('users');

    $scope.helpers({
        current(){
            return Meteor.user();
        }
    });

    $scope.updateUser = function(){
        var update = $scope.current;
        var currentId = $scope.current._id;
        Meteor.call('userUpdate',currentId, update);
        $location.path('/home');
    }


});
app.controller('reportscontroller',function($scope, $location){
    'ngInject';
    Meteor.subscribe('reports');

    $scope.helpers({
        reports(){
            return Reports.find({}, {sort: {"draftDate":-1}});
        }
    });

    //console.log('reports', $scope.reports);

});




