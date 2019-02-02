'use strict';

const EXT_HOST = "abcc.com";
const EXT_NAME = "ABCC:";
const MSG_INIT = "init core";
const QUOTE = ["usdt", "eth", "btc"];

const csvToJson = csv => {
    const [firstLine, ...lines] = csv.split('\n');
    return lines.map(line =>
        firstLine.split(',').reduce(
            (curr, next, index) => ({
                ...curr,
                [next]: line.split(',')[index],
            }),
            {}
        )
    );
};

class AbccTools {

    /**
     * _construct
     */
    constructor() {
        this.api_uri = 'https://' + EXT_HOST;
        this.cookies = [];
    }

    /**
     * Init application
     */
    init () {
        console.info(EXT_NAME, MSG_INIT);
        let $self = this;
        $self.Cookie().then(function (res) {
            $self.cookies = res;
        });
    };

    /**
     * Load cookie
     * @return {Promise}
     * @constructor
     */
    Cookie () {
        return new Promise(function(resolve, reject) {
            chrome.cookies.getAll({}, function (cookie) {
                resolve(cookie);
            });
        });
    };

    /**
     * Check user login
     * @return {Promise}
     */
    User () {

        let $self = this;

        return new Promise(function (resolve, reject) {

            let isUser = false;

            for (let i in $self.cookies) {
                if ($self.cookies[i].name == "_session") {
                    isUser = true;
                    break;
                }
            }

            if (isUser) {
                $self.apiGetAccount().then(function (user) {
                    resolve(user);
                });
            } else {
                resolve(false);
            }
        });
    };

    /**
     * Get CSRF token value
     * @return {boolean}
     */
    getCsrf () {

        let $self = this;
        for (let i in $self.cookies) {
            if ($self.cookies[i].name == "csrfToken") {
                return $self.cookies[i].value;
            }
        }
        return false;
    };

    /**
     * Get account
     * @return {*}
     */
    getAccount() {
        return this.account ? this.account : false
    }


    /**
     * Load account info
     * @return {Promise}
     * @constructor
     */
    async apiGetAccount () {

        let $self = this;
        let $query = {
            "operationName": "getAccounts",
            "variables":{},
            "query":"query getAccounts {\n  optionBalance {\n    currency\n    balance\n    locked\n    deposit_address\n    memo\n    default_withdraw_fund_source_id\n    minimum_withdraw_amount\n    withdraw_fee\n    require_memo\n    readable_name\n    withdraw_amount_h24\n    withdraw_amount_max_h24\n    min_confirmations\n    max_confirmations\n    can_deposit\n    can_withdraw\n    vote_currency\n    withdraw_fixed\n    fee\n    __typename\n  }\n}\n"
        };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: $self.api_uri + "/graphql",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify($query),
                headers: {
                    "x-csrf-token": $self.getCsrf(),
                },
                success: function(res){
                    if (res.data) {
                        resolve(res.data);
                    } else {
                        resolve(false);
                    }
                },
                error: function () {
                    resolve(false);
                }

            });
        });
    }

    /**
     * Lad history csv
     * @param from
     * @param to
     * @return {Promise}
     */
    async apiGetHistory (from, to) {

        let $self = this;

        if (from == "") {
            from = "2019.01.20"
        }

        if (to == "") {
            to = "2019.02.09"
        }

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: $self.api_uri + "/history/trades.csv?per_page=1000&from="+from+"%2000:00:00&to="+to+"%2000:00:00",
                type: "GET",
                headers: {
                    "x-csrf-token": $self.getCsrf(),
                },
                success: function(res){
                    if (res) {
                        resolve(csvToJson(res));
                    } else {
                        resolve(false);
                    }
                },
                error: function () {
                    resolve(false);
                }

            });
        });
    }

    /**
     * Load liga stats
     * @return {Promise}
     */
    async apiGetLiga () {

        let $self = this;

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: "https://campaign." + EXT_HOST + "/trader_league/list/query",
                type: "GET",
                headers: {
                    "x-csrf-token": $self.getCsrf(),
                },
                success: function(res){
                    if (res) {
                        resolve(JSON.parse(res.data));
                    } else {
                        resolve(false);
                    }
                },
                error: function () {
                    resolve(false);
                }

            });
        });
    }


    /**
     * Load market data
     *
     * @return {Promise}
     */
    async apiGetMarkets () {

        let $self = this;
        let $query = {
            "operationName": "getTickers",
            "variables": {},
            "query": "query getTickers {\n  ticker {\n    markets\n    __typename\n  }\n}\n"
        };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: $self.api_uri + "/graphql",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify($query),
                headers: {
                    "x-csrf-token": $self.getCsrf(),
                },
                success: function(res){
                    if (res.data && res.data.ticker.markets) {
                        resolve(res.data.ticker.markets);
                    } else {
                        resolve(false);
                    }
                },
                error: function () {
                    resolve(false);
                }

            });
        });
    }

}

window.onload = function () {
    window._AbccTools = new AbccTools();
    window._AbccTools.init();
    setInterval(function () {
        window._AbccTools.init();
    }, 10000);
};