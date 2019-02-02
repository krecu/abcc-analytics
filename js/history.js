let app = angular.module('AbccTools', ['ngMaterial', 'ngAnimate', 'md.data.table']);
let bg = chrome.extension.getBackgroundPage();

app.config(['$compileProvider', '$mdThemingProvider', function ($compileProvider, $mdThemingProvider) {
    'use strict';
    $compileProvider.debugInfoEnabled(false);
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('pink');
}]);

app.controller('Controller', function($scope, $window, $log) {

    $scope.account = {};
    bg._AbccTools.apiGetAccount().then(function (acc) {
        $scope.account = acc;
    });

    $scope.markets = {};
    bg._AbccTools.apiGetMarkets().then(function (res) {
        $scope.markets = res;
    });

    $scope.startDate = new Date();
    $scope.startDate.setDate($scope.startDate.getDate() - 1);
    $scope.endDate = new Date();

    $scope.volume = [];
    $scope.orders = [];

    $scope.query = {
        order: '-index',
        limit: 25,
        page: 1,
        options: [25, 50, 100],
    };

    $scope.process = false;
    $scope.unitVolume = {};
    $scope.quoteVolume = {};

    function formatDate(date) {

        let dd = date.getDate();
        if (dd < 10) dd = '0' + dd;

        let mm = date.getMonth() + 1;
        if (mm < 10) mm = '0' + mm;

        let yy = date.getFullYear();

        return yy + '.' + mm + '.' + dd;
    }


    $scope.loadData = function () {
        $scope.process = true;
        $scope.unitVolume = {};

        bg._AbccTools.apiGetHistory(formatDate($scope.startDate), formatDate($scope.endDate)).then(function (items) {

            $scope.orders = items;
            $scope.process = false;

            for (let i in items) {
                let mk = $scope.markets[items[i].Market];

                if (mk == undefined) {
                    continue;
                }
                if ($scope.unitVolume[mk.base_unit] == undefined) {
                    $scope.unitVolume[mk.base_unit] = {
                        unit: mk.base_unit,
                        amount: parseFloat(items[i].Volume),
                        volume: {
                            btc: 0,
                            eth: 0,
                            usdt: 0,
                        }
                    }
                } else {
                    $scope.unitVolume[mk.base_unit].amount += parseFloat(items[i].Volume)
                    $scope.unitVolume[mk.base_unit].volume[mk.quote_unit] += parseFloat(items[i].Amount)
                }
            }

            $scope.$apply();
        });
    };

});