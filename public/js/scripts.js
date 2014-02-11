var App = angular.module('App', ['ngRoute']);

App.config(function($sceProvider) {
  // Completely disable SCE.  For demonstration purposes only!
  // Do not use in new projects.
  $sceProvider.enabled(false);
});


App.controller('Root', function($scope, $http, $location) {
  var assetsIp = angular.element(document).find('head').find('base').attr('href');  // IP, where is client part
  $scope.assets = assetsIp;   // Styles and scropts
  $scope.server = 'http://192.168.0.69/index.php?ajax=true{data}&r=';   // Server
  $scope.views = assetsIp;    // Templates


  /* Config with navigation */
  $http.get($scope.assets + '/config.json').success(function(data) {
    $scope.config = data;
    $scope.layoutUrl = $scope.views + '/layout.html';
    $scope.auth('check');
  });


  /* Navigation */
  $scope.getPage = function(url, e) {
    var page, view;

    if (url) {
      $location.path(url);
    } else if ($location.path().replace(/^\//, '') == '') {
      $location.path('site/index');
    }

    page = $location.path().replace(/^\//, '');
    view = '/' + page.replace(/\&(.*)$/, '') + '.html';

    for (var i in $scope.config.nav) {
      $scope.config.nav[i].current = page == $scope.config.nav[i].url;
    }


    $http.get($scope.server.replace('{data}', '') + page).success(function(data, status) {
      if (data.redirect) {
        $scope.getPage(data.redirect);
      } else {
        $scope.data = data;
        $scope.templateUrl = $scope.views + view;
        if(data.Service) $scope.orderInit();
        //inputNumberValidate();
      }
    });

    if (e) e.preventDefault();
  }


  $scope.auth = function(action) {
    var page = $location.path().replace(/^\//, '');
    if (action == 'login') {
      $scope.submit = true;
      var data = '&LoginForm=' + angular.toJson($scope.loginForm);
      $http.get($scope.server.replace('{data}', data) + 'site/login').success(function(data, status) {
        $scope.submit = false;
        if (data.status == 'fail') {
          $scope.message = data;
        } else {
          $scope.auth('check');
        }
      });
    } else if(action == 'check') {
      $http.get($scope.server.replace('{data}', '') + 'site/checkLogin').success(function(data) {
        $scope.closeMessage();
        $scope.closePopup();

        if (data.user) {
          $scope.user = data.user;
          $scope.getPage();
        } else {
          $scope.loginForm = {};
          $scope.popup = 'login';
        }
      });
    } else if (action == 'logout') {
      $http.get($scope.server.replace('{data}', '') + 'site/logout').success(function(data) {
        $scope.user = false;
        $scope.loginForm = {};
        $scope.popup = 'login';
        $location.path('');
      });
    }
  }


  $scope.shift = function(action, id) {
    var page = $location.path().replace(/^\//, '');
    if (action == 'office') {
      var data = '&Shift=' + angular.toJson({id: id});
      $http.get($scope.server.replace('{data}', data) + page).success(function(data, status) {
        $scope.getPage();
      });
    } else if (action == 'open') {
      $scope.submit = true;
      var data = '&Goods=' + angular.toJson($scope.data.Goods) + '&Cash='+ angular.toJson($scope.data.Cash);
      $http.get($scope.server.replace('{data}', data) + page).success(function(data, status) {
        $scope.submit = false;
        if (data.status == 'fail') {
          $scope.message = data;
        } else {
          $scope.user.shift = true;
          $scope.getPage(data.redirect);
        }
      });
    } else if (action == 'update') {
      $scope.getPage('remain/update');
    } else if (action == 'close') {
      $scope.data.submit = true;
      var data = '&Goods=' + angular.toJson($scope.data.Goods) + '&Cash=' + angular.toJson($scope.data.Cash) + '&Shift=' + angular.toJson($scope.data.Shift);
      $http.get($scope.server.replace('{data}', data) + page).success(function(data, status) {
        $scope.data.submit = false;
        if (data.status == 'fail') {
          $scope.message = data;
        } else {
          $scope.user.shift = false;
          $scope.auth('logout');
        }
      });
    }
  }


  $scope.orderInit = function() {
    $scope.order = {
      service : {}
      ,total: 0
      ,pay_type: 0
      ,client: {
        client_id: ''
        ,fio: ''
        ,phone: ''
      }
    }
  }


  $scope.addToOrder = function(item) {
    if (!$scope.order.service[item.id]) {
      $scope.order.service[item.id] = item;
      $scope.order.service[item.id].count = 1;
    } else {
      $scope.order.service[item.id].count += 1;
    }
    $scope.order.total += item.price * 1;
  }


  $scope.removeFromOrder = function(item) {
    if (item == undefined) {
      $scope.order.service = {};
      $scope.order.total = 0;
    } else {
      $scope.order.total -= item.price * $scope.order.service[item.id].count;
      delete $scope.order.service[item.id];
    }
  }


  $scope.completeOrder = function() {
    var page = $location.path().replace(/^\//, '');
    var data = '&Service=' + angular.toJson($scope.order.service) + '&pay_type=' + $scope.order.pay_type + '&Client=' + angular.toJson($scope.order.client);
    $http.get($scope.server.replace('{data}', data) + page).success(function(data, status) {
      $scope.message = data;
      $scope.closePopup();
      $scope.order = false;
    });
  }


  $scope.searchClients = function(val, key) {
    $scope.unselectClient();
    if(val.length >= 2) {
      var data = '&term=' + val;
      $http.get($scope.server.replace('{data}', data) + 'client/autocomplete' + key).success(function(data, status) {
        $scope.searchClientsResult = data;
      });
    }
  }


  $scope.selectClient = function(client) {
    var data = '&id=' + client.id;
    $http.get($scope.server.replace('{data}', data) + 'client/auction').success(function(data, status) {
      for (var i in data.auction) {
        data.auction[i].bonus_ = data.auction[i].bonus * 1;
      }

      $scope.searchClientsResult = false;
      $scope.client = client;
      $scope.client.auction = data.auction;
      $scope.order.client.client_id = client.id;
    });
  }


  $scope.unselectClient = function() {
    if ($scope.client){
      $scope.client = false;
    }
    if ($scope.order && $scope.order.client.client_id){
      $scope.order.client.client_id = '';
    }
  }


  $scope.changeBonus = function(item, service, e) {
    var sum = e.target.value * item.price;
    if(sum > item.bonus_) {
      e.target.value = service.count;
    }
    else {
      service.count = e.target.value;
    }
    item.bonus_ = item.bonus - e.target.value * item.price;
  }


  $scope.getAuction = function() {
    var data = '&Client=' + angular.toJson($scope.order.client) + '&Auction=' + angular.toJson($scope.client.auction);
    $http.get($scope.server.replace('{data}', data) + 'order/auction').success(function(data, status) {
      if (data.status == 'fail') {
        $scope.message = data;
      }
    });
  }


  $scope.getPopup = function(popup) {
    $scope.popup = popup;
  }


  $scope.closePopup = function() {
    $scope.popup = false;
  }


  $scope.closeMessage = function() {
    $scope.message = false;
  }


  $scope.getDate = function() {
    var months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    var date = new Date();
    $scope.date = {
      day: date.getDate()
      ,month: months[date.getMonth()]
      ,year: date.getFullYear()
      ,hours: date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
      ,minutes: date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    }
    $scope.$apply();
    setTimeout($scope.getDate, 1000);
  }
  setTimeout($scope.getDate, 1);
});



var addEvent = function(elem, type, handler) {
  if (elem.addEventListener) {
    elem.addEventListener(type, handler, false);
  }
  else {
    elem.attachEvent('on' + type, handler);
  }
}


var inputNumberValidate = function() {
  var inputs = document.querySelectorAll('input[type="number"]');
  for (var i = 0; i < inputs.length; i++) {
    addEvent(inputs[i], 'mousedown', function(e) {
      e = e || window.event;
      return false;
    });
  }
}